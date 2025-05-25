import type { NearestPlotRequest, PlotDto, MapBounds } from '../types/plot.types';

// Configuration
const USE_MOCK_DATA = false;
const API_URL = 'http://localhost:8091/api/v1';
const REQUEST_TIMEOUT = 10000; // 10 seconds
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

// Store mock plots in memory so we can add to them (only used as fallback)
let mockPlots: PlotDto[] = [];

/**
 * Global state management for API requests
 */
interface ApiState {
  loading: boolean;
  error: string | null;
  requestsInProgress: Set<string>;
}

const apiState: ApiState = {
  loading: false,
  error: null,
  requestsInProgress: new Set(),
};

// State change listeners
const stateListeners: Array<(state: ApiState) => void> = [];

/**
 * Subscribe to API state changes
 */
export const subscribeToApiState = (listener: (state: ApiState) => void): (() => void) => {
  stateListeners.push(listener);
  
  // Return unsubscribe function
  return () => {
    const index = stateListeners.indexOf(listener);
    if (index > -1) {
      stateListeners.splice(index, 1);
    }
  };
};

/**
 * Get current API state
 */
export const getApiState = (): Readonly<ApiState> => {
  return { ...apiState };
};

/**
 * Update API state and notify listeners
 */
const updateApiState = (updates: Partial<ApiState>): void => {
  Object.assign(apiState, updates);
  stateListeners.forEach(listener => listener({ ...apiState }));
};

/**
 * Track request start
 */
const startRequest = (requestId: string): void => {
  apiState.requestsInProgress.add(requestId);
  updateApiState({
    loading: apiState.requestsInProgress.size > 0,
    error: null,
  });
};

/**
 * Track request completion
 */
const endRequest = (requestId: string, error?: Error): void => {
  apiState.requestsInProgress.delete(requestId);
  updateApiState({
    loading: apiState.requestsInProgress.size > 0,
    error: error?.message || null,
  });
};

/**
 * Clear all errors
 */
export const clearApiError = (): void => {
  updateApiState({ error: null });
};

/**
 * Enhanced fetch with timeout support
 */
const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeout = REQUEST_TIMEOUT): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeout}ms`);
    }
    throw error;
  }
};

/**
 * Retry logic for failed requests
 */
const retryRequest = async <T>(
  requestFn: () => Promise<T>,
  maxRetries = MAX_RETRIES,
  delay = RETRY_DELAY
): Promise<T> => {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      
      // Don't retry client errors (400-499)
      if ((error as any).response?.status >= 400 && (error as any).response?.status < 500) {
        throw error;
      }
      
      if (attempt === maxRetries) {
        console.error(`Request failed after ${maxRetries} attempts:`, lastError);
        throw lastError;
      }
      
      console.warn(`Request attempt ${attempt} failed, retrying in ${delay}ms:`, lastError.message);
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 1.5; // Exponential backoff
    }
  }
  
  throw lastError!;
};

/**
 * Request interceptor for common headers and logging
 */
const createRequestOptions = (options: RequestInit = {}): RequestInit => {
  const defaultHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Client-Version': '1.0.0',
    'X-Request-ID': generateRequestId(),
  };
  
  return {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };
};

/**
 * Response interceptor for common error handling and logging
 */
const handleResponse = async (response: Response, url: string): Promise<any> => {
  const requestId = response.headers.get('X-Request-ID') || 'unknown';
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[${requestId}] HTTP ${response.status} error for ${url}:`, errorText);
    
    // Parse the error response to extract backend message
    let backendError;
    try {
      backendError = JSON.parse(errorText);
    } catch (parseError) {
      backendError = { message: `HTTP ${response.status}: ${response.statusText}` };
    }
    
    // Create an error object that mimics Axios structure for compatibility
    const error = new Error(backendError.message || `HTTP ${response.status}: ${response.statusText}`);
    (error as any).response = {
      status: response.status,
      statusText: response.statusText,
      data: backendError
    };
    
    throw error;
  }
  
  // Handle 204 No Content responses (common for DELETE operations)
  if (response.status === 204) {
    console.log(`[${requestId}] Successful response (204 No Content) from ${url}`);
    return null;
  }
  
  // For other successful responses, try to parse JSON
  try {
    const data = await response.json();
    console.log(`[${requestId}] Successful response from ${url}`);
    return data;
  } catch (error) {
    // Some successful responses might not have JSON content
    console.log(`[${requestId}] Successful response from ${url} (no JSON content)`);
    return null;
  }
};

/**
 * Generate unique request ID for tracking
 */
const generateRequestId = (): string => {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Enhanced API request wrapper with timeout, retry, and interceptors
 */
const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {},
  useRetry = true
): Promise<T> => {
  const url = `${API_URL}${endpoint}`;
  const requestOptions = createRequestOptions(options);
  const requestId = (requestOptions.headers as Record<string, string>)?.['X-Request-ID'] || generateRequestId();
  
  // Start tracking this request
  startRequest(requestId);
  
  const makeRequest = async (): Promise<T> => {
    console.log(`[${requestId}] Making request to ${url}`, { method: requestOptions.method || 'GET' });
    const response = await fetchWithTimeout(url, requestOptions);
    return handleResponse(response, url);
  };
  
  try {
    let result: T;
    if (useRetry) {
      result = await retryRequest(makeRequest);
    } else {
      result = await makeRequest();
    }
    
    // Request completed successfully
    endRequest(requestId);
    return result;
  } catch (error) {
    // Request failed
    endRequest(requestId, error instanceof Error ? error : new Error('Unknown error'));
    throw error;
  }
};

/**
 * Fetch all plots (with optional pagination)
 */
export const getPlots = async (page = 0, size = 100): Promise<PlotDto[]> => {
  if (USE_MOCK_DATA) {
    console.log('Using mock data for plots');
    if (mockPlots.length === 0) {
      // Initialize mock data on first call
      mockPlots = generateMockPlots();
    }
    return [...mockPlots]; // Return a copy
  }

  try {
    const plots = await apiRequest<PlotDto[]>(`/plots?page=${page}&size=${size}`);
    console.log(`Successfully fetched ${plots.length} plots from backend`);
    return plots;
  } catch (error) {
    console.error('Error fetching plots from backend:', error);
    console.log('Falling back to mock data');
    if (mockPlots.length === 0) {
      // Initialize mock data on first call
      mockPlots = generateMockPlots();
    }
    return [...mockPlots]; // Return a copy as fallback
  }
};

/**
 * Fetch plots within a bounding box
 */
export const getPlotsInBounds = async (bounds: MapBounds, page = 0, size = 100): Promise<PlotDto[]> => {
  if (USE_MOCK_DATA) {
    console.log('Using mock data for plots in bounds');
    return getMockPlots().filter(
      plot => 
        plot.latitude <= bounds.north &&
        plot.latitude >= bounds.south &&
        plot.longitude <= bounds.east &&
        plot.longitude >= bounds.west
    );
  }

  try {
    const { north, south, east, west } = bounds;
    const endpoint = `/plots/bounds?minLat=${south}&maxLat=${north}&minLng=${west}&maxLng=${east}&page=${page}&size=${size}`;
    
    const plots = await apiRequest<PlotDto[]>(endpoint);
    console.log(`Successfully fetched ${plots.length} plots in bounds from backend`);
    return plots;
  } catch (error) {
    console.error('Error fetching plots in bounds from backend:', error);
    console.log('Falling back to mock data');
    // For development, return mock data if API is not available
    return getMockPlots().filter(
      plot => 
        plot.latitude <= bounds.north &&
        plot.latitude >= bounds.south &&
        plot.longitude <= bounds.east &&
        plot.longitude >= bounds.west
    );
  }
};

/**
 * Find the nearest plot to a location
 */
export const getNearestPlot = async (request: NearestPlotRequest): Promise<PlotDto | null> => {
  if (USE_MOCK_DATA) {
    console.log('Using mock data for nearest plot');
    const { latitude, longitude, radius } = request;
    
    // Find plot with minimum distance
    const plots = getMockPlots();
    let nearestPlot: PlotDto | null = null;
    let minDistance = Infinity;
    
    for (const plot of plots) {
      const distance = calculateDistance(
        latitude, longitude, 
        plot.latitude, plot.longitude
      );
      
      if (distance <= radius && distance < minDistance) {
        minDistance = distance;
        nearestPlot = plot;
      }
    }
    
    return nearestPlot;
  }

  try {
    const { latitude, longitude, radius } = request;
    const endpoint = `/plots/nearest?lat=${latitude}&lon=${longitude}&radius=${radius}`;
    
    try {
      const nearestPlot = await apiRequest<PlotDto>(endpoint);
      console.log('Successfully found nearest plot from backend:', nearestPlot);
      return nearestPlot;
    } catch (error) {
      // Handle 404 as no plot found (not an error)
      if ((error as any).response?.status === 404) {
        console.log('No nearest plot found within radius');
        return null;
      }
      throw error;
    }
  } catch (error) {
    console.error('Error finding nearest plot from backend:', error);
    console.log('Falling back to mock data');
    
    // Fallback to mock data calculation
    const { latitude, longitude, radius } = request;
    const plots = getMockPlots();
    let nearestPlot: PlotDto | null = null;
    let minDistance = Infinity;
    
    for (const plot of plots) {
      const distance = calculateDistance(
        latitude, longitude, 
        plot.latitude, plot.longitude
      );
      
      if (distance <= radius && distance < minDistance) {
        minDistance = distance;
        nearestPlot = plot;
      }
    }
    
    return nearestPlot;
  }
};

// Haversine formula for calculating distances between coordinates
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Radius of the earth in meters
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in meters
}

function deg2rad(deg: number): number {
  return deg * (Math.PI/180);
}

/**
 * Create a new plot
 */
export const createPlot = async (plot: PlotDto): Promise<PlotDto> => {
  if (USE_MOCK_DATA) {
    console.log('%c[MOCK API] Creating new plot', 'color: green; font-weight: bold');
    console.table(plot);
    
    // Generate a random ID for the new plot
    const newId = Math.floor(Math.random() * 1000) + 100;
    const timestamp = new Date().toISOString();
    
    const newPlot = {
      ...plot,
      id: newId,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    
    console.log('%c[MOCK API] Plot created successfully', 'color: green; font-weight: bold');
    console.table(newPlot);
    
    // Add to our mock plots collection
    if (mockPlots.length === 0) {
      // Initialize mock data if not already done
      mockPlots = generateMockPlots();
    }
    mockPlots.push(newPlot);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return newPlot;
  }

  try {
    console.log('Creating new plot with data:', plot);
    
    const responseData = await apiRequest<PlotDto>('/plots', {
      method: 'POST',
      body: JSON.stringify(plot),
    }, false); // Don't retry for create operations to avoid duplicates
    
    console.log('Plot created successfully on backend:', responseData);
    return responseData;
  } catch (error) {
    console.error('Error creating plot on backend:', error);
    
    // Re-throw the error so the form can handle it
    // Don't fall back to mock data when there's a validation error
    if ((error as any).response && (error as any).response.status >= 400 && (error as any).response.status < 500) {
      throw error; // Re-throw client errors (validation, conflict, etc.)
    }
    
    console.log('Falling back to mock data for network/server errors');
    
    // For development, return the plot with a mock ID as fallback
    const newId = Math.floor(Math.random() * 1000) + 100;
    const timestamp = new Date().toISOString();
    const fallbackPlot = {
      ...plot,
      id: newId,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    
    // Add to our mock plots as fallback
    if (mockPlots.length === 0) {
      mockPlots = generateMockPlots();
    }
    mockPlots.push(fallbackPlot);
    
    return fallbackPlot;
  }
};

/**
 * Update an existing plot
 */
export const updatePlot = async (id: number, plot: PlotDto): Promise<PlotDto> => {
  try {
    const updatedPlot = await apiRequest<PlotDto>(`/plots/${id}`, {
      method: 'PUT',
      body: JSON.stringify(plot),
    }, false); // Don't retry for update operations to avoid conflicts
    
    console.log('Plot updated successfully:', updatedPlot);
    return updatedPlot;
  } catch (error) {
    console.error('Error updating plot:', error);
    throw error;
  }
};

/**
 * Delete a plot
 */
export const deletePlot = async (id: number): Promise<void> => {
  try {
    // For DELETE operations, backend returns 204 No Content
    await apiRequest<void>(`/plots/${id}`, {
      method: 'DELETE',
    }, false); // Don't retry for delete operations to avoid confusion
    
    console.log('Plot deleted successfully:', id);
    // Return void as expected
    return;
  } catch (error) {
    console.error('Error deleting plot:', error);
    throw error;
  }
};

/**
 * Generate mock plot data for development
 */
const generateMockPlots = (): PlotDto[] => {
  const generatedPlots: PlotDto[] = [];
  
  // London area
  const centerLat = 51.505;
  const centerLng = -0.09;
  
  // Generate 20 random plots around London
  for (let i = 0; i < 30; i++) {
    const id = i + 1;
    const price = Math.floor(Math.random() * 1000000) + 100000;
    const isForSale = Math.random() > 0.3;
    
    // Random offset from center (within ~2km)
    const latOffset = (Math.random() - 0.5) * 0.04;
    const lngOffset = (Math.random() - 0.5) * 0.06;
    
    generatedPlots.push({
      id,
      price,
      isForSale,
      description: `Mock plot #${id} in London area${isForSale ? ' (For Sale)' : ''}`,
      latitude: centerLat + latOffset,
      longitude: centerLng + lngOffset,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }
  
  console.log('%c[MOCK API] Generated initial mock plots', 'color: blue; font-weight: bold');
  console.log(`Total plots: ${generatedPlots.length}`);
  
  return generatedPlots;
};

// Avoid re-exporting the actual mock plots generator
const getMockPlots = (): PlotDto[] => {
  if (mockPlots.length === 0) {
    mockPlots = generateMockPlots();
  }
  return [...mockPlots]; // Return a copy
}; 