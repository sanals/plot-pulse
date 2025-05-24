/**
 * Plot data type definitions
 */

export interface PlotDto {
  id?: number;
  price: number;
  isForSale: boolean;
  description?: string;
  latitude: number;
  longitude: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface NearestPlotRequest {
  latitude: number;
  longitude: number;
  radius: number;
}

export interface GeolocationPosition {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export interface MapPosition {
  lat: number;
  lng: number;
}

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
} 