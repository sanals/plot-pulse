import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import type { MapPosition } from '../../types/plot.types';

interface MapRecenterComponentProps {
  position: MapPosition | null;
}

const MapRecenterComponent: React.FC<MapRecenterComponentProps> = ({ position }) => {
  const map = useMap();
  const lastPositionRef = useRef<MapPosition | null>(null);
  
  useEffect(() => {
    if (position && 
        (!lastPositionRef.current || 
         lastPositionRef.current.lat !== position.lat || 
         lastPositionRef.current.lng !== position.lng)) {
      lastPositionRef.current = position;
      map.setView(position, map.getZoom());
    }
  }, [map, position]);
  
  return null;
};

export default MapRecenterComponent; 