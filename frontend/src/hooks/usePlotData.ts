import { useState, useEffect, useCallback } from 'react';
import { getPlots, createPlot, updatePlot, deletePlot, getNearestPlot } from '../services/plotService';
import type { PlotDto, NearestPlotRequest, MapBounds } from '../types/plot.types';

interface UsePlotDataState {
  plots: PlotDto[];
  loading: boolean;
  error: string | null;
  selectedPlot: PlotDto | null;
  nearestPlot: PlotDto | null;
}

interface UsePlotDataActions {
  loadPlots: () => Promise<void>;
  addPlot: (plotData: Omit<PlotDto, 'id' | 'createdAt' | 'updatedAt'>) => Promise<PlotDto>;
  updatePlotData: (id: number, plotData: Partial<PlotDto>) => Promise<PlotDto>;
  removePlot: (id: number) => Promise<void>;
  findNearestPlot: (request: NearestPlotRequest) => Promise<PlotDto | null>;
  selectPlot: (plot: PlotDto | null) => void;
  clearError: () => void;
  refreshPlots: () => Promise<void>;
  getPlotsInBounds: (bounds: MapBounds) => PlotDto[];
}

interface UsePlotDataOptions {
  autoLoad?: boolean;
  cacheTimeout?: number; // in milliseconds
}

/**
 * Custom hook for comprehensive plot data management
 * Handles state, API calls, caching, and error management
 */
export const usePlotData = (options: UsePlotDataOptions = {}): UsePlotDataState & UsePlotDataActions => {
  const { autoLoad = true, cacheTimeout = 5 * 60 * 1000 } = options; // 5 minutes default cache

  const [state, setState] = useState<UsePlotDataState>({
    plots: [],
    loading: false,
    error: null,
    selectedPlot: null,
    nearestPlot: null,
  });

  const [lastFetchTime, setLastFetchTime] = useState<number>(0);

  // Helper function to update state
  const updateState = useCallback((updates: Partial<UsePlotDataState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // Load plots from API
  const loadPlots = useCallback(async () => {
    const now = Date.now();
    
    // Check cache validity
    if (state.plots.length > 0 && (now - lastFetchTime) < cacheTimeout) {
      console.log('[usePlotData] Using cached plot data');
      return;
    }

    updateState({ loading: true, error: null });
    
    try {
      console.log('[usePlotData] Fetching plots from API');
      const plots = await getPlots();
      updateState({ 
        plots, 
        loading: false,
        error: null 
      });
      setLastFetchTime(now);
      console.log(`[usePlotData] Successfully loaded ${plots.length} plots`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load plots';
      console.error('[usePlotData] Error loading plots:', error);
      updateState({ 
        loading: false, 
        error: errorMessage 
      });
    }
  }, [state.plots.length, lastFetchTime, cacheTimeout, updateState]);

  // Add new plot
  const addPlot = useCallback(async (plotData: Omit<PlotDto, 'id' | 'createdAt' | 'updatedAt'>): Promise<PlotDto> => {
    updateState({ loading: true, error: null });
    
    try {
      console.log('[usePlotData] Creating new plot:', plotData);
      const newPlot = await createPlot(plotData as PlotDto);
      
      // Add to local state immediately for optimistic updates
      updateState({ 
        plots: [...state.plots, newPlot],
        loading: false,
        error: null 
      });
      
      console.log('[usePlotData] Successfully created plot:', newPlot);
      return newPlot;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create plot';
      console.error('[usePlotData] Error creating plot:', error);
      updateState({ 
        loading: false, 
        error: errorMessage 
      });
      throw error;
    }
  }, [state.plots, updateState]);

  // Update existing plot
  const updatePlotData = useCallback(async (id: number, plotData: Partial<PlotDto>): Promise<PlotDto> => {
    updateState({ loading: true, error: null });
    
    try {
      console.log('[usePlotData] Updating plot:', id, plotData);
      const updatedPlot = await updatePlot(id, plotData as PlotDto);
      
      // Update in local state
      const updatedPlots = state.plots.map(plot => 
        plot.id === id ? updatedPlot : plot
      );
      
      updateState({ 
        plots: updatedPlots,
        loading: false,
        error: null,
        selectedPlot: state.selectedPlot?.id === id ? updatedPlot : state.selectedPlot
      });
      
      console.log('[usePlotData] Successfully updated plot:', updatedPlot);
      return updatedPlot;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update plot';
      console.error('[usePlotData] Error updating plot:', error);
      updateState({ 
        loading: false, 
        error: errorMessage 
      });
      throw error;
    }
  }, [state.plots, state.selectedPlot, updateState]);

  // Remove plot
  const removePlot = useCallback(async (id: number): Promise<void> => {
    updateState({ loading: true, error: null });
    
    try {
      console.log('[usePlotData] Deleting plot:', id);
      await deletePlot(id);
      
      // Remove from local state
      const filteredPlots = state.plots.filter(plot => plot.id !== id);
      
      updateState({ 
        plots: filteredPlots,
        loading: false,
        error: null,
        selectedPlot: state.selectedPlot?.id === id ? null : state.selectedPlot
      });
      
      console.log('[usePlotData] Successfully deleted plot:', id);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete plot';
      console.error('[usePlotData] Error deleting plot:', error);
      updateState({ 
        loading: false, 
        error: errorMessage 
      });
      throw error;
    }
  }, [state.plots, state.selectedPlot, updateState]);

  // Find nearest plot
  const findNearestPlot = useCallback(async (request: NearestPlotRequest): Promise<PlotDto | null> => {
    try {
      console.log('[usePlotData] Finding nearest plot:', request);
      const nearest = await getNearestPlot(request);
      
      updateState({ nearestPlot: nearest });
      console.log('[usePlotData] Found nearest plot:', nearest);
      
      return nearest;
    } catch (error) {
      console.error('[usePlotData] Error finding nearest plot:', error);
      updateState({ nearestPlot: null });
      return null;
    }
  }, [updateState]);

  // Select plot
  const selectPlot = useCallback((plot: PlotDto | null) => {
    updateState({ selectedPlot: plot });
  }, [updateState]);

  // Clear error
  const clearError = useCallback(() => {
    updateState({ error: null });
  }, [updateState]);

  // Refresh plots (force reload)
  const refreshPlots = useCallback(async () => {
    setLastFetchTime(0); // Reset cache
    await loadPlots();
  }, [loadPlots]);

  // Get plots within bounds (client-side filtering)
  const getPlotsInBounds = useCallback((bounds: MapBounds): PlotDto[] => {
    return state.plots.filter(plot => 
      plot.latitude <= bounds.north &&
      plot.latitude >= bounds.south &&
      plot.longitude <= bounds.east &&
      plot.longitude >= bounds.west
    );
  }, [state.plots]);

  // Auto-load plots on mount
  useEffect(() => {
    if (autoLoad) {
      loadPlots();
    }
  }, [autoLoad, loadPlots]);

  return {
    // State
    ...state,
    
    // Actions
    loadPlots,
    addPlot,
    updatePlotData,
    removePlot,
    findNearestPlot,
    selectPlot,
    clearError,
    refreshPlots,
    getPlotsInBounds,
  };
}; 