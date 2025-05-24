import { useState, useRef, useCallback, useEffect } from 'react';

interface LongPressOptions {
  delay?: number;
  onLongPress: (event: React.MouseEvent | React.TouchEvent) => void;
  onStart?: (event: React.MouseEvent | React.TouchEvent) => void;
  onCancel?: () => void;
  onClick?: (event: React.MouseEvent) => void;
  shouldPreventDefault?: boolean;
  shouldStopPropagation?: boolean;
}

interface LongPressReturn {
  onMouseDown: (event: React.MouseEvent) => void;
  onMouseUp: () => void;
  onMouseLeave: () => void;
  onTouchStart: (event: React.TouchEvent) => void;
  onTouchEnd: () => void;
  onTouchMove: (event: React.TouchEvent) => void;
  onContextMenu: (event: React.MouseEvent) => void;
  onClick?: (event: React.MouseEvent) => void;
}

/**
 * Enhanced hook to detect long press events on elements
 * Works well with both mouse and touch events
 */
export const useLongPress = ({
  delay = 500,
  onLongPress,
  onStart,
  onCancel,
  onClick,
  shouldPreventDefault = true,
  shouldStopPropagation = false,
}: LongPressOptions): LongPressReturn => {
  const [longPressTriggered, setLongPressTriggered] = useState<boolean>(false);
  const timeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const target = useRef<EventTarget | undefined>(undefined);
  const startPosition = useRef<{ x: number; y: number } | null>(null);
  const maxMoveDistance = 10; // Maximum distance in pixels to still trigger long press on touch move
  
  // Clear the timeout on component unmount
  useEffect(() => {
    return () => {
      if (timeout.current) {
        clearTimeout(timeout.current);
      }
    };
  }, []);

  const start = useCallback((event: React.MouseEvent | React.TouchEvent) => {
    // Prevent default behavior (like text selection) if option is enabled
    if (shouldPreventDefault) {
      event.preventDefault();
    }
    
    if (shouldStopPropagation) {
      event.stopPropagation();
    }
    
    // Save the starting position for touch events
    if ('touches' in event) {
      const touch = event.touches[0];
      startPosition.current = {
        x: touch.clientX,
        y: touch.clientY,
      };
    }
    
    // Call onStart callback if provided
    onStart?.(event);
    
    // Clear any existing timeout
    if (timeout.current) {
      clearTimeout(timeout.current);
    }
    
    target.current = event.target;
    timeout.current = setTimeout(() => {
      onLongPress(event);
      setLongPressTriggered(true);
    }, delay);
  }, [onLongPress, onStart, delay, shouldPreventDefault, shouldStopPropagation]);

  const clear = useCallback(() => {
    // Clear timeout and reset state
    if (timeout.current) {
      clearTimeout(timeout.current);
      timeout.current = undefined;
    }
    
    if (!longPressTriggered && onCancel) {
      onCancel();
    }
    
    startPosition.current = null;
    setLongPressTriggered(false);
  }, [longPressTriggered, onCancel]);
  
  const handleTouchMove = useCallback((event: React.TouchEvent) => {
    // If the user moves too much, cancel the long press
    if (!startPosition.current || !timeout.current) {
      return;
    }
    
    const touch = event.touches[0];
    const currentPosition = {
      x: touch.clientX,
      y: touch.clientY,
    };
    
    const distance = Math.sqrt(
      Math.pow(currentPosition.x - startPosition.current.x, 2) +
      Math.pow(currentPosition.y - startPosition.current.y, 2)
    );
    
    // If moved more than the threshold, cancel the long press
    if (distance > maxMoveDistance) {
      clear();
    }
  }, [clear]);

  const handleContextMenu = useCallback((event: React.MouseEvent) => {
    // Prevent default context menu on right-click
    event.preventDefault();
  }, []);

  const handleClick = useCallback((event: React.MouseEvent) => {
    if (longPressTriggered) {
      // If this was a long press, prevent click behavior
      event.stopPropagation();
      return;
    }
    
    onClick?.(event);
  }, [longPressTriggered, onClick]);

  return {
    onMouseDown: start,
    onMouseUp: clear,
    onMouseLeave: clear,
    onTouchStart: start,
    onTouchEnd: clear,
    onTouchMove: handleTouchMove,
    onContextMenu: handleContextMenu,
    onClick: handleClick,
  };
}; 