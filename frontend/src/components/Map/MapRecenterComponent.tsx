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
      // If user interacts, mark that we should not auto-recenter anymore
      if (onlyOnce) {
        hasRecenteredRef.current = true;
      }
    };
    
    // Listen for various user interaction events
    map.on('dragstart', handleUserInteraction);
    map.on('zoomstart', handleUserInteraction);
    map.on('click', handleUserInteraction);
    map.on('moveend', () => {
      // If map moved and it wasn't from our recenter, it was user interaction
      if (!isInitialLoadRef.current) {
        lastUserInteractionRef.current = Date.now();
      }
    });
    
    return () => {
      map.off('dragstart', handleUserInteraction);
      map.off('zoomstart', handleUserInteraction);
      map.off('click', handleUserInteraction);
      map.off('moveend');
    };
  }, [map, onlyOnce]);
  
  useEffect(() => {
    if (!position) {
      return;
    }
    
    // If onlyOnce is true and we've already recentered, don't do it again
    if (onlyOnce && hasRecenteredRef.current) {
      return;
    }
    
    // If respecting user interaction, don't recenter if user has interacted recently
    if (respectUserInteraction && !isInitialLoadRef.current) {
      const timeSinceLastInteraction = Date.now() - lastUserInteractionRef.current;
      // Increase the threshold to 5 minutes (300000ms) to prevent unwanted recenters
      if (timeSinceLastInteraction < 300000) {
        console.log('Skipping recenter - user has interacted with map recently');
        return;
      }
    }
    
    // Only recenter if position actually changed significantly (more than 100 meters)
    if (lastPositionRef.current) {
      const latDiff = Math.abs(lastPositionRef.current.lat - position.lat);
      const lngDiff = Math.abs(lastPositionRef.current.lng - position.lng);
      // Rough conversion: 1 degree ≈ 111km, so 0.001 degree ≈ 111m
      // Only recenter if moved more than ~100 meters
      if (latDiff < 0.001 && lngDiff < 0.001) {
        return; // Position hasn't changed significantly
      }
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
  }, [map, position, initialZoom, onlyOnce, onRecenter, respectUserInteraction]);
  
  return null;
};

export default MapRecenterComponent; 