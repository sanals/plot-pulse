import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import type { MapPosition } from '../../types/plot.types';

interface MapRecenterComponentProps {
  position: MapPosition | null;
  initialZoom?: number;
  onlyOnce?: boolean;
  onRecenter?: () => void;
  respectUserInteraction?: boolean;
}

const MapRecenterComponent: React.FC<MapRecenterComponentProps> = ({ 
  position, 
  initialZoom = 16,
  onlyOnce = true,
  onRecenter,
  respectUserInteraction = true
}) => {
  const map = useMap();
  const lastPositionRef = useRef<MapPosition | null>(null);
  const hasRecenteredRef = useRef<boolean>(false);
  const lastUserInteractionRef = useRef<number>(0);
  const isInitialLoadRef = useRef<boolean>(true);
  
  // Track user interactions with the map
  useEffect(() => {
    const handleUserInteraction = () => {
      lastUserInteractionRef.current = Date.now();
      isInitialLoadRef.current = false;
    };
    
    // Listen for various user interaction events
    map.on('drag', handleUserInteraction);
    map.on('zoom', handleUserInteraction);
    map.on('click', handleUserInteraction);
    
    return () => {
      map.off('drag', handleUserInteraction);
      map.off('zoom', handleUserInteraction);
      map.off('click', handleUserInteraction);
    };
  }, [map]);
  
  useEffect(() => {
    if (position && 
        (!lastPositionRef.current || 
         lastPositionRef.current.lat !== position.lat || 
         lastPositionRef.current.lng !== position.lng)) {
      
      // If onlyOnce is true and we've already recentered, don't do it again
      if (onlyOnce && hasRecenteredRef.current) {
        return;
      }
      
      // If respecting user interaction, don't recenter if user has interacted recently (within 30 seconds)
      const timeSinceLastInteraction = Date.now() - lastUserInteractionRef.current;
      if (respectUserInteraction && !isInitialLoadRef.current && timeSinceLastInteraction < 30000) {
        console.log('Skipping recenter - user has interacted with map recently');
        return;
      }
      
      lastPositionRef.current = position;
      hasRecenteredRef.current = true;
      
      // Use flyTo for a smooth animation to the user's location
      map.flyTo(position, initialZoom, {
        duration: 1.5 // 1.5 second animation
      });
      
      console.log('Recentering map to user location:', position);
      
      // Call the callback if provided
      if (onRecenter) {
        onRecenter();
      }
    }
  }, [map, position, initialZoom, onlyOnce, onRecenter, respectUserInteraction]);
  
  return null;
};

export default MapRecenterComponent; 