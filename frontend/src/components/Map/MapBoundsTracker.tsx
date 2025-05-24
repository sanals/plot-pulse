import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import type { MapBounds } from '../../types/plot.types';

interface MapBoundsTrackerProps {
  onBoundsChange: (bounds: MapBounds) => void;
}

const MapBoundsTracker: React.FC<MapBoundsTrackerProps> = ({ onBoundsChange }) => {
  const map = useMap();
  const timeoutRef = useRef<number | null>(null);
  const lastBoundsRef = useRef<MapBounds | null>(null);
  
  useEffect(() => {
    const updateBounds = () => {
      // Clear existing timeout
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
      
      // Debounce the bounds update
      timeoutRef.current = window.setTimeout(() => {
        const bounds = map.getBounds();
        const northEast = bounds.getNorthEast();
        const southWest = bounds.getSouthWest();
        
        const newBounds = {
          north: northEast.lat,
          east: northEast.lng,
          south: southWest.lat,
          west: southWest.lng
        };
        
        // Only update if bounds actually changed
        if (!lastBoundsRef.current || 
            lastBoundsRef.current.north !== newBounds.north ||
            lastBoundsRef.current.east !== newBounds.east ||
            lastBoundsRef.current.south !== newBounds.south ||
            lastBoundsRef.current.west !== newBounds.west) {
          lastBoundsRef.current = newBounds;
          onBoundsChange(newBounds);
        }
      }, 250); // 250ms debounce
    };
    
    // Initial bounds (delayed to avoid immediate trigger)
    const initialTimeout = setTimeout(updateBounds, 100);
    
    // Update bounds when map moves
    map.on('moveend', updateBounds);
    map.on('zoomend', updateBounds);
    
    return () => {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
      }
      clearTimeout(initialTimeout);
      map.off('moveend', updateBounds);
      map.off('zoomend', updateBounds);
    };
  }, [map, onBoundsChange]);
  
  return null;
};

export default MapBoundsTracker; 