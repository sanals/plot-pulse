import { useEffect } from 'react';
import { useMapEvents } from 'react-leaflet';
import { useMapLongPress } from '../../hooks/useLongPress';
import type { MapPosition } from '../../types/plot.types';

interface MapLongPressHandlerProps {
  onLongPress: (position: MapPosition) => void;
}

const MapLongPressHandler: React.FC<MapLongPressHandlerProps> = ({ onLongPress }) => {
  const handleLongPress = (lat: number, lng: number, event: any) => {
    // Check if the click is on a UI control element (not the map itself)
    if (event && event.originalEvent) {
      const target = event.originalEvent.target as HTMLElement;
      
      // Skip if clicking on a control, form element, or modal
      if (target.closest('.leaflet-control') || 
          target.closest('.leaflet-bar') || 
          target.closest('button') ||
          target.closest('.map-control') ||
          target.closest('select') ||
          target.closest('input') ||
          target.closest('textarea') ||
          target.closest('form') ||
          target.closest('.modal') ||
          target.closest('.long-press-modal') ||
          target.closest('.plot-submission-form') ||
          target.closest('[role="dialog"]') ||
          target.closest('.dropdown') ||
          target.closest('.popup')) {
        return;
      }
    }
    
    console.log('Long press detected at:', { lat, lng });
    onLongPress({ lat, lng });
  };

  const {
    handleMapClick,
    handleMapMouseUp,
    handleMapMouseMove,
    cleanup
  } = useMapLongPress(handleLongPress, 500);

  useMapEvents({
    // Handle right-click (context menu) as immediate long press
    contextmenu: (event) => {
      event.originalEvent.preventDefault();
      
      // Check if the click is on a UI control element or form element
      if (event && event.originalEvent) {
        const target = event.originalEvent.target as HTMLElement;
        
        // Skip if clicking on a control, form element, or modal
        if (target.closest('.leaflet-control') || 
            target.closest('.leaflet-bar') || 
            target.closest('button') ||
            target.closest('.map-control') ||
            target.closest('select') ||
            target.closest('input') ||
            target.closest('textarea') ||
            target.closest('form') ||
            target.closest('.modal') ||
            target.closest('.long-press-modal') ||
            target.closest('.plot-submission-form') ||
            target.closest('[role="dialog"]') ||
            target.closest('.dropdown') ||
            target.closest('.popup')) {
          return;
        }
      }
      
      const { lat, lng } = event.latlng;
      console.log('Right-click detected at:', { lat, lng });
      onLongPress({ lat, lng });
    },
    
    // Handle mouse events for long press detection
    mousedown: (event) => {
      // Only handle left mouse button for long press
      if (event.originalEvent.button !== 0) {
        return;
      }
      
      handleMapClick(event);
    },
    
    mouseup: () => {
      handleMapMouseUp();
    },
    
    mousemove: () => {
      handleMapMouseMove();
    }
  });

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);
  
  return null;
};

export default MapLongPressHandler; 