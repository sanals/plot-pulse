import { useState, useEffect, useCallback } from 'react';
import type { GeolocationPosition } from '../types/plot.types';

interface GeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  cacheDuration?: number;
  watchPosition?: boolean;
}

interface GeolocationState {
  position: GeolocationPosition | null;
  error: string | null;
  loading: boolean;
  timestamp: number | null;
  permissionState: PermissionState | null;
}

type PermissionState = 'granted' | 'denied' | 'prompt' | 'unavailable';

const CACHE_KEY = 'plotpulse_user_location';
const DEFAULT_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Enhanced hook to handle geolocation functionality with caching and permissions
 */
export const useGeolocation = (options: GeolocationOptions = {}) => {
  const {
    enableHighAccuracy = true,
    timeout = 10000,
    maximumAge = 0,
    cacheDuration = DEFAULT_CACHE_DURATION,
    watchPosition = true,
  } = options;

  const [state, setState] = useState<GeolocationState>({
    position: null,
    error: null,
    loading: true,
    timestamp: null,
    permissionState: null,
  });

  // Try to get cached position on initial load
  useEffect(() => {
    try {
      const cachedData = localStorage.getItem(CACHE_KEY);
      if (cachedData) {
        const { position, timestamp } = JSON.parse(cachedData);
        
        // Check if cached data is still valid
        const now = Date.now();
        if (now - timestamp < cacheDuration) {
          setState(prev => ({
            ...prev,
            position,
            timestamp,
            loading: false,
          }));
        } else {
          // Clear expired cache
          localStorage.removeItem(CACHE_KEY);
        }
      }
    } catch (error) {
      console.error('Error reading cached location:', error);
    }
  }, [cacheDuration]);

  // Check for geolocation permissions
  useEffect(() => {
    const checkPermission = async () => {
      try {
        if (navigator.permissions && navigator.permissions.query) {
          const result = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
          
          setState(prev => ({
            ...prev,
            permissionState: result.state as PermissionState,
          }));

          // Listen for permission changes
          result.addEventListener('change', () => {
            setState(prev => ({
              ...prev,
              permissionState: result.state as PermissionState,
            }));
          });
        }
      } catch (error) {
        console.error('Error checking geolocation permission:', error);
      }
    };

    checkPermission();
  }, []);

  // Get current position or watch for position updates
  useEffect(() => {
    if (!navigator.geolocation) {
      setState(prev => ({
        ...prev,
        error: 'Geolocation is not supported by your browser',
        loading: false,
        permissionState: 'unavailable',
      }));
      return;
    }

    const geoSuccess = (position: GeolocationPosition) => {
      const newPosition = {
        latitude: position.latitude,
        longitude: position.longitude,
        accuracy: position.accuracy,
      };
      
      const timestamp = Date.now();
      
      // Cache the position
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({
          position: newPosition,
          timestamp,
        }));
      } catch (error) {
        console.error('Error caching location:', error);
      }

      setState(prev => ({
        ...prev,
        position: newPosition,
        timestamp,
        error: null,
        loading: false,
        permissionState: 'granted',
      }));
    };

    const geoError = (error: GeolocationPositionError) => {
      let permissionState: PermissionState = 'prompt';
      let errorMessage = error.message;
      
      // Handle specific error codes
      switch (error.code) {
        case error.PERMISSION_DENIED:
          permissionState = 'denied';
          errorMessage = 'Location access was denied. Please enable location services in your browser settings.';
          break;
        case error.POSITION_UNAVAILABLE:
          errorMessage = 'Location information is unavailable. Please try again later.';
          break;
        case error.TIMEOUT:
          errorMessage = 'The request to get location timed out. Please check your connection and try again.';
          break;
      }

      setState(prev => ({
        ...prev,
        error: errorMessage,
        loading: false,
        permissionState,
      }));
    };

    const geoOptions = {
      enableHighAccuracy,
      timeout,
      maximumAge,
    };

    let watchId: number | null = null;

    if (watchPosition) {
      // Watch for position changes
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          geoSuccess({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          });
        },
        geoError,
        geoOptions
      );
    } else {
      // Just get current position once
      setState(prev => ({ ...prev, loading: true }));
      navigator.geolocation.getCurrentPosition(
        (position) => {
          geoSuccess({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          });
        },
        geoError,
        geoOptions
      );
    }

    // Cleanup
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [enableHighAccuracy, timeout, maximumAge, watchPosition]);

  // Function to manually refresh the location
  const refreshLocation = useCallback(() => {
    setState(prev => ({ ...prev, loading: true }));
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newPosition = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        };
        
        const timestamp = Date.now();
        
        // Cache the position
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify({
            position: newPosition,
            timestamp,
          }));
        } catch (error) {
          console.error('Error caching location:', error);
        }

        setState(prev => ({
          ...prev,
          position: newPosition,
          timestamp,
          error: null,
          loading: false,
        }));
      },
      (error) => {
        setState(prev => ({
          ...prev,
          error: error.message,
          loading: false,
        }));
      },
      { enableHighAccuracy, timeout, maximumAge }
    );
  }, [enableHighAccuracy, timeout, maximumAge]);

  return {
    ...state,
    refreshLocation,
  };
}; 