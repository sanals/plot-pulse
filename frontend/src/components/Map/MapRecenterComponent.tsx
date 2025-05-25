import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import type { MapPosition } from '../../types/plot.types';

interface MapRecenterComponentProps {
  position: MapPosition | null;
  initialZoom?: number;
  onlyOnce?: boolean;
  onRecenter?: () => void;
}

const MapRecenterComponent: React.FC<MapRecenterComponentProps> = ({ 
  position, 
  initialZoom = 16,
  onlyOnce = true,
  onRecenter
}) => {
  const map = useMap();
  const lastPositionRef = useRef<MapPosition | null>(null);
  const hasRecenteredRef = useRef<boolean>(false);
  
  useEffect(() => {
    if (position && 
        (!lastPositionRef.current || 
         lastPositionRef.current.lat !== position.lat || 
         lastPositionRef.current.lng !== position.lng)) {
      
      // If onlyOnce is true and we've already recentered, don't do it again
      if (onlyOnce && hasRecenteredRef.current) {
        return;
      }
      
      lastPositionRef.current = position;
      hasRecenteredRef.current = true;
      
      // Use flyTo for a smooth animation to the user's location
      map.flyTo(position, initialZoom, {
        duration: 1.5 // 1.5 second animation
      });
      
      // Call the callback if provided
      if (onRecenter) {
        onRecenter();
      }
    }
  }, [map, position, initialZoom, onlyOnce, onRecenter]);
  
  return null;
};

export default MapRecenterComponent; 