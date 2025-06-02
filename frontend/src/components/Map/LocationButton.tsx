import { useState, useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { useGeolocation } from '../../hooks/useGeolocation';
import LoadingSpinner from '../Common/LoadingSpinner';

interface LocationButtonProps {
  position?: 'topleft' | 'topright' | 'bottomleft' | 'bottomright';
  zoomLevel?: number;
  flyTo?: boolean;
  flyDuration?: number;
  showAccuracy?: boolean;
}

/**
 * A button component that centers the map on the user's location
 */
const LocationButton: React.FC<LocationButtonProps> = ({
  position = 'bottomright',
  zoomLevel = 16,
  flyTo = true,
  flyDuration = 1.5,
  showAccuracy = true
}) => {
  const map = useMap();
  const [active, setActive] = useState<boolean>(false);
  const { 
    position: geoPosition, 
    loading, 
    error, 
    permissionState, 
    refreshLocation 
  } = useGeolocation({
    watchPosition: false, // Only get location when button is clicked
    enableHighAccuracy: false, // WiFi-based location for laptops
    timeout: 8000 // Shorter timeout for laptops
  });
  
  // Center map when position changes and active is true
  useEffect(() => {
    if (geoPosition && active && !loading) {
      const { latitude, longitude, accuracy } = geoPosition;
      
      if (flyTo) {
        map.flyTo([latitude, longitude], zoomLevel, {
          duration: flyDuration
        });
      } else {
        map.setView([latitude, longitude], zoomLevel);
      }
      
      // Show accuracy circle if enabled
      if (showAccuracy && accuracy) {
        // Remove any existing accuracy circles
        map.eachLayer(layer => {
          if ((layer as any).options && (layer as any).options.className === 'accuracy-circle') {
            map.removeLayer(layer);
          }
        });
        
        // Create a circle showing accuracy
        const circle = L.circle([latitude, longitude], {
          radius: accuracy,
          weight: 1,
          color: '#4285F4',
          fillColor: '#4285F4',
          fillOpacity: 0.15,
          className: 'accuracy-circle' as any
        }).addTo(map);
        
        // Remove the circle after 5 seconds
        setTimeout(() => {
          if (map.hasLayer(circle)) {
            map.removeLayer(circle);
          }
        }, 5000);
      }
      
      // Reset active state after navigation
      setActive(false);
    }
  }, [geoPosition, active, loading, map, zoomLevel, flyTo, flyDuration, showAccuracy]);
  
  const handleClick = () => {
    setActive(true);
    refreshLocation();
  };
  
  const getButtonStyle = () => {
    const baseStyle = {
      width: '40px',
      height: '40px',
      borderRadius: '50%',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.2s',
      border: 'none',
      cursor: loading ? 'not-allowed' : 'pointer'
    };

    if (loading) return { ...baseStyle, backgroundColor: '#e5e7eb', color: '#6b7280' };
    if (error) return { ...baseStyle, backgroundColor: '#fef2f2', color: '#ef4444', border: '1px solid #fca5a5' };
    if (active) return { ...baseStyle, backgroundColor: '#3b82f6', color: 'white' };
    return { ...baseStyle, backgroundColor: 'white', color: '#374151' };
  };
  
  const getButtonIcon = () => {
    if (loading) {
      return (
        <div className="w-5 h-5 flex items-center justify-center">
          <LoadingSpinner size={16} color="#666" />
        </div>
      );
    }
    
    if (error || permissionState === 'denied') {
      return (
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="w-5 h-5" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      );
    }
    
    return (
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        className="w-5 h-5" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="1" />
        <line x1="12" y1="2" x2="12" y2="4" />
        <line x1="12" y1="20" x2="12" y2="22" />
        <line x1="4" y1="12" x2="2" y2="12" />
        <line x1="22" y1="12" x2="20" y2="12" />
      </svg>
    );
  };
  
  const getTooltip = () => {
    if (loading) return 'Getting your location...';
    if (error) return error;
    if (permissionState === 'denied') return 'Location access denied. Please enable location in your browser settings.';
    return 'Show my location';
  };
  
  return (
    <div 
      style={{ 
        position: 'absolute',
        top: position === 'topright' ? '96px' : (position === 'topleft' ? '16px' : 'auto'),
        right: position === 'topright' || position === 'bottomright' ? '16px' : 'auto',
        left: position === 'topleft' || position === 'bottomleft' ? '16px' : 'auto',
        bottom: position === 'bottomright' ? '128px' : (position === 'bottomleft' ? '16px' : 'auto'),
        zIndex: 1000
      }}
    >
      <button
        style={getButtonStyle()}
        onClick={handleClick}
        disabled={loading}
        title={getTooltip()}
        aria-label={getTooltip()}
        onMouseEnter={(e) => {
          if (!loading && !error && !active) {
            e.currentTarget.style.backgroundColor = '#f3f4f6';
          }
        }}
        onMouseLeave={(e) => {
          if (!loading && !error && !active) {
            e.currentTarget.style.backgroundColor = 'white';
          }
        }}
      >
        {getButtonIcon()}
      </button>
    </div>
  );
};

export default LocationButton; 