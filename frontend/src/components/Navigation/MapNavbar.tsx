import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useGeolocationContext } from '../../contexts/GeolocationContext';
import { useSettings } from '../../contexts/SettingsContext';
import { getAllCurrencies, type CurrencyCode, getCurrencyInfo, refreshCurrencyRates } from '../../utils/currencyUtils';
import { useFilters } from '../../contexts/FilterContext';
import NavbarProfile from './NavbarProfile';
import UnifiedSearch from '../Search/UnifiedSearch';
import type { MarkerDisplayMode } from '../Map/PlotMarker';

interface SearchResult {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  type: 'coordinates' | 'geocoded' | 'current';
}

interface MapNavbarProps {
  markerDisplayMode: MarkerDisplayMode;
  onMarkerDisplayModeChange: (mode: MarkerDisplayMode) => void;
  showUserLocation: boolean;
  onLocationToggle: (show: boolean) => void;
  onShowLogin: () => void;
  onShowRegister: () => void;
  onNavigateToLocation: (lat: number, lng: number, zoom?: number) => void;
  onNavbarExpandChange?: (expanded: boolean) => void;
}

/**
 * Responsive navigation component for map controls
 * - Desktop: Side navbar (collapsible)
 * - Mobile: Top navbar with slide-out menu
 */
const MapNavbar: React.FC<MapNavbarProps> = ({
  markerDisplayMode,
  onMarkerDisplayModeChange,
  showUserLocation,
  onLocationToggle,
  onShowLogin,
  onShowRegister,
  onNavigateToLocation,
  onNavbarExpandChange
}) => {
  const { isAuthenticated } = useAuth();
  const { position, refreshLocation, loading: geoLoading } = useGeolocationContext();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [mapControlsExpanded, setMapControlsExpanded] = useState(false);
  const [settingsExpanded, setSettingsExpanded] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState<SearchResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const navRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Settings state
  const { currency, areaUnit, setCurrency, setAreaUnit } = useSettings();

  // Filter state
  const { 
    isFilterPanelOpen, 
    setFilterPanelOpen, 
    hasActiveFilters, 
    activeFilterCount 
  } = useFilters();

  // Currency rate information
  const [currencyInfo, setCurrencyInfo] = useState(getCurrencyInfo());
  const [refreshingRates, setRefreshingRates] = useState(false);

  // Function to handle manual currency refresh
  const handleRefreshRates = async () => {
    setRefreshingRates(true);
    try {
      const success = await refreshCurrencyRates();
      setCurrencyInfo(getCurrencyInfo());
      if (success) {
        console.log('✅ Currency rates refreshed successfully');
      } else {
        console.log('⚠️ Failed to refresh rates, using cached/fallback');
      }
    } catch (error) {
      console.error('Error refreshing currency rates:', error);
    } finally {
      setRefreshingRates(false);
    }
  };

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Parse coordinates from input
  const parseCoordinates = useCallback((input: string): { lat: number; lng: number } | null => {
    const cleaned = input.trim().replace(/\s+/g, ' ');
    
    // Pattern: "lat, lng" or "lat,lng" or "lat lng"
    const pattern = /^(-?\d+\.?\d*),?\s*(-?\d+\.?\d*)$/;
    const match = cleaned.match(pattern);
    if (match) {
      const lat = parseFloat(match[1]);
      const lng = parseFloat(match[2]);
      if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        return { lat, lng };
      }
    }
    return null;
  }, []);

  // Get search suggestions
  const getSearchSuggestions = useCallback(async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setSearchSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setSearchLoading(true);
    const results: typeof searchSuggestions = [];

    try {
      // Check if input looks like coordinates
      const coords = parseCoordinates(query);
      if (coords) {
        results.push({
          id: 'coordinates',
          name: `${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`,
          latitude: coords.lat,
          longitude: coords.lng,
          type: 'coordinates'
        });
      }

      // Add current location option if available
      if (query.toLowerCase().includes('current') && position) {
        results.push({
          id: 'current',
          name: '📍 Current Location',
          latitude: position.latitude,
          longitude: position.longitude,
          type: 'current'
        });
      }

      // Geocode if not coordinates and query is long enough - use backend proxy
      if (!coords && query.length >= 3) {
        try {
          const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8091/api/v1';
          const response = await fetch(
            `${apiBaseUrl}/geocoding/search?q=${encodeURIComponent(query)}&limit=3`,
            {
              headers: {
                'Accept': 'application/json'
              }
            }
          );
          
          if (response.ok) {
            const data = await response.json();
            if (Array.isArray(data)) {
              data.forEach((item: any, index: number) => {
                results.push({
                  id: `geocoded-${index}`,
                  name: item.display_name || item.name || 'Unknown Location',
                  latitude: parseFloat(item.lat),
                  longitude: parseFloat(item.lon),
                  type: 'geocoded'
                });
              });
            }
          } else {
            console.error('Geocoding API error:', response.status, response.statusText);
          }
        } catch (error) {
          console.error('Geocoding error:', error);
        }
      }

      setSearchSuggestions(results);
      setShowSuggestions(results.length > 0);
    } catch (error) {
      console.error('Search error:', error);
      setSearchSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setSearchLoading(false);
    }
  }, [parseCoordinates, position]);

  // Handle search input change with debouncing
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);
    
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (value.length === 0) {
      setSearchSuggestions([]);
      setShowSuggestions(false);
      setSearchLoading(false);
    } else {
      // Debounce search
      searchTimeoutRef.current = setTimeout(() => {
        getSearchSuggestions(value);
      }, 300);
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: typeof searchSuggestions[0]) => {
    onNavigateToLocation(suggestion.latitude, suggestion.longitude, 16);
    setSearchValue(suggestion.name);
    setShowSuggestions(false);
    setSearchSuggestions([]);
  };

  // Simple search function for header input
  const performSimpleSearch = async (query: string) => {
    if (!query.trim()) return;

    setSearchLoading(true);

    // Try coordinates first
    const coords = parseCoordinates(query);
    if (coords) {
      onNavigateToLocation(coords.lat, coords.lng, 16);
      setShowSuggestions(false);
      setSearchLoading(false);
      return;
    }

    // Try current location
    if (query.toLowerCase().includes('current') && position) {
      onNavigateToLocation(position.latitude, position.longitude, 16);
      setShowSuggestions(false);
      setSearchLoading(false);
      return;
    }

    // Try geocoding - use backend proxy
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8091/api/v1';
      const response = await fetch(
        `${apiBaseUrl}/geocoding/search?q=${encodeURIComponent(query)}&limit=1`,
        {
          headers: {
            'Accept': 'application/json'
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.length > 0) {
          const result = data[0];
          onNavigateToLocation(parseFloat(result.lat), parseFloat(result.lon), 16);
          setShowSuggestions(false);
          setSearchLoading(false);
          return;
        }
      }
    } catch (error) {
      console.error('Search failed:', error);
    }

    setSearchLoading(false);
    alert('Location not found. Try coordinates like "28.6139, 77.2090" or place names like "Mumbai"');
  };

  // Handle search input key press
  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (searchSuggestions.length > 0) {
        handleSuggestionClick(searchSuggestions[0]);
      } else if (searchValue.trim()) {
        performSimpleSearch(searchValue.trim());
      }
    }
    
    if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  // Handle location button click
  const handleLocationClick = useCallback(() => {
    refreshLocation();
  }, [refreshLocation]);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setShowMobileMenu(false);
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Calculate dropdown position when showing suggestions
  useEffect(() => {
    if (showSuggestions && searchInputRef.current) {
      const rect = searchInputRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom,
        left: rect.left,
        width: rect.width
      });
    }
  }, [showSuggestions]);

  // Toggle functions
  const toggleExpanded = () => setIsExpanded(!isExpanded);
  const toggleMobileMenu = () => setShowMobileMenu(!showMobileMenu);
  const toggleSearch = () => {
    const willExpand = !searchExpanded;
    setSearchExpanded(willExpand);
    // Close mobile menu when opening search to avoid UI conflicts
    if (willExpand && showMobileMenu) {
      setShowMobileMenu(false);
    }
  };

  // Notify parent about navbar expansion changes
  useEffect(() => {
    if (onNavbarExpandChange && !isMobile) {
      onNavbarExpandChange(isExpanded);
    }
  }, [isExpanded, isMobile, onNavbarExpandChange]);

  // Desktop Side Navbar
  if (!isMobile) {
    return (
      <div 
        ref={navRef}
        className={`desktop-navbar ${isExpanded ? 'expanded' : 'collapsed'}`}
      >
        {/* Header with Toggle Button and Profile */}
        <div className="navbar-header">
          {/* Toggle Button */}
          <button 
            className="navbar-toggle"
            onClick={toggleExpanded}
            title={isExpanded ? 'Collapse menu' : 'Expand menu'}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>

          {/* Profile Section in Header - Only when authenticated and expanded */}
          {isAuthenticated && isExpanded && (
            <div className="navbar-header-profile expanded">
              <div className="header-profile-section">
                <NavbarProfile />
              </div>
            </div>
          )}
        </div>

        {/* Navbar Content */}
        <div className="navbar-content">
          {/* Profile Icon Section - Shows when collapsed and authenticated */}
          <div className="navbar-section">
            {!isExpanded && isAuthenticated && (
              <div 
                className="section-header profile-icon-header clickable"
                onClick={() => setIsExpanded(true)}
              >
                <div className="navbar-profile-avatar-small">
                  👤
                </div>
              </div>
            )}
          </div>

          {/* Authentication Section - Shows for non-authenticated users */}
          {!isAuthenticated && (
            <div className="navbar-section">
              {isExpanded && (
                <div className="auth-section-flush">
                  <div className="auth-buttons">
                    <button className="nav-btn primary" onClick={onShowLogin}>
                      Login
                    </button>
                    <button className="nav-btn secondary" onClick={onShowRegister}>
                      Register
                    </button>
                  </div>
                </div>
              )}
              {!isExpanded && (
                <div 
                  className="section-header profile-icon-header clickable"
                  onClick={onShowLogin}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                </div>
              )}
            </div>
          )}

          {/* Search Section */}
          <div className="navbar-section">
            <div 
              className="section-header search-header clickable"
              onClick={() => {
                if (!isExpanded) {
                  setIsExpanded(true);
                  setTimeout(() => searchInputRef.current?.focus(), 100);
                } else {
                  // Just focus the input, don't clear it
                  searchInputRef.current?.focus();
                }
              }}
            >
              {!searchValue && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="m21 21-4.35-4.35"/>
                </svg>
              )}
              {isExpanded ? (
                <div className="search-input-wrapper">
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchValue}
                    onChange={handleSearchChange}
                    onKeyDown={handleSearchKeyPress}
                    placeholder="Mumbai, 28.6139 77.2090"
                    className="search-header-input"
                    onFocus={() => {
                      if (searchSuggestions.length > 0) {
                        setShowSuggestions(true);
                      }
                    }}
                  />
                  {searchLoading && (
                    <div className="search-loading-indicator">
                      <div className="loading-spinner-tiny" />
                    </div>
                  )}
                  {searchValue && !searchLoading && (
                    <button
                      type="button"
                      className="search-header-clear"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSearchValue('');
                        setSearchSuggestions([]);
                        setShowSuggestions(false);
                        searchInputRef.current?.focus();
                      }}
                      aria-label="Clear search"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  )}
                </div>
              ) : null}
            </div>
          </div>

          {/* Filter Section */}
          <div className="navbar-section">
            <div 
              className="section-header clickable"
              onClick={() => {
                setFilterPanelOpen(!isFilterPanelOpen);
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="22,3 2,3 10,12.46 10,19 14,21 14,12.46 22,3"/>
              </svg>
              {isExpanded && <span>Filters</span>}
              {hasActiveFilters && (
                <span className="filter-badge">{activeFilterCount}</span>
              )}
            </div>
          </div>

          {/* Map Controls Section */}
          <div className="navbar-section">
            <div 
              className="section-header clickable"
              onClick={() => {
                if (!isExpanded) {
                  setIsExpanded(true);
                  setMapControlsExpanded(true);
                } else {
                  setMapControlsExpanded(!mapControlsExpanded);
                }
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="12 2 2 7 12 12 22 7 12 2"/>
                <polyline points="2,17 12,22 22,17"/>
                <polyline points="2,12 12,17 22,12"/>
              </svg>
              {isExpanded && <span>Map Controls</span>}
              {isExpanded && (
                <svg 
                  width="12" 
                  height="12" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2"
                  style={{ 
                    marginLeft: 'auto',
                    transform: mapControlsExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease'
                  }}
                >
                  <polyline points="9,18 15,12 9,6"/>
                </svg>
              )}
            </div>
            {isExpanded && mapControlsExpanded && (
              <div className="map-controls">
                {/* Marker Display Mode */}
                <div className="control-group">
                  <label>Display Mode</label>
                  <div className="toggle-group">
                    <button 
                      className={`toggle-btn ${markerDisplayMode === 'none' ? 'active' : ''}`}
                      onClick={() => onMarkerDisplayModeChange('none')}
                      title="Hide markers"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    </button>
                    <button 
                      className={`toggle-btn ${markerDisplayMode === 'icon' ? 'active' : ''}`}
                      onClick={() => onMarkerDisplayModeChange('icon')}
                      title="Show icons"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                        <circle cx="12" cy="10" r="3"/>
                      </svg>
                    </button>
                    <button 
                      className={`toggle-btn ${markerDisplayMode === 'text' ? 'active' : ''}`}
                      onClick={() => onMarkerDisplayModeChange('text')}
                      title="Show prices"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="1" x2="12" y2="23"/>
                        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Location Toggle */}
                <div className="control-group">
                  <label>Your Location</label>
                  <button 
                    className={`nav-btn ${showUserLocation ? 'active' : ''}`}
                    onClick={() => onLocationToggle(!showUserLocation)}
                  >
                    {showUserLocation ? (
                      <>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                        Visible
                      </>
                    ) : (
                      <>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                          <line x1="1" y1="1" x2="23" y2="23"/>
                        </svg>
                        Hidden
                      </>
                    )}
                  </button>
                </div>

                {/* Location Actions */}
                <div className="control-group">
                  <label>Location Actions</label>
                  <button 
                    className="nav-btn"
                    onClick={handleLocationClick}
                    disabled={geoLoading}
                  >
                    {geoLoading ? (
                      <>
                        <div className="loading-spinner-tiny" />
                        Loading...
                      </>
                    ) : (
                      <>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="23 4 23 10 17 10"/>
                          <polyline points="1 20 1 14 7 14"/>
                          <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
                        </svg>
                        Refresh Location
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Settings Section */}
          <div className="navbar-section">
            <div 
              className="section-header clickable"
              onClick={() => {
                if (!isExpanded) {
                  setIsExpanded(true);
                  setSettingsExpanded(true);
                } else {
                  setSettingsExpanded(!settingsExpanded);
                }
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
              {isExpanded && <span>Settings</span>}
              {isExpanded && (
                <svg 
                  width="12" 
                  height="12" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2"
                  style={{ 
                    marginLeft: 'auto',
                    transform: settingsExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease'
                  }}
                >
                  <polyline points="9,18 15,12 9,6"/>
                </svg>
              )}
            </div>
            {isExpanded && settingsExpanded && (
              <div className="settings-controls">
                {/* Currency Selection */}
                <div className="control-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button 
                      className="refresh-rates-btn"
                      onClick={handleRefreshRates}
                      disabled={refreshingRates}
                      title={`Refresh currency exchange rates
Last updated: ${currencyInfo.lastUpdated}
Source: ${currencyInfo.source}`}
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: '4px',
                        borderRadius: '4px',
                        cursor: refreshingRates ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#6b7280',
                        transition: 'all 0.2s ease',
                        opacity: refreshingRates ? 0.5 : 1,
                        width: '20px',
                        height: '20px',
                        marginRight: '4px'
                      }}
                      onTouchStart={(e) => {
                        if (!refreshingRates) {
                          e.currentTarget.style.backgroundColor = '#f3f4f6';
                          e.currentTarget.style.color = '#374151';
                        }
                      }}
                      onTouchEnd={(e) => {
                        setTimeout(() => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.color = '#6b7280';
                        }, 150);
                      }}
                    >
                      {refreshingRates ? (
                        <div 
                          className="loading-spinner-tiny" 
                          style={{ 
                            width: '12px', 
                            height: '12px',
                            border: '1.5px solid #e5e7eb',
                            borderTop: '1.5px solid #6b7280'
                          }} 
                        />
                      ) : (
                        <svg 
                          width="12" 
                          height="12" 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke="currentColor" 
                          strokeWidth="2.5"
                        >
                          <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
                          <path d="M21 3v5h-5"/>
                          <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
                          <path d="M3 21v-5h5"/>
                        </svg>
                      )}
                    </button>
                    Currency
                    <div 
                      className="info-icon"
                      title={`Currency Rates
Source: ${currencyInfo.source}
Updated: ${currencyInfo.lastUpdated}${!currencyInfo.isLive ? '\n⚠️ Using cached/fallback rates' : ''}`}
                      style={{
                        width: '16px',
                        height: '16px',
                        borderRadius: '50%',
                        border: '1px solid #6b7280',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '10px',
                        fontWeight: 'bold',
                        color: '#6b7280',
                        cursor: 'help',
                        userSelect: 'none'
                      }}
                    >
                      i
                    </div>
                  </label>
                  <select className="settings-select" value={currency} onChange={(e) => setCurrency(e.target.value as CurrencyCode)}>
                    {getAllCurrencies().map((currencyOption) => (
                      <option key={currencyOption.code} value={currencyOption.code}>
                        {currencyOption.symbol} {currencyOption.name} ({currencyOption.code})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Area Unit Selection */}
                <div className="control-group">
                  <label>Area Unit</label>
                  <div className="toggle-group">
                    <button 
                      className={`toggle-btn ${areaUnit === 'sqft' ? 'active' : ''}`}
                      onClick={() => setAreaUnit('sqft')}
                    >
                      Sq Ft
                    </button>
                    <button 
                      className={`toggle-btn ${areaUnit === 'sqm' ? 'active' : ''}`}
                      onClick={() => setAreaUnit('sqm')}
                    >
                      Sq M
                    </button>
                    <button 
                      className={`toggle-btn ${areaUnit === 'cent' ? 'active' : ''}`}
                      onClick={() => setAreaUnit('cent')}
                    >
                      Cent
                    </button>
                    <button 
                      className={`toggle-btn ${areaUnit === 'acre' ? 'active' : ''}`}
                      onClick={() => setAreaUnit('acre')}
                    >
                      Acre
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Search Suggestions Dropdown - Rendered via Portal */}
        {showSuggestions && searchSuggestions.length > 0 && createPortal(
          <div 
            className="search-suggestions-dropdown"
            style={{
              position: 'fixed',
              top: `${dropdownPosition.top}px`,
              left: `${dropdownPosition.left}px`,
              width: `${dropdownPosition.width}px`,
              zIndex: 99999
            }}
          >
            {searchSuggestions.map((suggestion) => (
              <div
                key={suggestion.id}
                className={`search-suggestion-item ${suggestion.type}`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSuggestionClick(suggestion);
                }}
              >
                <div className="suggestion-content">
                  <span className="suggestion-name">{suggestion.name}</span>
                  <span className="suggestion-coords">
                    {suggestion.latitude.toFixed(4)}, {suggestion.longitude.toFixed(4)}
                  </span>
                </div>
                <div className="suggestion-type-icon">
                  {suggestion.type === 'coordinates' && '📍'}
                  {suggestion.type === 'current' && '🌍'}
                  {suggestion.type === 'geocoded' && '📍'}
                </div>
              </div>
            ))}
          </div>,
          document.body
        )}
      </div>
    );
  }

  // Mobile Top Navbar
  return (
    <div ref={navRef} className="mobile-navbar">
      {/* Top Bar */}
      <div className="mobile-navbar-top">
        {/* Left: Menu Toggle */}
        <button 
          className="mobile-menu-toggle"
          onClick={toggleMobileMenu}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>

        {/* Center: Search */}
        <div className={`mobile-search-container ${searchExpanded ? 'expanded' : ''}`}>
          {searchExpanded ? (
            <div className="mobile-search-expanded">
              <UnifiedSearch 
                onNavigate={(lat, lng, zoom) => {
                  onNavigateToLocation(lat, lng, zoom);
                  setSearchExpanded(false);
                }}
                onClose={() => setSearchExpanded(false)}
                placeholder="Search location..."
                autoFocus={true}
                usePortalForResults={true}
              />
              <button 
                className="mobile-search-close"
                onClick={() => setSearchExpanded(false)}
                aria-label="Close search"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          ) : (
            <button 
              className="search-trigger"
              onClick={toggleSearch}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
              </svg>
              <span>Search location...</span>
            </button>
          )}
        </div>

        {/* Right: Quick Actions */}
        <div className="mobile-quick-actions">
          <button 
            className="quick-action-btn"
            onClick={handleLocationClick}
            disabled={geoLoading}
            title="Get location"
          >
            {geoLoading ? (
              <div className="loading-spinner-tiny" />
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="23 4 23 10 17 10"/>
                <polyline points="1 20 1 14 7 14"/>
                <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Slide-out Menu */}
      {showMobileMenu && (
        <div className="mobile-menu-overlay">
          <div className="mobile-menu">
            {/* Authentication Section */}
            <div className="mobile-menu-section">
              <h3>Account</h3>
              {isAuthenticated ? (
                <NavbarProfile isMobile={true} />
              ) : (
                <div className="mobile-auth-buttons">
                  <button 
                    className="mobile-nav-btn primary"
                    onClick={() => {
                      onShowLogin();
                      setShowMobileMenu(false);
                    }}
                  >
                    Login
                  </button>
                  <button 
                    className="mobile-nav-btn secondary"
                    onClick={() => {
                      onShowRegister();
                      setShowMobileMenu(false);
                    }}
                  >
                    Register
                  </button>
                </div>
              )}
            </div>

            {/* Map Controls Section */}
            <div className="mobile-menu-section">
              <h3>Map Controls</h3>
              
              <div className="mobile-control-group">
                <label>Display Mode</label>
                <div className="mobile-toggle-group">
                  <button 
                    className={`mobile-toggle-btn ${markerDisplayMode === 'none' ? 'active' : ''}`}
                    onClick={() => {
                      onMarkerDisplayModeChange('none');
                      setShowMobileMenu(false);
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                    Hidden
                  </button>
                  <button 
                    className={`mobile-toggle-btn ${markerDisplayMode === 'icon' ? 'active' : ''}`}
                    onClick={() => {
                      onMarkerDisplayModeChange('icon');
                      setShowMobileMenu(false);
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                      <circle cx="12" cy="10" r="3"/>
                    </svg>
                    Icons
                  </button>
                  <button 
                    className={`mobile-toggle-btn ${markerDisplayMode === 'text' ? 'active' : ''}`}
                    onClick={() => {
                      onMarkerDisplayModeChange('text');
                      setShowMobileMenu(false);
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="12" y1="1" x2="12" y2="23"/>
                      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                    </svg>
                    Prices
                  </button>
                </div>
              </div>

              <div className="mobile-control-group">
                <label>Your Location</label>
                <button 
                  className={`mobile-nav-btn ${showUserLocation ? 'active' : ''}`}
                  onClick={() => {
                    onLocationToggle(!showUserLocation);
                    setShowMobileMenu(false);
                  }}
                >
                  {showUserLocation ? (
                    <>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                      Visible
                    </>
                  ) : (
                    <>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                      Hidden
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Filter Section */}
            <div className="mobile-menu-section">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                Filters
                {hasActiveFilters && (
                  <span className="filter-badge">{activeFilterCount}</span>
                )}
              </h3>
              
              <div className="mobile-control-group">
                <button 
                  className={`mobile-nav-btn ${isFilterPanelOpen ? 'active' : ''}`}
                  onClick={() => {
                    setFilterPanelOpen(!isFilterPanelOpen);
                    setShowMobileMenu(false);
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="22,3 2,3 10,12.46 10,19 14,21 14,12.46 22,3"/>
                  </svg>
                  {isFilterPanelOpen ? 'Close Filters' : 'Open Filters'}
                </button>
              </div>
            </div>

            {/* Settings Section */}
            <div className="mobile-menu-section">
              <h3>Settings</h3>
              
              <div className="mobile-control-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button 
                    className="refresh-rates-btn"
                    onClick={handleRefreshRates}
                    disabled={refreshingRates}
                    title={`Refresh currency exchange rates
Last updated: ${currencyInfo.lastUpdated}
Source: ${currencyInfo.source}`}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: '4px',
                      borderRadius: '4px',
                      cursor: refreshingRates ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#6b7280',
                      transition: 'all 0.2s ease',
                      opacity: refreshingRates ? 0.5 : 1,
                      width: '20px',
                      height: '20px',
                      marginRight: '4px'
                    }}
                    onTouchStart={(e) => {
                      if (!refreshingRates) {
                        e.currentTarget.style.backgroundColor = '#f3f4f6';
                        e.currentTarget.style.color = '#374151';
                      }
                    }}
                    onTouchEnd={(e) => {
                      setTimeout(() => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = '#6b7280';
                      }, 150);
                    }}
                  >
                    {refreshingRates ? (
                      <div 
                        className="loading-spinner-tiny" 
                        style={{ 
                          width: '12px', 
                          height: '12px',
                          border: '1.5px solid #e5e7eb',
                          borderTop: '1.5px solid #6b7280'
                        }} 
                      />
                    ) : (
                      <svg 
                        width="12" 
                        height="12" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2.5"
                      >
                        <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
                        <path d="M21 3v5h-5"/>
                        <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
                        <path d="M3 21v-5h5"/>
                      </svg>
                    )}
                  </button>
                  Currency
                  <div 
                    className="info-icon"
                    title={`Currency Rates
Source: ${currencyInfo.source}
Updated: ${currencyInfo.lastUpdated}${!currencyInfo.isLive ? '\n⚠️ Using cached/fallback rates' : ''}`}
                    style={{
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      border: '1px solid #6b7280',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '10px',
                      fontWeight: 'bold',
                      color: '#6b7280',
                      cursor: 'help',
                      userSelect: 'none'
                    }}
                  >
                    i
                  </div>
                </label>
                <select className="mobile-settings-select" value={currency} onChange={(e) => setCurrency(e.target.value as CurrencyCode)}>
                  {getAllCurrencies().map((currencyOption) => (
                    <option key={currencyOption.code} value={currencyOption.code}>
                      {currencyOption.symbol} {currencyOption.name} ({currencyOption.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Area Unit Selection */}
              <div className="mobile-control-group">
                <label>Area Unit</label>
                <div className="mobile-toggle-group">
                  <button 
                    className={`mobile-toggle-btn ${areaUnit === 'sqft' ? 'active' : ''}`}
                    onClick={() => setAreaUnit('sqft')}
                  >
                    Sq Ft
                  </button>
                  <button 
                    className={`mobile-toggle-btn ${areaUnit === 'sqm' ? 'active' : ''}`}
                    onClick={() => setAreaUnit('sqm')}
                  >
                    Sq M
                  </button>
                  <button 
                    className={`mobile-toggle-btn ${areaUnit === 'cent' ? 'active' : ''}`}
                    onClick={() => setAreaUnit('cent')}
                  >
                    Cent
                  </button>
                  <button 
                    className={`mobile-toggle-btn ${areaUnit === 'acre' ? 'active' : ''}`}
                    onClick={() => setAreaUnit('acre')}
                  >
                    Acre
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapNavbar;
