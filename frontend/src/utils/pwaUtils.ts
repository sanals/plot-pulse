/**
 * PWA utility functions for service worker management and offline functionality
 */

import type { PlotDto } from '../types/plot.types';

// Cache keys
const PLOTS_CACHE_KEY = 'plotpulse_cached_plots';
const OFFLINE_SUBMISSIONS_KEY = 'plotpulse_offline_submissions';
const CACHE_TIMESTAMP_KEY = 'plotpulse_cache_timestamp';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Check if the app is running in standalone mode (installed as PWA)
 */
export const isPWAInstalled = (): boolean => {
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
  const isInWebAppiOS = (window.navigator as any).standalone === true;
  return isStandalone || isInWebAppiOS;
};

/**
 * Check if the user is currently online
 */
export const isOnline = (): boolean => {
  return navigator.onLine;
};

/**
 * Cache plot data for offline viewing
 */
export const cachePlotData = (plots: PlotDto[]): void => {
  try {
    const cacheData = {
      plots,
      timestamp: Date.now()
    };
    localStorage.setItem(PLOTS_CACHE_KEY, JSON.stringify(cacheData));
    localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
    console.log(`[PWA] Cached ${plots.length} plots for offline viewing`);
  } catch (error) {
    console.error('[PWA] Failed to cache plot data:', error);
  }
};

/**
 * Get cached plot data
 */
export const getCachedPlotData = (): PlotDto[] | null => {
  try {
    const cachedData = localStorage.getItem(PLOTS_CACHE_KEY);
    const cacheTimestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
    
    if (!cachedData || !cacheTimestamp) {
      return null;
    }
    
    const timestamp = parseInt(cacheTimestamp, 10);
    const now = Date.now();
    
    // Check if cache is still valid
    if (now - timestamp > CACHE_DURATION) {
      console.log('[PWA] Cache expired, clearing old data');
      localStorage.removeItem(PLOTS_CACHE_KEY);
      localStorage.removeItem(CACHE_TIMESTAMP_KEY);
      return null;
    }
    
    const { plots } = JSON.parse(cachedData);
    console.log(`[PWA] Retrieved ${plots.length} plots from cache`);
    return plots;
  } catch (error) {
    console.error('[PWA] Failed to retrieve cached plot data:', error);
    return null;
  }
};

/**
 * Queue plot submission for when back online
 */
export const queueOfflineSubmission = (plotData: Omit<PlotDto, 'id' | 'createdAt' | 'updatedAt'>): void => {
  try {
    const existingQueue = getOfflineSubmissionQueue();
    const newSubmission = {
      id: Date.now().toString(), // Temporary ID
      data: plotData,
      timestamp: Date.now(),
      type: 'create' as const
    };
    
    const updatedQueue = [...existingQueue, newSubmission];
    localStorage.setItem(OFFLINE_SUBMISSIONS_KEY, JSON.stringify(updatedQueue));
    console.log('[PWA] Queued plot submission for offline sync');
  } catch (error) {
    console.error('[PWA] Failed to queue offline submission:', error);
  }
};

/**
 * Get queued offline submissions
 */
export const getOfflineSubmissionQueue = (): Array<{
  id: string;
  data: Omit<PlotDto, 'id' | 'createdAt' | 'updatedAt'>;
  timestamp: number;
  type: 'create' | 'update' | 'delete';
}> => {
  try {
    const queueData = localStorage.getItem(OFFLINE_SUBMISSIONS_KEY);
    return queueData ? JSON.parse(queueData) : [];
  } catch (error) {
    console.error('[PWA] Failed to retrieve offline submission queue:', error);
    return [];
  }
};

/**
 * Clear processed offline submissions
 */
export const clearOfflineSubmissionQueue = (): void => {
  try {
    localStorage.removeItem(OFFLINE_SUBMISSIONS_KEY);
    console.log('[PWA] Cleared offline submission queue');
  } catch (error) {
    console.error('[PWA] Failed to clear offline submission queue:', error);
  }
};

/**
 * Process queued offline submissions when back online
 */
export const processOfflineSubmissions = async (
  submitFunction: (data: Omit<PlotDto, 'id' | 'createdAt' | 'updatedAt'>) => Promise<PlotDto>
): Promise<void> => {
  if (!isOnline()) {
    console.log('[PWA] Still offline, cannot process submissions');
    return;
  }
  
  const queue = getOfflineSubmissionQueue();
  if (queue.length === 0) {
    console.log('[PWA] No offline submissions to process');
    return;
  }
  
  console.log(`[PWA] Processing ${queue.length} offline submissions`);
  
  const results = await Promise.allSettled(
    queue.map(async (submission) => {
      try {
        await submitFunction(submission.data);
        console.log(`[PWA] Successfully synced offline submission ${submission.id}`);
      } catch (error) {
        console.error(`[PWA] Failed to sync offline submission ${submission.id}:`, error);
        throw error;
      }
    })
  );
  
  // Count successful submissions
  const successful = results.filter(result => result.status === 'fulfilled').length;
  const failed = results.filter(result => result.status === 'rejected').length;
  
  if (successful > 0) {
    console.log(`[PWA] Successfully synced ${successful} offline submissions`);
  }
  
  if (failed > 0) {
    console.warn(`[PWA] Failed to sync ${failed} offline submissions`);
  }
  
  // Clear the queue if all submissions were successful
  if (failed === 0) {
    clearOfflineSubmissionQueue();
  }
};

/**
 * Register service worker update listener
 */
export const registerSWUpdateListener = (onUpdate: () => void): void => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('[PWA] Service worker updated');
      onUpdate();
    });
  }
};

/**
 * Get cache storage usage information
 */
export const getCacheStorageInfo = async (): Promise<{
  usage: number;
  quota: number;
  percentage: number;
}> => {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    try {
      const estimate = await navigator.storage.estimate();
      const usage = estimate.usage || 0;
      const quota = estimate.quota || 0;
      const percentage = quota > 0 ? (usage / quota) * 100 : 0;
      
      return { usage, quota, percentage };
    } catch (error) {
      console.error('[PWA] Failed to get storage estimate:', error);
    }
  }
  
  return { usage: 0, quota: 0, percentage: 0 };
}; 