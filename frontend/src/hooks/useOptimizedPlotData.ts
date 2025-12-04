import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { getPlotsInBounds, createPlot, updatePlot, deletePlot, getNearestPlot } from '../services/plotService';
import type { PlotDto, MapBounds, NearestPlotRequest, PlotFilterParams } from '../types/plot.types';
import { convertCurrency, getCurrencyInfo, type CurrencyCode } from '../utils/currencyUtils';
import { convertToPreferredAreaUnit } from '../utils/priceConversions';
import type { AreaUnit } from '../contexts/SettingsContext';

interface UseOptimizedPlotDataOptions {
  enableViewportLoading?: boolean;
  debounceDelay?: number;
  cacheTimeout?: number;
  maxCacheSize?: number;
  currency?: CurrencyCode;
  areaUnit?: AreaUnit;
  filters?: PlotFilterParams;
}

interface PlotCache {
  [key: string]: {
    data: PlotDto[];
    timestamp: number;
    bounds: MapBounds;
  };
}

/**
 * Optimized hook for plot data management with performance enhancements
 * 
 * Features:
 * - Viewport-based lazy loading
 * - Debounced API calls
 * - Intelligent caching with TTL
 * - Optimistic updates
 * - Memory management
 */
export const useOptimizedPlotData = (options: UseOptimizedPlotDataOptions = {}) => {
  const {
    enableViewportLoading = true,
    debounceDelay = 500,
    cacheTimeout = 30 * 60 * 1000, // 30 minutes
    maxCacheSize = 50,
    currency = 'INR',
    areaUnit = 'sqft',
    filters
  } = options;

  const [plots, setPlots] = useState<PlotDto[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastBounds, setLastBounds] = useState<MapBounds | null>(null);

  // Cache management
  const cacheRef = useRef<PlotCache>({});
  const debounceTimerRef = useRef<number | undefined>(undefined);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastFiltersRef = useRef(filters);

  // Memoize filter function to avoid recreating it on every render
  const applyFilters = useCallback((data: PlotDto[]): PlotDto[] => {
    if (!filters) return data;

    return data.filter(plot => {
      // Price range filter
      if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
        const { price: priceInAreaUnit } = convertToPreferredAreaUnit(
          plot.price,
          plot.priceUnit || 'per_sqft',
          areaUnit
        );
        const convertedPrice = convertCurrency(priceInAreaUnit, 'INR', currency);

        if (filters.minPrice !== undefined && convertedPrice < filters.minPrice) {
          return false;
        }
        if (filters.maxPrice !== undefined && convertedPrice > filters.maxPrice) {
          return false;
        }
      }

      // Status filter
      if (filters.status !== undefined) {
        if (filters.status === 'for_sale' && !plot.isForSale) return false;
        if (filters.status === 'not_for_sale' && plot.isForSale) return false;
      }

      // Date range filter
      if (filters.dateFrom || filters.dateTo) {
        const plotDate = new Date(plot.createdAt || '');
        if (filters.dateFrom && plotDate < new Date(filters.dateFrom)) return false;
        if (filters.dateTo && plotDate > new Date(filters.dateTo)) return false;
      }

      // Location filter (radius-based)
      if (filters.centerLat !== undefined && filters.centerLng !== undefined && filters.radius !== undefined) {
        const R = 6371e3; // Earth's radius in meters
        const φ1 = plot.latitude * Math.PI / 180;
        const φ2 = filters.centerLat * Math.PI / 180;
        const Δφ = (filters.centerLat - plot.latitude) * Math.PI / 180;
        const Δλ = (filters.centerLng - plot.longitude) * Math.PI / 180;

        const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                  Math.cos(φ1) * Math.cos(φ2) *
                  Math.sin(Δλ/2) * Math.sin(Δλ/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c;

        if (distance > filters.radius) return false;
      }

      // Search query filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const description = (plot.description || '').toLowerCase();
        if (!description.includes(searchLower)) return false;
      }

      return true;
    });
  }, [filters, areaUnit, currency]);

  // Check if filters have changed (using ref to avoid recreating function)
  const filtersStringRef = useRef<string>('');
  const haveFiltersChanged = useCallback(() => {
    const currentFiltersString = JSON.stringify(filters || {});
    const filtersChanged = currentFiltersString !== filtersStringRef.current;
    if (filtersChanged) {
      filtersStringRef.current = currentFiltersString;
      lastFiltersRef.current = filters;
    }
    return filtersChanged;
  }, [filters]);

  // Generate cache key from bounds only (filters applied client-side for better performance)
  const generateCacheKey = useCallback((bounds: MapBounds): string => {
    const precision = 4; // Reduce precision for better cache hits
    return `${bounds.north.toFixed(precision)}_${bounds.south.toFixed(precision)}_${bounds.east.toFixed(precision)}_${bounds.west.toFixed(precision)}`;
  }, []);

  // Clean cache when it exceeds maxCacheSize
  const cleanCache = useCallback(() => {
    const cacheEntries = Object.entries(cacheRef.current);
    if (cacheEntries.length > maxCacheSize) {
      const sortedEntries = cacheEntries.sort((a, b) => b[1].timestamp - a[1].timestamp);
      const entriesToKeep = sortedEntries.slice(0, maxCacheSize);
      cacheRef.current = Object.fromEntries(entriesToKeep);
    }
  }, [maxCacheSize]);

  // Get plots from cache or API
  const getCachedOrFetchPlots = useCallback(async (bounds: MapBounds): Promise<PlotDto[]> => {
    const cacheKey = generateCacheKey(bounds);
    const cached = cacheRef.current[cacheKey];
    const now = Date.now();

    // Return cached data if valid
    if (cached && (now - cached.timestamp) < cacheTimeout) {
      return cached.data;
    }

    // Abort previous request if still pending
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    try {
      const plotsData = await getPlotsInBounds(bounds);
      
      // Cache the raw unfiltered data
      cacheRef.current[cacheKey] = {
        data: plotsData,
        timestamp: now,
        bounds
      };

      // Clean cache periodically
      cleanCache();

      return plotsData;
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        throw new Error('Request was cancelled');
      }
      throw error;
    }
  }, [generateCacheKey, cacheTimeout, cleanCache]);

  // Debounced plot loading
  const loadPlotsDebounced = useCallback((bounds: MapBounds) => {
    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer
    debounceTimerRef.current = setTimeout(async () => {
      setLoading(true);
      setError(null);

      try {
        const plotsData = await getCachedOrFetchPlots(bounds);
        const filteredPlots = applyFilters(plotsData);
        setPlots(filteredPlots);
        setLastBounds(bounds);
      } catch (error) {
        if ((error as Error).message !== 'Request was cancelled') {
          console.error('Error loading plots:', error);
          setError(error instanceof Error ? error.message : 'Failed to load plots');
        }
      } finally {
        setLoading(false);
      }
    }, debounceDelay);
  }, [debounceDelay, getCachedOrFetchPlots, applyFilters]);

  // Load plots for viewport
  const loadPlotsInViewport = useCallback((bounds: MapBounds) => {
    if (enableViewportLoading) {
      loadPlotsDebounced(bounds);
    }
  }, [enableViewportLoading, loadPlotsDebounced]);

  // Function to refresh plots with current filters
  // Use ref to prevent infinite loops from state updates
  const isRefreshingRef = useRef(false);
  const refreshFilteredPlots = useCallback(() => {
    // Prevent multiple simultaneous refreshes
    if (isRefreshingRef.current) {
      return;
    }
    
    if (lastBounds) {
      isRefreshingRef.current = true;
      const cacheKey = generateCacheKey(lastBounds);
      const cached = cacheRef.current[cacheKey];
      
      if (cached) {
        // Apply filters to cached data without API call
        const filteredPlots = applyFilters(cached.data);
        setPlots(filteredPlots);
      } else {
        // If no cached data, do a full reload
        loadPlotsDebounced(lastBounds);
      }
      
      // Reset flag after a short delay to allow state updates to complete
      setTimeout(() => {
        isRefreshingRef.current = false;
      }, 100);
    }
  }, [lastBounds, generateCacheKey, applyFilters, loadPlotsDebounced]);

  // Check for filter changes and reapply if needed
  // Use a ref to track the previous filters string to avoid infinite loops
  const prevFiltersStringRef = useRef<string>('');
  const filtersEffectRunningRef = useRef(false);
  
  useEffect(() => {
    // Prevent concurrent executions
    if (filtersEffectRunningRef.current) {
      return;
    }
    
    const currentFiltersString = JSON.stringify(filters || {});
    
    // Only proceed if filters actually changed (not just reference)
    if (currentFiltersString !== prevFiltersStringRef.current) {
      filtersEffectRunningRef.current = true;
      prevFiltersStringRef.current = currentFiltersString;
      
      // Only refresh if we have bounds and filters actually changed
      if (lastBounds) {
        // Use setTimeout to break the synchronous update cycle
        setTimeout(() => {
          refreshFilteredPlots();
          filtersEffectRunningRef.current = false;
        }, 0);
      } else {
        filtersEffectRunningRef.current = false;
      }
    }
  }, [filters, lastBounds, refreshFilteredPlots]);

  // Optimistic create plot
  const createPlotOptimistic = useCallback(async (plotData: PlotDto): Promise<PlotDto> => {
    // Generate temporary ID for optimistic update
    const tempId = Date.now();
    const optimisticPlot = { ...plotData, id: tempId };

    // Add optimistically
    setPlots(prev => [...prev, optimisticPlot]);

    try {
      const newPlot = await createPlot(plotData);
      
      // Replace optimistic plot with real one
      setPlots(prev => prev.map(p => p.id === tempId ? newPlot : p));
      
      // Invalidate all cache entries since a new plot was added
      // This ensures fresh data is loaded the next time the user views this area
      cacheRef.current = {};

      return newPlot;
    } catch (error) {
      // Remove optimistic plot on error
      setPlots(prev => prev.filter(p => p.id !== tempId));
      throw error;
    }
  }, []);

  // Optimistic update plot
  const updatePlotOptimistic = useCallback(async (id: number, plotData: PlotDto): Promise<PlotDto> => {
    const originalPlot = plots.find(p => p.id === id);
    if (!originalPlot) throw new Error('Plot not found');

    // Update optimistically
    const optimisticPlot = { ...plotData, id };
    setPlots(prev => prev.map(p => p.id === id ? optimisticPlot : p));

    try {
      const updatedPlot = await updatePlot(id, plotData);
      
      // Replace with real updated plot
      setPlots(prev => prev.map(p => p.id === id ? updatedPlot : p));
      
      // Invalidate cache
      cacheRef.current = {};

      return updatedPlot;
    } catch (error) {
      // Revert on error
      setPlots(prev => prev.map(p => p.id === id ? originalPlot : p));
      throw error;
    }
  }, [plots]);

  // Optimistic delete plot
  const deletePlotOptimistic = useCallback(async (id: number): Promise<void> => {
    const originalPlot = plots.find(p => p.id === id);
    if (!originalPlot) throw new Error('Plot not found');

    // Remove optimistically
    setPlots(prev => prev.filter(p => p.id !== id));

    try {
      await deletePlot(id);
      
      // Invalidate cache
      cacheRef.current = {};
    } catch (error) {
      // Restore on error
      setPlots(prev => [...prev, originalPlot]);
      throw error;
    }
  }, [plots]);

  // Find nearest plot with caching
  const findNearestPlot = useCallback(async (request: NearestPlotRequest): Promise<PlotDto | null> => {
    try {
      return await getNearestPlot(request);
    } catch (error) {
      console.error('Error finding nearest plot:', error);
      return null;
    }
  }, []);

  // Memoized plot statistics - only for currently visible plots in viewport
  const plotStats = useMemo(() => {
    // If we have bounds, filter plots to only those within the current viewport
    let visiblePlots = plots;
    
    if (lastBounds) {
      visiblePlots = plots.filter(plot => {
        return plot.latitude >= lastBounds.south &&
               plot.latitude <= lastBounds.north &&
               plot.longitude >= lastBounds.west &&
               plot.longitude <= lastBounds.east;
      });
    }
    
    const forSale = visiblePlots.filter(p => p.isForSale).length;
    const notForSale = visiblePlots.length - forSale;
    
    // Convert each plot price to the selected currency and area unit before averaging
    const avgPrice = visiblePlots.length > 0 
      ? visiblePlots.reduce((sum, p) => {
          // First convert to preferred area unit
          const { price: priceInAreaUnit } = convertToPreferredAreaUnit(
            p.price, 
            p.priceUnit || 'per_sqft', 
            areaUnit
          );
          // Then convert currency
          const convertedPrice = convertCurrency(priceInAreaUnit, 'INR', currency);
          return sum + convertedPrice;
        }, 0) / visiblePlots.length 
      : 0;

    return {
      total: visiblePlots.length,
      forSale,
      notForSale,
      averagePrice: avgPrice
    };
  }, [plots, lastBounds, currency, areaUnit]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    plots,
    loading,
    error,
    plotStats,
    loadPlotsInViewport,
    createPlot: createPlotOptimistic,
    updatePlot: updatePlotOptimistic,
    deletePlot: deletePlotOptimistic,
    findNearestPlot,
    lastBounds,
    clearError: () => setError(null),
    refreshPlots: () => {
      cacheRef.current = {};
      if (lastBounds) {
        loadPlotsInViewport(lastBounds);
      }
    },
    refreshFilteredPlots
  };
}; 