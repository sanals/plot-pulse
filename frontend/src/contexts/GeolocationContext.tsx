import React, { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { useGeolocation } from '../hooks/useGeolocation';
import type { GeolocationPosition } from '../types/plot.types';

interface GeolocationContextType {
  position: GeolocationPosition | null;
  loading: boolean;
  error: string | null;
  timestamp: number | null;
  permissionState: 'granted' | 'denied' | 'prompt' | 'unavailable' | null;
  refreshLocation: () => void;
}

const GeolocationContext = createContext<GeolocationContextType | null>(null);

interface GeolocationProviderProps {
  children: ReactNode;
}

/**
 * Centralized geolocation provider to avoid multiple useGeolocation calls
 */
export const GeolocationProvider: React.FC<GeolocationProviderProps> = ({ children }) => {
  const geolocationData = useGeolocation({
    watchPosition: true,
    enableHighAccuracy: false, // WiFi-based for laptops
    timeout: 8000,
    cacheDuration: 5 * 60 * 1000 // 5 minutes
  });

  return (
    <GeolocationContext.Provider value={geolocationData}>
      {children}
    </GeolocationContext.Provider>
  );
};

/**
 * Hook to use the centralized geolocation data
 */
export const useGeolocationContext = (): GeolocationContextType => {
  const context = useContext(GeolocationContext);
  if (!context) {
    throw new Error('useGeolocationContext must be used within a GeolocationProvider');
  }
  return context;
}; 