import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useGeolocationContext } from '../../contexts/GeolocationContext';
import { getApiBaseUrl } from '../../config/env';
import '../../styles/unified-search.css';

interface SearchResult {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  type: 'coordinates' | 'geocoded' | 'current';
}

interface UnifiedSearchProps {
  onNavigate: (lat: number, lng: number, zoom?: number) => void;
  onClose?: () => void;
  placeholder?: string;
  autoFocus?: boolean;
  usePortalForResults?: boolean;
}

/**
 * Unified search component that works consistently on mobile and desktop
 */
const UnifiedSearch: React.FC<UnifiedSearchProps> = ({
  onNavigate,
  onClose,
  placeholder = "Search location...",
  autoFocus = false,
  usePortalForResults = false
}) => {
  const { position: userPosition } = useGeolocationContext();
  const [inputValue, setInputValue] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-focus on mount
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      // Small delay to ensure DOM is ready
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [autoFocus]);

  // Handle clicks outside - close dropdown but preserve input value
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        // Only close dropdown, don't clear input
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  // Parse coordinates
  const parseCoordinates = useCallback((input: string): { lat: number; lng: number } | null => {
    const cleaned = input.trim().replace(/\s+/g, ' ');
    const match = cleaned.match(/^(-?\d+\.?\d*)[,\s]+(-?\d+\.?\d*)$/);
    if (match) {
      const lat = parseFloat(match[1]);
      const lng = parseFloat(match[2]);
      if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        return { lat, lng };
      }
    }
    return null;
  }, []);

  // Search function
  const performSearch = useCallback(async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    const searchResults: SearchResult[] = [];

    try {
      // Check for coordinates
      const coords = parseCoordinates(query);
      if (coords) {
        searchResults.push({
          id: 'coords',
          name: `Go to ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`,
          latitude: coords.lat,
          longitude: coords.lng,
          type: 'coordinates'
        });
      }

      // Current location
      if (query.toLowerCase().includes('current') && userPosition) {
        searchResults.push({
          id: 'current',
          name: 'Current Location',
          latitude: userPosition.latitude,
          longitude: userPosition.longitude,
          type: 'current'
        });
      }

      // Geocode - use backend proxy to avoid User-Agent header issues
      if (!coords && query.length >= 3) {
        try {
          const apiBaseUrl = getApiBaseUrl();
          const response = await fetch(
            `${apiBaseUrl}/geocoding/search?q=${encodeURIComponent(query)}&limit=5`,
            {
              headers: {
                'Accept': 'application/json'
              }
            }
          );
          
          if (response.ok) {
            const data = await response.json();
            if (Array.isArray(data)) {
              data.forEach((item: any, idx: number) => {
                searchResults.push({
                  id: `geo-${idx}`,
                  name: item.display_name || 'Unknown',
                  latitude: parseFloat(item.lat),
                  longitude: parseFloat(item.lon),
                  type: 'geocoded'
                });
              });
            }
          } else {
            console.error('Geocoding API error:', response.status, response.statusText);
          }
        } catch (err) {
          console.error('Geocoding error:', err);
        }
      }

      setResults(searchResults);
      setIsOpen(searchResults.length > 0);
    } finally {
      setIsLoading(false);
    }
  }, [parseCoordinates, userPosition]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Debounced search
    if (value.length >= 2) {
      searchTimeoutRef.current = setTimeout(() => {
        performSearch(value);
      }, 300);
    } else {
      setResults([]);
      setIsOpen(false);
    }
  };

  // Handle result click
  const handleResultClick = (result: SearchResult) => {
    onNavigate(result.latitude, result.longitude, 16);
    setInputValue(result.name);
    setResults([]);
    setIsOpen(false);
    inputRef.current?.blur();
    onClose?.();
  };

  // Handle clear
  const handleClear = () => {
    setInputValue('');
    setResults([]);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  // Handle key down
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      onClose?.();
    } else if (e.key === 'Enter' && results.length > 0) {
      e.preventDefault();
      handleResultClick(results[0]);
    }
  };

  // Update dropdown position for portal
  useEffect(() => {
    if (usePortalForResults && isOpen && containerRef.current) {
      // Try to find the parent mobile-search-expanded container for full width
      const parentContainer = containerRef.current.closest('.mobile-search-expanded');
      const rect = parentContainer 
        ? parentContainer.getBoundingClientRect()
        : containerRef.current.getBoundingClientRect();
      
      setDropdownStyle({
        position: 'fixed',
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
        zIndex: 99999
      });
    }
  }, [usePortalForResults, isOpen]);

  // Cleanup timeout
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Results dropdown content
  const resultsDropdown = isOpen && results.length > 0 && (
    <div className="unified-search-results" style={usePortalForResults ? dropdownStyle : undefined}>
      {results.map((result) => (
        <div
          key={result.id}
          className={`unified-search-result ${result.type}`}
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleResultClick(result);
          }}
          onTouchStart={(e) => {
            e.stopPropagation();
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleResultClick(result);
          }}
        >
          <span className="result-icon">
            {result.type === 'current' ? '📍' : result.type === 'coordinates' ? '🎯' : '📌'}
          </span>
          <div className="result-content">
            <span className="result-name">{result.name}</span>
            <span className="result-coords">
              {result.latitude.toFixed(4)}, {result.longitude.toFixed(4)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div ref={containerRef} className="unified-search">
      <div className="unified-search-box">
        <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/>
          <path d="m21 21-4.35-4.35"/>
        </svg>

        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          placeholder={placeholder}
          className="unified-search-input"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
        />

        {isLoading && <div className="search-spinner" />}

        {inputValue && !isLoading && (
          <button
            type="button"
            className="search-clear-btn"
            onClick={handleClear}
            aria-label="Clear search"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        )}
      </div>

      {/* Results - either inline or via portal */}
      {usePortalForResults 
        ? resultsDropdown && createPortal(resultsDropdown, document.body)
        : resultsDropdown
      }
    </div>
  );
};

export default UnifiedSearch;

