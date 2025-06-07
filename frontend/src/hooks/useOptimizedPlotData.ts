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
  const filterDebounceTimerRef = useRef<number | undefined>(undefined);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Generate cache key from bounds and filters
  const generateCacheKey = useCallback((bounds: MapBounds): string => {
    const precision = 4; // Reduce precision for better cache hits
    const boundsKey = `${bounds.north.toFixed(precision)}_${bounds.south.toFixed(precision)}_${bounds.east.toFixed(precision)}_${bounds.west.toFixed(precision)}`;
    
    // Include filter parameters in cache key to ensure different filters have separate cache entries
    const filterKey = filters ? JSON.stringify(filters) : 'no-filters';
    
    return `${boundsKey}_${filterKey}`;
  }, [filters]);

  // Check if bounds are significantly different (to avoid unnecessary requests)
  const boundsChanged = useCallback((newBounds: MapBounds, oldBounds: MapBounds | null): boolean => {
    if (!oldBounds) return true;
    
    // Check if new bounds are fully contained within old bounds (zoom in case)
    const isZoomIn = 
      newBounds.north <= oldBounds.north && 
      newBounds.south >= oldBounds.south && 
      newBounds.east <= oldBounds.east && 
      newBounds.west >= oldBounds.west;
    
    // If it's a zoom in operation, don't refetch data
    if (isZoomIn) return false;
    
    // For pan operations, use a threshold to avoid small movements triggering refetch
    const threshold = 0.005; // Minimum change threshold
    return (
      Math.abs(newBounds.north - oldBounds.north) > threshold ||
      Math.abs(newBounds.south - oldBounds.south) > threshold ||
      Math.abs(newBounds.east - oldBounds.east) > threshold ||
      Math.abs(newBounds.west - oldBounds.west) > threshold
    );
  }, []);

  // Clean expired cache entries
  const cleanCache = useCallback(() => {
    const now = Date.now();
    const cache = cacheRef.current;
    const keys = Object.keys(cache);
    
    // Remove expired entries
    keys.forEach(key => {
      if (now - cache[key].timestamp > cacheTimeout) {
        delete cache[key];
      }
    });

    // Remove oldest entries if cache is too large
    const remainingKeys = Object.keys(cache);
    if (remainingKeys.length > maxCacheSize) {
      const sortedKeys = remainingKeys.sort((a, b) => cache[a].timestamp - cache[b].timestamp);
      const keysToRemove = sortedKeys.slice(0, remainingKeys.length - maxCacheSize);
      keysToRemove.forEach(key => delete cache[key]);
    }
  }, [cacheTimeout, maxCacheSize]);

  // Apply client-side filters to plots
  const applyFilters = useCallback((plotsData: PlotDto[], filterParams?: PlotFilterParams): PlotDto[] => {
    if (!filterParams) return plotsData;

    return plotsData.filter(plot => {
      // Price range filter
      if (filterParams.minPrice !== undefined || filterParams.maxPrice !== undefined) {
        // Convert plot price to the current currency and area unit for comparison
        const { price: priceInAreaUnit } = convertToPreferredAreaUnit(
          plot.price, 
          plot.priceUnit || 'per_sqft', 
          areaUnit
        );
        const convertedPrice = convertCurrency(priceInAreaUnit, 'INR', currency);
        
        if (filterParams.minPrice !== undefined && convertedPrice < filterParams.minPrice) {
          return false;
        }
        if (filterParams.maxPrice !== undefined && convertedPrice > filterParams.maxPrice) {
          return false;
        }
      }

      // Status filter
      if (filterParams.status !== undefined) {
        if (filterParams.status === 'for_sale' && !plot.isForSale) return false;
        if (filterParams.status === 'not_for_sale' && plot.isForSale) return false;
      }

      // Date range filter
      if (filterParams.dateFrom || filterParams.dateTo) {
        const plotDate = new Date(plot.createdAt || '');
        if (filterParams.dateFrom && plotDate < new Date(filterParams.dateFrom)) return false;
        if (filterParams.dateTo && plotDate > new Date(filterParams.dateTo)) return false;
      }

      // Location filter (radius-based)
      if (filterParams.centerLat !== undefined && filterParams.centerLng !== undefined && filterParams.radius !== undefined) {
        const distance = calculateDistance(
          plot.latitude,
          plot.longitude,
          filterParams.centerLat,
          filterParams.centerLng
        );
        if (distance > filterParams.radius) return false;
      }

      // Search query filter
      if (filterParams.search) {
        const searchLower = filterParams.search.toLowerCase();
        const description = (plot.description || '').toLowerCase();
        if (!description.includes(searchLower)) return false;
      }

      return true;
    });
  }, [currency, areaUnit]);

  // Helper function to calculate distance between two points in meters
  const calculateDistance = useCallback((lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  }, []);

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
      
      // Apply filters to the fetched data
      const filteredPlots = applyFilters(plotsData, filters);
      
      // Cache the filtered result
      cacheRef.current[cacheKey] = {
        data: filteredPlots,
        timestamp: now,
        bounds
      };

      // Clean cache periodically
      cleanCache();

      return filteredPlots;
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        throw new Error('Request was cancelled');
      }
      throw error;
    }
  }, [generateCacheKey, cacheTimeout, cleanCache, applyFilters, filters]);

  // Debounced plot loading
  const loadPlotsDebounced = useCallback((bounds: MapBounds) => {
    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer
    debounceTimerRef.current = setTimeout(async () => {
      const boundsSignificantlyChanged = boundsChanged(bounds, lastBounds);
      
      if (!boundsSignificantlyChanged) {
        // Still update lastBounds for accurate plot statistics even if we don't refetch
        setLastBounds(bounds);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const plotsData = await getCachedOrFetchPlots(bounds);
        
        // Always update plots with new viewport data to ensure stats are accurate
        setPlots(plotsData);
        
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
  }, [debounceDelay, boundsChanged, lastBounds, getCachedOrFetchPlots]);

  // Load plots for viewport
  const loadPlotsInViewport = useCallback((bounds: MapBounds) => {
    if (enableViewportLoading) {
      loadPlotsDebounced(bounds);
    }
  }, [enableViewportLoading, loadPlotsDebounced]);

  // Debounced filter update
  const applyFiltersDebounced = useCallback(() => {
    // Clear existing filter timer
    if (filterDebounceTimerRef.current) {
      clearTimeout(filterDebounceTimerRef.current);
    }

    // Set new timer for filter updates
    filterDebounceTimerRef.current = setTimeout(async () => {
      if (lastBounds) {
        setLoading(true);
        setError(null);

        try {
          const plotsData = await getCachedOrFetchPlots(lastBounds);
          setPlots(plotsData);
        } catch (error) {
          if ((error as Error).message !== 'Request was cancelled') {
            console.error('Error applying filters:', error);
            setError(error instanceof Error ? error.message : 'Failed to apply filters');
          }
        } finally {
          setLoading(false);
        }
      }
    }, debounceDelay);
  }, [lastBounds, getCachedOrFetchPlots, debounceDelay]);

  // Apply filters when they change (debounced)
  useEffect(() => {
    applyFiltersDebounced();
  }, [filters, applyFiltersDebounced]);

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
    console.log('🔄 Recalculating plotStats with currency:', currency, 'and areaUnit:', areaUnit);
    
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
          console.log(`💰 Converting ${p.price} ${p.priceUnit || 'per_sqft'} → ${priceInAreaUnit} ${areaUnit} → ${convertedPrice} ${currency}`);
          return sum + convertedPrice;
        }, 0) / visiblePlots.length 
      : 0;

    const result = {
      total: visiblePlots.length,
      forSale,
      notForSale,
      averagePrice: avgPrice
    };
    
    console.log('📊 New plotStats:', result);
    return result;
  }, [plots, lastBounds, currency, areaUnit]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (filterDebounceTimerRef.current) {
        clearTimeout(filterDebounceTimerRef.current);
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
        // Force reload by bypassing the bounds change check
        setLoading(true);
        setError(null);
        
        getCachedOrFetchPlots(lastBounds).then(plotsData => {
          setPlots(plotsData);
          setLoading(false);
        }).catch(error => {
          if ((error as Error).message !== 'Request was cancelled') {
            console.error('Error refreshing plots:', error);
            setError(error instanceof Error ? error.message : 'Failed to refresh plots');
          }
          setLoading(false);
        });
      }
    }
  };
}; 