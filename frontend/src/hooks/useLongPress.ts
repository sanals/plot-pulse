import { useCallback, useRef, useState } from 'react';

interface LongPressOptions {
  delay?: number;
  onLongPress?: (event: any) => void;
  onClick?: (event: any) => void;
  shouldPreventDefault?: boolean;
}

interface LongPressHandlers {
  onMouseDown: (event: React.MouseEvent) => void;
  onMouseUp: (event: React.MouseEvent) => void;
  onMouseLeave: (event: React.MouseEvent) => void;
  onTouchStart: (event: React.TouchEvent) => void;
  onTouchEnd: (event: React.TouchEvent) => void;
  onContextMenu: (event: React.MouseEvent) => void;
}

/**
 * Custom hook for detecting long press events
 * Supports both touch devices (long press) and desktop (right-click)
 * 
 * @param options Configuration options for long press detection
 * @returns Event handlers to attach to the target element
 */
export const useLongPress = (options: LongPressOptions): LongPressHandlers => {
  const {
    delay = 500,
    onLongPress,
    onClick,
    shouldPreventDefault = true
  } = options;

  const [longPressTriggered, setLongPressTriggered] = useState(false);
  const timeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const target = useRef<EventTarget | undefined>(undefined);

  const start = useCallback((event: any) => {
    // Prevent default context menu on right-click
    if (shouldPreventDefault && event.type === 'contextmenu') {
      event.preventDefault();
      return;
    }

    // Handle right-click immediately as long press
    if (event.type === 'contextmenu' || event.button === 2) {
      if (onLongPress) {
        onLongPress(event);
      }
      return;
    }

    // For touch and left-click, set up timer
    if (event.type === 'mousedown' && event.button !== 0) {
      return; // Only handle left mouse button
    }

    target.current = event.target;
    setLongPressTriggered(false);

    timeout.current = setTimeout(() => {
      if (onLongPress) {
        onLongPress(event);
        setLongPressTriggered(true);
      }
    }, delay);
  }, [onLongPress, delay, shouldPreventDefault]);

  const clear = useCallback((event: any, shouldTriggerClick = true) => {
    timeout.current && clearTimeout(timeout.current);
    
    if (shouldTriggerClick && !longPressTriggered && onClick) {
      onClick(event);
    }
    
    setLongPressTriggered(false);
  }, [onClick, longPressTriggered]);

  return {
    onMouseDown: (event: React.MouseEvent) => start(event),
    onMouseUp: (event: React.MouseEvent) => clear(event),
    onMouseLeave: (event: React.MouseEvent) => clear(event, false),
    onTouchStart: (event: React.TouchEvent) => start(event),
    onTouchEnd: (event: React.TouchEvent) => clear(event),
    onContextMenu: (event: React.MouseEvent) => start(event),
  };
};

/**
 * Hook specifically for map long press detection
 * Extracts coordinates from Leaflet map events
 * Fixed to capture coordinates immediately to prevent drift
 */
export const useMapLongPress = (onLongPress: (lat: number, lng: number, event: any) => void, delay = 500) => {
  const [isLongPressing, setIsLongPressing] = useState(false);
  const timeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const coordinatesRef = useRef<{ lat: number; lng: number } | null>(null);
  const eventRef = useRef<any>(null);

  const handleMapClick = useCallback((event: any) => {
    // Clear any existing timeout
    if (timeout.current) {
      clearTimeout(timeout.current);
    }

    setIsLongPressing(false);

    // Immediately capture coordinates to prevent drift
    if (event.latlng) {
      coordinatesRef.current = { lat: event.latlng.lat, lng: event.latlng.lng };
      eventRef.current = event;
    }

    // Set up long press detection
    timeout.current = setTimeout(() => {
      if (coordinatesRef.current) {
        setIsLongPressing(true);
        onLongPress(coordinatesRef.current.lat, coordinatesRef.current.lng, eventRef.current);
      }
    }, delay);
  }, [onLongPress, delay]);

  const handleMapMouseUp = useCallback(() => {
    if (timeout.current) {
      clearTimeout(timeout.current);
    }
    setIsLongPressing(false);
    coordinatesRef.current = null;
    eventRef.current = null;
  }, []);

  const handleMapMouseMove = useCallback(() => {
    if (timeout.current) {
      clearTimeout(timeout.current);
    }
    setIsLongPressing(false);
    coordinatesRef.current = null;
    eventRef.current = null;
  }, []);

  // Cleanup on unmount
  const cleanup = useCallback(() => {
    if (timeout.current) {
      clearTimeout(timeout.current);
    }
    coordinatesRef.current = null;
    eventRef.current = null;
  }, []);

  return {
    handleMapClick,
    handleMapMouseUp,
    handleMapMouseMove,
    isLongPressing,
    cleanup
  };
}; 