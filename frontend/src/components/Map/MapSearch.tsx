import React from 'react';
import { useMap } from 'react-leaflet';
import UnifiedSearch from '../Search/UnifiedSearch';

interface MapSearchProps {
  position?: 'topright' | 'topleft' | 'bottomright' | 'bottomleft' | 'topcenter';
  className?: string;
}

/**
 * Map search component wrapper that uses UnifiedSearch with Leaflet map
 */
const MapSearch: React.FC<MapSearchProps> = ({ 
  position = 'topleft',
  className = ''
}) => {
  const map = useMap();

  const handleNavigate = (lat: number, lng: number, zoom?: number) => {
    map.setView([lat, lng], zoom || 16);
  };

  const getPositionStyles = () => {
    const baseStyles: React.CSSProperties = {
      position: 'absolute',
      zIndex: 10001,
      width: '320px',
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
      <UnifiedSearch 
        onNavigate={handleNavigate}
        placeholder="Search location..."
      />
    </div>
  );
};

export default MapSearch;
