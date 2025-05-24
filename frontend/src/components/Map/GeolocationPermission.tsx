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
  const { permissionState, refreshLocation } = useGeolocation();
  const prevPermissionStateRef = useRef<string | null>(null);
  
  useEffect(() => {
    if (permissionState === 'prompt') {
      setShowPrompt(true);
    } else {
      setShowPrompt(false);
    }
    
    // Only call onPermissionChange if the permission state actually changed
    if (onPermissionChange && permissionState && permissionState !== prevPermissionStateRef.current) {
      prevPermissionStateRef.current = permissionState;
      onPermissionChange(permissionState);
    }
  }, [permissionState, onPermissionChange]);
  
  const handleRequestPermission = useCallback(() => {
    refreshLocation();
    setShowPrompt(false);
  }, [refreshLocation]);
  
  const handleDismiss = useCallback(() => {
    setShowPrompt(false);
  }, []);
  
  if (!showPrompt) {
    return null;
  }
  
  return (
    <div className="absolute bottom-4 left-0 right-0 mx-auto w-max max-w-md z-50 bg-white rounded-md shadow-lg p-4">
      <div className="flex items-center mb-2">
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="w-6 h-6 text-blue-500 mr-2" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M8 14s1.5 2 4 2 4-2 4-2" />
          <line x1="9" y1="9" x2="9.01" y2="9" />
          <line x1="15" y1="9" x2="15.01" y2="9" />
        </svg>
        <h3 className="text-lg font-semibold">Enable Location Services</h3>
      </div>
      
      <p className="text-gray-600 mb-3">
        PlotPulse works best when you share your location. This helps you find plots near you and contributes to the community map.
      </p>
      
      <div className="flex justify-end space-x-2">
        <button 
          className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300" 
          onClick={handleDismiss}
        >
          Not Now
        </button>
        <button 
          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600" 
          onClick={handleRequestPermission}
        >
          Enable Location
        </button>
      </div>
    </div>
  );
};

export default GeolocationPermission; 