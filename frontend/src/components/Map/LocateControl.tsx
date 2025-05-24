import { useMap } from 'react-leaflet';
import { useState, useEffect } from 'react';
import { useGeolocation } from '../../hooks/useGeolocation';

interface LocateControlProps {
  position?: 'topleft' | 'topright' | 'bottomleft' | 'bottomright';
  flyTo?: boolean;
  zoomLevel?: number;
}

const LocateControl: React.FC<LocateControlProps> = ({
  position = 'bottomright',
  flyTo = true,
  zoomLevel = 16
}) => {
  const map = useMap();
  const { position: geoPosition, loading, error } = useGeolocation();
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [hasFoundLocation, setHasFoundLocation] = useState<boolean>(false);
  
  // Update location when geoPosition changes
  useEffect(() => {
    if (geoPosition && isLocating) {
      const { latitude, longitude } = geoPosition;
      
      if (flyTo) {
        map.flyTo([latitude, longitude], zoomLevel);
      } else {
        map.setView([latitude, longitude], zoomLevel);
      }
      
      setHasFoundLocation(true);
      setIsLocating(false);
    }
  }, [geoPosition, isLocating, map, flyTo, zoomLevel]);
  
  const handleLocate = () => {
    setIsLocating(true);
    if (geoPosition) {
      const { latitude, longitude } = geoPosition;
      if (flyTo) {
        map.flyTo([latitude, longitude], zoomLevel);
      } else {
        map.setView([latitude, longitude], zoomLevel);
      }
      setHasFoundLocation(true);
      setIsLocating(false);
    }
  };
  
  const getPositionClass = () => {
    switch(position) {
      case 'topright': return 'top-4 right-4';
      case 'topleft': return 'top-4 left-4';
      case 'bottomright': return 'bottom-20 right-4';
      case 'bottomleft': return 'bottom-20 left-4';
      default: return 'bottom-20 right-4';
    }
  };
  
  return (
    <div 
      className={`absolute z-1000 ${getPositionClass()}`}
      style={{ zIndex: 1000 }}
    >
      <button
        className={`flex items-center justify-center w-10 h-10 bg-white rounded-full shadow-md ${
          isLocating ? 'animate-pulse' : ''
        } ${error ? 'bg-red-100' : ''} ${hasFoundLocation ? 'border-2 border-blue-500' : ''}`}
        onClick={handleLocate}
        disabled={loading || isLocating}
        title={error ? error : 'Center map on your location'}
        style={{ 
          boxShadow: '0 1px 5px rgba(0,0,0,0.4)',
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          width="24"
          height="24"
          className={`${isLocating ? 'text-blue-500 animate-pulse' : 'text-gray-700'}`}
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
      </button>
    </div>
  );
};

export default LocateControl; 