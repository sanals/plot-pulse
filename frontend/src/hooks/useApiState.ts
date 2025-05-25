import { useState, useEffect } from 'react';
import { subscribeToApiState, getApiState, clearApiError } from '../services/plotService';

interface ApiState {
  loading: boolean;
  error: string | null;
  requestsInProgress: Set<string>;
}

/**
 * React hook to access global API state
 * Provides loading states and error handling for all API requests
 */
export const useApiState = () => {
  const [state, setState] = useState<ApiState>(getApiState());

  useEffect(() => {
    // Subscribe to state changes
    const unsubscribe = subscribeToApiState((newState) => {
      setState(newState);
    });

    // Cleanup subscription on unmount
    return unsubscribe;
  }, []);

  return {
    ...state,
    clearError: clearApiError,
    isLoading: state.loading,
    hasError: !!state.error,
    activeRequestsCount: state.requestsInProgress.size,
  };
}; 