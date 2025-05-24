import type { MapPosition, MapBounds, GeolocationPosition } from '../types/plot.types';

/**
 * Convert a GeolocationPosition to MapPosition (Leaflet format)
 */
export const geoToMapPosition = (position: GeolocationPosition): MapPosition => {
  return {
    lat: position.latitude,
    lng: position.longitude
  };
};

/**
 * Calculate the distance between two points in kilometers
 * Using the Haversine formula
 */
export const calculateDistance = (position1: MapPosition, position2: MapPosition): number => {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(position2.lat - position1.lat);
  const dLng = toRad(position2.lng - position1.lng);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(position1.lat)) * Math.cos(toRad(position2.lat)) * 
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
};

/**
 * Convert degrees to radians
 */
const toRad = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};

/**
 * Get the bounds of the current map view
 */
export const getBoundsFromMap = (map: L.Map): MapBounds => {
  const bounds = map.getBounds();
  const northEast = bounds.getNorthEast();
  const southWest = bounds.getSouthWest();
  
  return {
    north: northEast.lat,
    east: northEast.lng,
    south: southWest.lat,
    west: southWest.lng
  };
};

/**
 * Check if a position is within the given bounds
 */
export const isPositionInBounds = (position: MapPosition, bounds: MapBounds): boolean => {
  return (
    position.lat <= bounds.north &&
    position.lat >= bounds.south &&
    position.lng <= bounds.east &&
    position.lng >= bounds.west
  );
};

/**
 * Format coordinates for display
 */
export const formatCoordinates = (position: MapPosition): string => {
  return `${position.lat.toFixed(6)}, ${position.lng.toFixed(6)}`;
}; 