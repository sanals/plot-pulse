import type { NearestPlotRequest, PlotDto, MapBounds } from '../types/plot.types';

// Disable mock data to use real backend API
const USE_MOCK_DATA = false;
const API_URL = 'http://localhost:8091/api/v1';

// Store mock plots in memory so we can add to them (only used as fallback)
let mockPlots: PlotDto[] = [];

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
    console.log(`Fetching plots from ${API_URL}/plots?page=${page}&size=${size}`);
    const response = await fetch(`${API_URL}/plots?page=${page}&size=${size}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch plots: ${response.status} ${response.statusText}`);
    }
    
    const plots = await response.json();
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
    const url = `${API_URL}/plots/bounds?minLat=${south}&maxLat=${north}&minLng=${west}&maxLng=${east}&page=${page}&size=${size}`;
    
    console.log(`Fetching plots in bounds from ${url}`);
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch plots in bounds: ${response.status} ${response.statusText}`);
    }
    
    const plots = await response.json();
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
    console.log(`Finding nearest plot from ${API_URL}/plots/nearest`);
    const response = await fetch(`${API_URL}/plots/nearest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        console.log('No nearest plot found within radius');
        return null;
      }
      throw new Error(`Failed to find nearest plot: ${response.status} ${response.statusText}`);
    }
    
    const nearestPlot = await response.json();
    console.log('Successfully found nearest plot from backend:', nearestPlot);
    return nearestPlot;
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
    console.log(`Creating new plot via ${API_URL}/plots`);
    console.log('Plot data:', plot);
    
    const response = await fetch(`${API_URL}/plots`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(plot),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Server error response:', errorText);
      throw new Error(`Failed to create plot: ${response.status} ${response.statusText}`);
    }
    
    const responseData = await response.json();
    console.log('Plot created successfully on backend:', responseData);
    return responseData;
  } catch (error) {
    console.error('Error creating plot on backend:', error);
    console.log('Falling back to mock data');
    
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
    const response = await fetch(`${API_URL}/plots/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(plot),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update plot: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
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
    const response = await fetch(`${API_URL}/plots/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error(`Failed to delete plot: ${response.status} ${response.statusText}`);
    }
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