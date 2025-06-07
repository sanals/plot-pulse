import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { PlotFilters, PlotFilterParams } from '../types/plot.types';
import { useGeolocationContext } from './GeolocationContext';

// Default filter state
const DEFAULT_FILTERS: PlotFilters = {
  priceRange: {
    min: null,
    max: null,
  },
  status: 'all',
  dateAdded: 'all',
  location: {
    enabled: false,
    radius: 5, // 5km default
    center: null,
    address: '',
  },
  searchQuery: '',
};

interface FilterContextType {
  filters: PlotFilters;
  setFilters: (filters: PlotFilters) => void;
  updateFilter: <K extends keyof PlotFilters>(key: K, value: PlotFilters[K]) => void;
  clearFilters: () => void;
  isFilterPanelOpen: boolean;
  setFilterPanelOpen: (open: boolean) => void;
  getFilterParams: () => PlotFilterParams;
  hasActiveFilters: boolean;
  activeFilterCount: number;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export const useFilters = () => {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error('useFilters must be used within a FilterProvider');
  }
  return context;
};

export const FilterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { position } = useGeolocationContext();
  const [filters, setFiltersState] = useState<PlotFilters>(DEFAULT_FILTERS);
  const [isFilterPanelOpen, setFilterPanelOpen] = useState(false);

  // Initialize filters from URL parameters on mount
  useEffect(() => {
    const filtersFromUrl = parseFiltersFromUrl(searchParams);
    if (filtersFromUrl) {
      setFiltersState(filtersFromUrl);
    }
  }, []); // Only on mount

  // Update URL when filters change (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      updateUrlFromFilters(filters, setSearchParams);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [filters, setSearchParams]);

  // Auto-set location center when geolocation is available
  useEffect(() => {
    if (position && !filters.location.center && filters.location.enabled) {
      updateFilter('location', {
        ...filters.location,
        center: {
          lat: position.latitude,
          lng: position.longitude,
        },
      });
    }
  }, [position, filters.location]);

  const setFilters = useCallback((newFilters: PlotFilters) => {
    setFiltersState(newFilters);
  }, []);

  const updateFilter = useCallback(<K extends keyof PlotFilters>(key: K, value: PlotFilters[K]) => {
    setFiltersState(prev => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  const clearFilters = useCallback(() => {
    // Create a deep copy to ensure all nested objects are properly reset
    setFiltersState({
      priceRange: {
        min: null,
        max: null,
      },
      status: 'all',
      dateAdded: 'all',
      location: {
        enabled: false,
        radius: 5,
        center: null,
        address: '',
      },
      searchQuery: '',
    });
  }, []);

  // Convert filters to API parameters
  const getFilterParams = useCallback((): PlotFilterParams => {
    const params: PlotFilterParams = {};

    // Price range
    if (filters.priceRange.min !== null) {
      params.minPrice = filters.priceRange.min;
    }
    if (filters.priceRange.max !== null) {
      params.maxPrice = filters.priceRange.max;
    }

    // Status
    if (filters.status !== 'all') {
      params.status = filters.status;
    }

    // Date range
    if (filters.dateAdded !== 'all') {
      const dateRange = getDateRange(filters.dateAdded);
      if (dateRange.from) params.dateFrom = dateRange.from;
      if (dateRange.to) params.dateTo = dateRange.to;
    }

    // Location
    if (filters.location.enabled && filters.location.center) {
      params.centerLat = filters.location.center.lat;
      params.centerLng = filters.location.center.lng;
      params.radius = filters.location.radius * 1000; // Convert km to meters for API
    }

    // Search query
    if (filters.searchQuery.trim()) {
      params.search = filters.searchQuery.trim();
    }

    return params;
  }, [filters]);

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return (
      filters.priceRange.min !== null ||
      filters.priceRange.max !== null ||
      filters.status !== 'all' ||
      filters.dateAdded !== 'all' ||
      filters.location.enabled ||
      filters.searchQuery.trim() !== ''
    );
  }, [filters]);

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.priceRange.min !== null || filters.priceRange.max !== null) count++;
    if (filters.status !== 'all') count++;
    if (filters.dateAdded !== 'all') count++;
    if (filters.location.enabled) count++;
    if (filters.searchQuery.trim() !== '') count++;
    return count;
  }, [filters]);

  const value: FilterContextType = {
    filters,
    setFilters,
    updateFilter,
    clearFilters,
    isFilterPanelOpen,
    setFilterPanelOpen,
    getFilterParams,
    hasActiveFilters,
    activeFilterCount,
  };

  return <FilterContext.Provider value={value}>{children}</FilterContext.Provider>;
};

// Helper functions
const parseFiltersFromUrl = (searchParams: URLSearchParams): PlotFilters | null => {
  try {
    const filters: PlotFilters = { ...DEFAULT_FILTERS };
    let hasFilters = false;

    // Price range
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    if (minPrice) {
      filters.priceRange.min = parseFloat(minPrice);
      hasFilters = true;
    }
    if (maxPrice) {
      filters.priceRange.max = parseFloat(maxPrice);
      hasFilters = true;
    }

    // Status
    const status = searchParams.get('status');
    if (status && ['for_sale', 'not_for_sale'].includes(status)) {
      filters.status = status as 'for_sale' | 'not_for_sale';
      hasFilters = true;
    }

    // Date
    const dateAdded = searchParams.get('dateAdded');
    if (dateAdded && ['today', 'week', 'month', 'quarter'].includes(dateAdded)) {
      filters.dateAdded = dateAdded as 'today' | 'week' | 'month' | 'quarter';
      hasFilters = true;
    }

    // Location
    const centerLat = searchParams.get('centerLat');
    const centerLng = searchParams.get('centerLng');
    const radius = searchParams.get('radius');
    if (centerLat && centerLng) {
      filters.location.enabled = true;
      filters.location.center = {
        lat: parseFloat(centerLat),
        lng: parseFloat(centerLng),
      };
      if (radius) {
        filters.location.radius = parseFloat(radius);
      }
      hasFilters = true;
    }

    // Search
    const search = searchParams.get('search');
    if (search) {
      filters.searchQuery = search;
      hasFilters = true;
    }

    return hasFilters ? filters : null;
  } catch (error) {
    console.error('Error parsing filters from URL:', error);
    return null;
  }
};

const updateUrlFromFilters = (filters: PlotFilters, setSearchParams: (params: URLSearchParams) => void) => {
  const params = new URLSearchParams();

  // Only add non-default values to URL
  if (filters.priceRange.min !== null) {
    params.set('minPrice', filters.priceRange.min.toString());
  }
  if (filters.priceRange.max !== null) {
    params.set('maxPrice', filters.priceRange.max.toString());
  }
  if (filters.status !== 'all') {
    params.set('status', filters.status);
  }
  if (filters.dateAdded !== 'all') {
    params.set('dateAdded', filters.dateAdded);
  }
  if (filters.location.enabled && filters.location.center) {
    params.set('centerLat', filters.location.center.lat.toString());
    params.set('centerLng', filters.location.center.lng.toString());
    params.set('radius', filters.location.radius.toString());
  }
  if (filters.searchQuery.trim()) {
    params.set('search', filters.searchQuery.trim());
  }

  setSearchParams(params);
};

const getDateRange = (period: string): { from?: string; to?: string } => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  switch (period) {
    case 'today':
      return {
        from: today.toISOString(),
        to: new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString(),
      };
    case 'week':
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      return {
        from: weekAgo.toISOString(),
        to: now.toISOString(),
      };
    case 'month':
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      return {
        from: monthAgo.toISOString(),
        to: now.toISOString(),
      };
    case 'quarter':
      const quarterAgo = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000);
      return {
        from: quarterAgo.toISOString(),
        to: now.toISOString(),
      };
    default:
      return {};
  }
}; 