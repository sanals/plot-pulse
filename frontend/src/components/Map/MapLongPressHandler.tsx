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
        console.log('%c[LONG PRESS] Ignored on control/form element:', 'color: orange; font-weight: bold', target);
        return;
      }
    }
    
    console.log('%c[LONG PRESS] Detected at:', 'color: red; font-weight: bold', { lat, lng });
    console.log('[LONG PRESS] Event details:', event);
    onLongPress({ lat, lng });
  };

  const {
    handleMapClick,
    handleMapMouseUp,
    handleMapMouseMove,
    cleanup
  } = useMapLongPress(handleLongPress, 500);

  useMapEvents({
    // Debug: Add simple click handler to compare coordinates
    click: (event) => {
      console.log('%c[CLICK] Simple click at:', 'color: blue; font-weight: bold', {
        lat: event.latlng.lat,
        lng: event.latlng.lng
      });
      console.log('[CLICK] Event details:', event);
      console.log('[CLICK] Container point:', event.containerPoint);
      console.log('[CLICK] Layer point:', event.layerPoint);
      
      // Also trigger the long press handler for comparison
      handleMapClick(event);
    },
    
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
          console.log('%c[RIGHT-CLICK] Ignored on control/form element:', 'color: orange; font-weight: bold', target);
          return;
        }
      }
      
      const { lat, lng } = event.latlng;
      console.log('%c[RIGHT-CLICK] Detected at:', 'color: green; font-weight: bold', { lat, lng });
      console.log('[RIGHT-CLICK] Event details:', event);
      onLongPress({ lat, lng });
    },
    
    // Handle mouse events for long press detection
    mousedown: (event) => {
      console.log('%c[MOUSEDOWN] At:', 'color: orange; font-weight: bold', {
        lat: event.latlng.lat,
        lng: event.latlng.lng
      });
      handleMapClick(event);
    },
    
    mouseup: () => {
      console.log('[MOUSEUP] Detected');
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