import { useState, useEffect, useRef, useCallback } from 'react';
import { useGeolocation } from '../../hooks/useGeolocation';

interface GeolocationPermissionProps {
  onPermissionChange?: (state: 'granted' | 'denied' | 'prompt' | 'unavailable') => void;
}

/**
 * Component to handle geolocation permission requests
 */
const GeolocationPermission: React.FC<GeolocationPermissionProps> = ({
  onPermissionChange
}) => {
  const [showPrompt, setShowPrompt] = useState<boolean>(false);
  const [userDismissed, setUserDismissed] = useState<boolean>(false);
  const { permissionState, refreshLocation } = useGeolocation();
  const prevPermissionStateRef = useRef<string | null>(null);
  
  useEffect(() => {
    // Only show prompt if:
    // 1. Permission state is 'prompt' (browser asking for permission)
    // 2. User hasn't manually dismissed it
    // 3. We don't have a cached dismissal
    const cachedDismissal = localStorage.getItem('location-prompt-dismissed');
    const shouldShow = permissionState === 'prompt' && 
                      !userDismissed && 
                      cachedDismissal !== 'true';
    
    setShowPrompt(shouldShow);
    
    // Clear dismissal cache if permission is granted
    if (permissionState === 'granted') {
      localStorage.removeItem('location-prompt-dismissed');
      setUserDismissed(false);
    }
    
    // Only call onPermissionChange if the permission state actually changed
    if (onPermissionChange && permissionState && permissionState !== prevPermissionStateRef.current) {
      prevPermissionStateRef.current = permissionState;
      onPermissionChange(permissionState);
    }
  }, [permissionState, onPermissionChange, userDismissed]);
  
  const handleRequestPermission = useCallback(() => {
    refreshLocation();
    setShowPrompt(false);
    setUserDismissed(true);
  }, [refreshLocation]);
  
  const handleDismiss = useCallback(() => {
    setShowPrompt(false);
    setUserDismissed(true);
    // Cache the dismissal for this session only (will be cleared on permission grant)
    localStorage.setItem('location-prompt-dismissed', 'true');
  }, []);
  
  if (!showPrompt) {
    return null;
  }
  
  return (
    <div className="geolocation-permission-overlay">
      <div className="geolocation-permission-modal">
        <div className="permission-icon">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
        </div>
        
        <div className="permission-content">
          <h3 className="permission-title">Enable Location Access</h3>
          <p className="permission-description">
            PlotPulse uses your location to show nearby plots and help you contribute to the community map. Your location data stays private and secure.
          </p>
        </div>
        
        <div className="permission-actions">
          <button 
            className="permission-btn permission-btn-secondary" 
            onClick={handleDismiss}
          >
            Not Now
          </button>
          <button 
            className="permission-btn permission-btn-primary" 
            onClick={handleRequestPermission}
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            Enable Location
          </button>
        </div>
      </div>
    </div>
  );
};

export default GeolocationPermission; 