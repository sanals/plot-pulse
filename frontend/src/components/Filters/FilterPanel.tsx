import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useFilters } from '../../contexts/FilterContext';
import { useSettings } from '../../contexts/SettingsContext';
import { useGeolocationContext } from '../../contexts/GeolocationContext';
import { getCurrencySymbol } from '../../utils/currencyUtils';
import type { PlotFilters } from '../../types/plot.types';
import './FilterPanel.css';

interface GeocodeResult {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
}

export const FilterPanel: React.FC = () => {
  const {
    filters,
    updateFilter,
    clearFilters,
    isFilterPanelOpen,
    setFilterPanelOpen,
    hasActiveFilters,
    activeFilterCount,
  } = useFilters();
  
  const { currency, areaUnit } = useSettings();
  const { position } = useGeolocationContext();
  
  // Local state for price inputs to allow typing
  const [priceInputs, setPriceInputs] = useState({
    min: filters.priceRange.min?.toString() || '',
    max: filters.priceRange.max?.toString() || '',
  });

  // Local state for location address
  const [locationAddress, setLocationAddress] = useState(filters.location.address);
  const [locationSuggestions, setLocationSuggestions] = useState<GeocodeResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodingError, setGeocodingError] = useState<string | null>(null);
  const locationInputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<number | undefined>(undefined);

  // Update local price inputs when filters change externally
  useEffect(() => {
    setPriceInputs({
      min: filters.priceRange.min?.toString() || '',
      max: filters.priceRange.max?.toString() || '',
    });
  }, [filters.priceRange.min, filters.priceRange.max]);

  // Update local address when filters change externally
  useEffect(() => {
    setLocationAddress(filters.location.address);
  }, [filters.location.address]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const handlePriceChange = useCallback((field: 'min' | 'max', value: string) => {
    // Update local state immediately for smooth typing
    setPriceInputs(prev => ({ ...prev, [field]: value }));
    
    // Debounced update to filters
    const numValue = value === '' ? null : parseFloat(value);
    if (!isNaN(numValue!) || value === '') {
      updateFilter('priceRange', {
        ...filters.priceRange,
        [field]: numValue,
      });
    }
  }, [filters.priceRange, updateFilter]);

  const handleStatusChange = useCallback((status: PlotFilters['status']) => {
    updateFilter('status', status);
  }, [updateFilter]);

  const handleDateChange = useCallback((dateAdded: PlotFilters['dateAdded']) => {
    updateFilter('dateAdded', dateAdded);
  }, [updateFilter]);

  const handleLocationToggle = useCallback((enabled: boolean) => {
    updateFilter('location', {
      ...filters.location,
      enabled,
      center: enabled && position ? {
        lat: position.latitude,
        lng: position.longitude,
      } : filters.location.center,
    });
  }, [filters.location, position, updateFilter]);

  const handleRadiusChange = useCallback((radius: number) => {
    updateFilter('location', {
      ...filters.location,
      radius,
    });
  }, [filters.location, updateFilter]);

  const handleSearchChange = useCallback((searchQuery: string) => {
    updateFilter('searchQuery', searchQuery);
  }, [updateFilter]);

  // Parse coordinates from input (supports various formats)
  const parseCoordinates = useCallback((input: string): { lat: number; lng: number } | null => {
    const cleaned = input.trim().replace(/\s+/g, ' ');
    
    // Pattern 1: "lat, lng" or "lat,lng"
    const pattern1 = /^(-?\d+\.?\d*),?\s*(-?\d+\.?\d*)$/;
    const match1 = cleaned.match(pattern1);
    if (match1) {
      const lat = parseFloat(match1[1]);
      const lng = parseFloat(match1[2]);
      if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        return { lat, lng };
      }
    }

    // Pattern 2: "lat lng" (space separated)
    const pattern2 = /^(-?\d+\.?\d*)\s+(-?\d+\.?\d*)$/;
    const match2 = cleaned.match(pattern2);
    if (match2) {
      const lat = parseFloat(match2[1]);
      const lng = parseFloat(match2[2]);
      if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        return { lat, lng };
      }
    }

    return null;
  }, []);

  // Geocode location name using Nominatim (OpenStreetMap)
  const geocodeLocation = useCallback(async (query: string): Promise<GeocodeResult[]> => {
    try {
      const trimmedQuery = query.trim();
      if (!trimmedQuery) return [];

      // Try multiple search strategies for better partial matching
      const searchQueries = [
        trimmedQuery, // Primary search
        trimmedQuery.toLowerCase(), // Lowercase variant
      ];

      const allResults: GeocodeResult[] = [];
      const seenIds = new Set<string>();

      // Try each search query
      for (const searchQuery of searchQueries) {
        try {
          // First try: General search with higher limit
          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=15&addressdetails=1&dedupe=1`,
            {
              headers: {
                'User-Agent': 'PlotPulse/1.0 (https://plotpulse.app)',
              },
            }
          );
          
          if (!response.ok) {
            continue;
          }

          const data = await response.json();
          
          if (Array.isArray(data) && data.length > 0) {
            // Add results, avoiding duplicates by location
            for (const item of data) {
              const lat = parseFloat(item.lat);
              const lng = parseFloat(item.lon);
              const locationKey = `${lat.toFixed(4)}_${lng.toFixed(4)}`;
              
              if (!seenIds.has(locationKey)) {
                seenIds.add(locationKey);
                allResults.push({
                  id: `geocoded-${allResults.length}`,
                  name: item.display_name || item.name || 'Unknown Location',
                  latitude: lat,
                  longitude: lng,
                });
              }
            }
          }
        } catch (err) {
          // Continue to next query if this one fails
          continue;
        }
      }

      // If we got results, return them (limit to 15 best matches)
      if (allResults.length > 0) {
        return allResults.slice(0, 15);
      }

      // Fallback: Try searching as city/town/village only
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(trimmedQuery)}&limit=15&addressdetails=1&dedupe=1&featuretype=city,town,village`,
          {
            headers: {
              'User-Agent': 'PlotPulse/1.0 (https://plotpulse.app)',
            },
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data) && data.length > 0) {
            return data.map((item: any, index: number) => ({
              id: `geocoded-${index}`,
              name: item.display_name || item.name || 'Unknown Location',
              latitude: parseFloat(item.lat),
              longitude: parseFloat(item.lon),
            }));
          }
        }
      } catch (err) {
        // Fall through to return empty array
      }

      return [];
    } catch (error) {
      console.error('Geocoding error:', error);
      return [];
    }
  }, []);

  // Handle location address input with debouncing and geocoding
  const handleLocationAddressChange = useCallback((value: string) => {
    setLocationAddress(value);
    setShowSuggestions(false);
    setLocationSuggestions([]);
    setGeocodingError(null);

    // Clear existing debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // If empty, clear the location center
    if (!value.trim()) {
      updateFilter('location', {
        ...filters.location,
        center: null,
        address: '',
      });
      return;
    }

    // Try parsing as coordinates first
    const coords = parseCoordinates(value);
    if (coords) {
      updateFilter('location', {
        ...filters.location,
        enabled: true, // Enable location filter when coordinates are set
        center: coords,
        address: value,
      });
      return;
    }

    // Debounce geocoding for address search
    debounceRef.current = window.setTimeout(async () => {
      const trimmedValue = value.trim();
      if (trimmedValue.length >= 2) { // Reduced from 3 to 2 for earlier results
        setIsGeocoding(true);
        setGeocodingError(null);
        try {
          const results = await geocodeLocation(trimmedValue);
          
          if (results.length > 0) {
            setLocationSuggestions(results);
            setShowSuggestions(true);
            setGeocodingError(null);
          } else {
            setLocationSuggestions([]);
            setShowSuggestions(false);
            // Only show error if query is long enough to be meaningful
            if (trimmedValue.length >= 4) {
              setGeocodingError('No locations found. Try a different search term.');
            }
          }
        } catch (error) {
          setGeocodingError('Failed to search locations. Please try again.');
          setLocationSuggestions([]);
          setShowSuggestions(false);
        } finally {
          setIsGeocoding(false);
        }
      }
    }, 400); // Reduced debounce from 500ms to 400ms for faster response
  }, [filters.location, parseCoordinates, geocodeLocation, updateFilter]);

  // Handle suggestion selection
  const handleSelectSuggestion = useCallback((suggestion: GeocodeResult) => {
    setLocationAddress(suggestion.name);
    updateFilter('location', {
      ...filters.location,
      enabled: true, // Enable location filter when suggestion is selected
      center: {
        lat: suggestion.latitude,
        lng: suggestion.longitude,
      },
      address: suggestion.name,
    });
    setShowSuggestions(false);
    setLocationSuggestions([]);
  }, [filters.location, updateFilter]);

  const handleUseCurrentLocation = useCallback(() => {
    if (position) {
      updateFilter('location', {
        ...filters.location,
        center: {
          lat: position.latitude,
          lng: position.longitude,
        },
        address: 'Current Location',
      });
      setLocationAddress('Current Location');
      setShowSuggestions(false);
    }
  }, [filters.location, position, updateFilter]);

  const handleClosePanelClick = useCallback(() => {
    setFilterPanelOpen(false);
  }, [setFilterPanelOpen]);

  const handleClearFilters = useCallback(() => {
    clearFilters();
    // The local state will be updated by the useEffect hooks when filters change
  }, [clearFilters]);

  const areaUnitLabels = {
    sqft: '/sqft',
    sqm: '/sqm',
    cent: '/cent',
    acre: '/acre',
  };

  return (
    <>
      {/* Backdrop */}
      {isFilterPanelOpen && (
        <div 
          className="filter-panel-backdrop"
          onClick={handleClosePanelClick}
        />
      )}
      
      {/* Filter Panel */}
      <div className={`filter-panel ${isFilterPanelOpen ? 'filter-panel-open' : ''}`}>
        {/* Header */}
        <div className="filter-panel-header">
          <div className="filter-panel-title">
            <h3>Filters</h3>
            {hasActiveFilters && (
              <span className="active-filter-badge">
                {activeFilterCount}
              </span>
            )}
          </div>
          <div className="filter-panel-actions">
            {hasActiveFilters && (
              <button 
                className="btn btn-link clear-filters-btn"
                onClick={handleClearFilters}
                title="Clear all filters"
              >
                Clear All
              </button>
            )}
            <button
              className="filter-panel-close"
              onClick={handleClosePanelClick}
              title="Close filters"
            >
              ×
            </button>
          </div>
        </div>

        {/* Filter Content */}
        <div className="filter-panel-content">
          
          {/* Location Filter */}
          <div className={`filter-section ${!filters.location.enabled ? 'filter-section-compact' : ''}`}>
            <div className="filter-checkbox-header">
              <label className="checkbox-option">
                <input
                  type="checkbox"
                  checked={filters.location.enabled}
                  onChange={(e) => handleLocationToggle(e.target.checked)}
                />
                <span>Filter by Location</span>
              </label>
            </div>
            
            {filters.location.enabled && (
              <div className="location-filter-content">
                <div className="location-center">
                  <label className="filter-label">Center Point</label>
                  <div className="location-center-controls">
                    <div className="location-input-wrapper">
                      <input
                        ref={locationInputRef}
                        type="text"
                        className="filter-input"
                        placeholder="Enter full city name / coordinates"
                        value={locationAddress}
                        onChange={(e) => handleLocationAddressChange(e.target.value)}
                        onFocus={() => {
                          if (locationSuggestions.length > 0) {
                            setShowSuggestions(true);
                          }
                        }}
                        onBlur={() => {
                          // Delay to allow suggestion click
                          setTimeout(() => setShowSuggestions(false), 200);
                        }}
                      />
                      {isGeocoding && (
                        <span className="geocoding-indicator">🔍</span>
                      )}
                      {showSuggestions && locationSuggestions.length > 0 && (
                        <div className="location-suggestions">
                          {locationSuggestions.map((suggestion) => (
                            <div
                              key={suggestion.id}
                              className="location-suggestion-item"
                              onClick={() => handleSelectSuggestion(suggestion)}
                            >
                              <span className="suggestion-icon">📍</span>
                              <span className="suggestion-name">{suggestion.name}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {position && (
                      <button
                        className="btn btn-secondary use-location-btn"
                        onClick={handleUseCurrentLocation}
                        title="Use current location"
                      >
                        📍 Use Current
                      </button>
                    )}
                  </div>
                  {geocodingError && (
                    <div className="location-error">
                      <small style={{ color: '#ef4444' }}>
                        {geocodingError}
                      </small>
                    </div>
                  )}
                  {filters.location.center && (
                    <div className="location-coordinates">
                      <small style={{ color: '#6B7280' }}>
                        {filters.location.center.lat.toFixed(4)}, {filters.location.center.lng.toFixed(4)}
                      </small>
                    </div>
                  )}
                </div>
                
                <div className="radius-control">
                  <label className="filter-label">
                    Radius: {filters.location.radius} km
                  </label>
                  <input
                    type="range"
                    className="radius-slider"
                    min="1"
                    max="50"
                    step="1"
                    value={filters.location.radius}
                    onChange={(e) => handleRadiusChange(parseInt(e.target.value))}
                  />
                  <div className="radius-labels">
                    <span>1 km</span>
                    <span>50 km</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Price Range */}
          <div className="filter-section">
            <label className="filter-label">
              Price Range ({getCurrencySymbol(currency)}{areaUnitLabels[areaUnit]})
            </label>
            <div className="price-range-inputs">
              <input
                type="number"
                className="filter-input price-input"
                placeholder="Min"
                value={priceInputs.min}
                onChange={(e) => handlePriceChange('min', e.target.value)}
                min="0"
              />
              <span className="price-separator">to</span>
              <input
                type="number"
                className="filter-input price-input"
                placeholder="Max"
                value={priceInputs.max}
                onChange={(e) => handlePriceChange('max', e.target.value)}
                min="0"
              />
            </div>
          </div>

          {/* Plot Status */}
          <div className="filter-section">
            <label className="filter-label">Plot Status</label>
            <div className="toggle-group">
              <button
                className={`toggle-btn ${filters.status === 'all' ? 'active' : ''}`}
                onClick={() => handleStatusChange('all')}
                title="Show all plots"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="8" y1="6" x2="21" y2="6"/>
                  <line x1="8" y1="12" x2="21" y2="12"/>
                  <line x1="8" y1="18" x2="21" y2="18"/>
                  <line x1="3" y1="6" x2="3.01" y2="6"/>
                  <line x1="3" y1="12" x2="3.01" y2="12"/>
                  <line x1="3" y1="18" x2="3.01" y2="18"/>
                </svg>
                <span>All</span>
              </button>
              <button
                className={`toggle-btn ${filters.status === 'for_sale' ? 'active' : ''}`}
                onClick={() => handleStatusChange('for_sale')}
                title="Show plots for sale"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="9" cy="21" r="1"/>
                  <circle cx="20" cy="21" r="1"/>
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                </svg>
                <span>For Sale</span>
              </button>
              <button
                className={`toggle-btn ${filters.status === 'not_for_sale' ? 'active' : ''}`}
                onClick={() => handleStatusChange('not_for_sale')}
                title="Show plots not for sale"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6L6 18"/>
                  <path d="M6 6l12 12"/>
                </svg>
                <span>Not For Sale</span>
              </button>
            </div>
          </div>

          {/* Date Added */}
          <div className="filter-section">
            <label className="filter-label">Date Added</label>
            <select
              className="filter-select"
              value={filters.dateAdded}
              onChange={(e) => handleDateChange(e.target.value as PlotFilters['dateAdded'])}
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Past Week</option>
              <option value="month">Past Month</option>
              <option value="quarter">Past 3 Months</option>
            </select>
          </div>

          {/* Search */}
          <div className="filter-section">
            <div className="floating-label-input">
              <input
                type="text"
                className="filter-input floating-input"
                placeholder=" "
                value={filters.searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
              <label className="floating-label">Search in descriptions...</label>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}; 