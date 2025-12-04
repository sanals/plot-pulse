import React, { useState, useCallback, useEffect } from 'react';
import { useFilters } from '../../contexts/FilterContext';
import { useSettings } from '../../contexts/SettingsContext';
import { useGeolocationContext } from '../../contexts/GeolocationContext';
import { getCurrencySymbol } from '../../utils/currencyUtils';
import type { PlotFilters } from '../../types/plot.types';
import './FilterPanel.css';

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
          
          {/* Search */}
          <div className="filter-section">
            <label className="filter-label">Search</label>
            <input
              type="text"
              className="filter-input"
              placeholder="Search in descriptions..."
              value={filters.searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
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

          {/* Location Filter */}
          <div className="filter-section">
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
                    <input
                      type="text"
                      className="filter-input"
                      placeholder="Enter address or use current location"
                      value={locationAddress}
                      onChange={(e) => setLocationAddress(e.target.value)}
                    />
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

        </div>
      </div>
    </>
  );
}; 