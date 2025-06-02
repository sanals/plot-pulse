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
    enableHighAccuracy = false, // Changed to false for laptops - WiFi location first
    timeout = 8000, // Reduced to 8s for faster response
    maximumAge = 60000, // Accept cached position up to 1 minute old
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
    console.log('💾 [GEOLOCATION] Checking cache...');
    try {
      const cachedData = localStorage.getItem(CACHE_KEY);
      if (cachedData) {
        const { position, timestamp } = JSON.parse(cachedData);
        
        // Check if cached data is still valid
        const now = Date.now();
        const cacheAge = now - timestamp;
        console.log('💾 [GEOLOCATION] Found cached data:', {
          position,
          cacheAge: `${Math.round(cacheAge / 1000)}s old`,
          isValid: cacheAge < cacheDuration
        });
        
        if (cacheAge < cacheDuration) {
          setState(prev => ({
            ...prev,
            position,
            timestamp,
            loading: false,
          }));
          console.log('✅ [GEOLOCATION] Using valid cached position');
        } else {
          // Clear expired cache
          localStorage.removeItem(CACHE_KEY);
          console.log('🗑️ [GEOLOCATION] Cleared expired cache');
        }
      } else {
        console.log('❌ [GEOLOCATION] No cached position found');
      }
    } catch (error) {
      console.error('❌ [GEOLOCATION] Error reading cached location:', error);
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
    console.log('🔄 [GEOLOCATION] Starting with options:', {
      enableHighAccuracy,
      timeout,
      maximumAge,
      watchPosition,
      hasNavigatorGeolocation: !!navigator.geolocation
    });
    
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
      const accuracy = position.accuracy || 999999;
      console.log('🌍 [GEOLOCATION] Success:', {
        latitude: position.latitude,
        longitude: position.longitude,
        accuracy: accuracy,
        source: accuracy < 50 ? 'GPS/WiFi' : accuracy < 1000 ? 'WiFi' : 'IP/Network'
      });
      
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
      console.log('❌ [GEOLOCATION] Error:', {
        code: error.code,
        message: error.message,
        codes: {
          1: 'PERMISSION_DENIED',
          2: 'POSITION_UNAVAILABLE', 
          3: 'TIMEOUT'
        }
      });
      
      let permissionState: PermissionState = 'prompt';
      let errorMessage = error.message;
      
      // Handle specific error codes
      switch (error.code) {
        case error.PERMISSION_DENIED:
          permissionState = 'denied';
          errorMessage = '📍 Location access blocked. Click the location icon 🌐 in your browser\'s address bar to enable.';
          break;
        case error.POSITION_UNAVAILABLE:
          errorMessage = '🛰️ Location temporarily unavailable. Try moving to an area with better signal.';
          break;
        case error.TIMEOUT:
          errorMessage = 'Location request timed out. Trying WiFi-based location...';
          // Show loading state during retry
          setState(prev => ({
            ...prev,
            error: null, // Clear error during retry
            loading: true, // Keep loading state during retry
            permissionState: 'prompt',
          }));
          
          // Immediate WiFi-based fallback for laptops
          setTimeout(() => {
            // First fallback: WiFi-only location (fast)
            navigator.geolocation.getCurrentPosition(
              (position) => {
                geoSuccess({
                  latitude: position.coords.latitude,
                  longitude: position.coords.longitude,
                  accuracy: position.coords.accuracy,
                });
              },
              (retryError) => {
                // Second fallback: Accept any cached position
                if (retryError.code === retryError.TIMEOUT) {
                  navigator.geolocation.getCurrentPosition(
                    (position) => {
                      geoSuccess({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        accuracy: position.coords.accuracy,
                      });
                    },
                    (_finalError) => {
                      setState(prev => ({
                        ...prev,
                        error: '📍 Location unavailable. Try: 1) Enabling WiFi 2) Allowing location in browser 3) Refreshing page',
                        loading: false,
                        permissionState: 'prompt',
                      }));
                    },
                    {
                      enableHighAccuracy: false,
                      timeout: 5000, // Very short timeout for final attempt
                      maximumAge: 600000, // Accept very old cached position (10 minutes)
                    }
                  );
                } else {
                  setState(prev => ({
                    ...prev,
                    error: '📍 Location unavailable. Try: 1) Enabling WiFi 2) Allowing location in browser 3) Refreshing page',
                    loading: false,
                    permissionState: 'prompt',
                  }));
                }
              },
              {
                enableHighAccuracy: false, // WiFi-only
                timeout: 5000, // Short timeout (5 seconds)
                maximumAge: 300000, // Accept cached position up to 5 minutes old
              }
            );
          }, 200);
          return; // Don't set error state immediately, let retry happen
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