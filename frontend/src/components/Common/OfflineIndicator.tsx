/* @refresh reset */
import React, { useState, useEffect } from 'react';

interface OfflineIndicatorProps {
  position?: 'top' | 'bottom';
}

/**
 * Component that shows when the user is offline
 * Provides feedback about cached data availability
 */
const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ position = 'top' }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showIndicator, setShowIndicator] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowIndicator(true);
      // Hide the "back online" message after 3 seconds
      setTimeout(() => setShowIndicator(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowIndicator(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Show indicator initially if offline
    if (!navigator.onLine) {
      setShowIndicator(true);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showIndicator) return null;

  const positionStyles = position === 'top' 
    ? { top: '16px' } 
    : { bottom: '16px' };

  return (
    <div 
      style={{
        position: 'fixed',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        padding: '12px 20px',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '14px',
        fontWeight: '500',
        maxWidth: '90vw',
        backgroundColor: isOnline ? '#4CAF50' : '#FF9800',
        color: 'white',
        ...positionStyles
      }}
    >
      <div style={{
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        backgroundColor: 'white',
        opacity: 0.8
      }} />
      
      {isOnline ? (
        <span>✅ Back online! Data will sync automatically.</span>
      ) : (
        <span>📱 You're offline. Viewing cached data.</span>
      )}
    </div>
  );
};

export default OfflineIndicator; 