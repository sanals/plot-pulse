import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useMap } from 'react-leaflet';
import { useGeolocationContext } from '../../contexts/GeolocationContext';

interface SearchResult {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  type: 'coordinates' | 'geocoded' | 'current';
}

interface MapSearchProps {
  position?: 'topright' | 'topleft' | 'bottomright' | 'bottomleft' | 'topcenter';
  className?: string;
}

/**
 * MapSearch component for navigating to locations by name, coordinates, or current location
 */
const MapSearch: React.FC<MapSearchProps> = ({ 
  position = 'topleft',
  className = ''
}) => {
  const map = useMap();
  const { position: userPosition } = useGeolocationContext();
  const [searchValue, setSearchValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Parse coordinates from input (supports various formats)
  const parseCoordinates = useCallback((input: string): { lat: number; lng: number } | null => {
    // Remove extra spaces and normalize
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

    // Pattern 3: "N/S degrees, E/W degrees" format
    const pattern3 = /^(\d+\.?\d*)[°]?\s*([NS]),?\s*(\d+\.?\d*)[°]?\s*([EW])$/i;
    const match3 = cleaned.match(pattern3);
    if (match3) {
      let lat = parseFloat(match3[1]);
      let lng = parseFloat(match3[3]);
      
      if (match3[2].toUpperCase() === 'S') lat = -lat;
      if (match3[4].toUpperCase() === 'W') lng = -lng;
      
      if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        return { lat, lng };
      }
    }

    return null;
  }, []);

  // Geocode location name using Nominatim (OpenStreetMap)
  const geocodeLocation = useCallback(async (query: string): Promise<SearchResult[]> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`
      );
      
      if (!response.ok) {
        throw new Error('Geocoding failed');
      }

      const data = await response.json();
      
      return data.map((item: any, index: number) => ({
        id: `geocoded-${index}`,
        name: item.display_name || item.name || 'Unknown Location',
        latitude: parseFloat(item.lat),
        longitude: parseFloat(item.lon),
        type: 'geocoded' as const
      }));
    } catch (error) {
      console.error('Geocoding error:', error);
      return [];
    }
  }, []);

  // Search function with debouncing
  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    const results: SearchResult[] = [];

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
      if (userPosition && query.toLowerCase().includes('current')) {
        results.push({
          id: 'current',
          name: '📍 Current Location',
          latitude: userPosition.latitude,
          longitude: userPosition.longitude,
          type: 'current'
        });
      }

      // Geocode if not coordinates
      if (!coords && query.length >= 3) {
        const geocoded = await geocodeLocation(query);
        results.push(...geocoded);
      }

      setSuggestions(results);
      setShowSuggestions(results.length > 0);
    } catch (error) {
      setError('Search failed. Please try again.');
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setIsLoading(false);
    }
  }, [parseCoordinates, geocodeLocation, userPosition]);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      performSearch(searchValue);
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [searchValue, performSearch]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
    setError(null);
  };

  // Handle suggestion selection
  const handleSuggestionClick = (result: SearchResult) => {
    // Navigate to location
    map.setView([result.latitude, result.longitude], 16);
    
    // Update search input
    setSearchValue(result.name);
    setShowSuggestions(false);
    
    // Blur input to hide mobile keyboard
    searchInputRef.current?.blur();
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (suggestions.length > 0) {
      handleSuggestionClick(suggestions[0]);
    }
  };

  // Handle input focus
  const handleInputFocus = () => {
    if (suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  // Handle input blur (with delay to allow clicks)
  const handleInputBlur = () => {
    setTimeout(() => {
      setShowSuggestions(false);
    }, 200);
  };

  // Clear search
  const clearSearch = () => {
    setSearchValue('');
    setSuggestions([]);
    setShowSuggestions(false);
    setError(null);
    searchInputRef.current?.focus();
  };

  const getPositionStyles = () => {
    const baseStyles = {
      position: 'absolute' as const,
      zIndex: 10001,
      minWidth: '300px',
      maxWidth: '400px',
    };

    switch (position) {
      case 'topleft':
        return { ...baseStyles, top: '10px', left: '10px' };
      case 'topright':
        return { ...baseStyles, top: '70px', right: '10px' };
      case 'bottomleft':
        return { ...baseStyles, bottom: '10px', left: '10px' };
      case 'bottomright':
        return { ...baseStyles, bottom: '10px', right: '10px' };
      case 'topcenter':
        return { ...baseStyles, top: '10px', left: '50%', transform: 'translateX(-50%)' };
      default:
        return { ...baseStyles, top: '10px', left: '10px' };
    }
  };

  return (
    <div style={getPositionStyles()} className={className}>
      <form onSubmit={handleSubmit} className="map-search-form">
        <div className="search-input-container">
          <input
            ref={searchInputRef}
            type="text"
            value={searchValue}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            placeholder="Search location, address, or coordinates..."
            className="search-input"
            disabled={isLoading}
          />
          
          <div className="search-actions">
            {isLoading && (
              <div className="search-loading">
                <div className="loading-spinner-small" />
              </div>
            )}
            
            {searchValue && !isLoading && (
              <button
                type="button"
                onClick={clearSearch}
                className="clear-search-btn"
                title="Clear search"
              >
                ×
              </button>
            )}
            
            <button
              type="submit"
              className="search-submit-btn"
              disabled={isLoading || suggestions.length === 0}
              title="Search"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            </button>
          </div>
        </div>

        {error && (
          <div className="search-error">
            {error}
          </div>
        )}

        {showSuggestions && suggestions.length > 0 && (
          <div className="search-suggestions">
            {suggestions.map((result) => (
              <div
                key={result.id}
                className={`search-suggestion ${result.type}`}
                onClick={() => handleSuggestionClick(result)}
              >
                <div className="suggestion-content">
                  <span className="suggestion-name">{result.name}</span>
                  <span className="suggestion-coords">
                    {result.latitude.toFixed(4)}, {result.longitude.toFixed(4)}
                  </span>
                </div>
                <div className="suggestion-type">
                  {result.type === 'coordinates' && '📍'}
                  {result.type === 'current' && '🌍'}
                  {result.type === 'geocoded' && '📍'}
                </div>
              </div>
            ))}
          </div>
        )}
      </form>

      {/* Help text */}
      <div className="search-help">
        <small>
          Try: "Mumbai", "28.6139, 77.2090", or "current location"
        </small>
      </div>
    </div>
  );
};

export default MapSearch; 