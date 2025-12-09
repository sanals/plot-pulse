/**
 * Plot data type definitions
 */

export interface PlotDto {
  id?: number;
  name: string;
  price: number;
  priceUnit: string; // Unit for the price (e.g., 'per_sqm', 'per_cent', 'per_acre', 'per_hectare', 'total')
  isForSale: boolean;
  description?: string;
  latitude: number;
  longitude: number;
  createdAt?: string;
  updatedAt?: string;
  userId?: number; // ID of the user who created this plot
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

// Price unit options for the forms
export interface PriceUnitOption {
  value: string;
  label: string;
  shortLabel: string; // For display in markers
}

export const PRICE_UNIT_OPTIONS: PriceUnitOption[] = [
  { value: 'per_sqft', label: 'Per Square Foot', shortLabel: '/sqft' },
  { value: 'per_sqm', label: 'Per Square Meter', shortLabel: '/sqm' },
  { value: 'per_cent', label: 'Per Cent', shortLabel: '/cent' },
  { value: 'per_acre', label: 'Per Acre', shortLabel: '/acre' },
  { value: 'per_hectare', label: 'Per Hectare', shortLabel: '/hectare' },
];

export interface PlotFilters {
  priceRange: {
    min: number | null;
    max: number | null;
  };
  status: 'all' | 'for_sale' | 'not_for_sale';
  dateAdded: 'all' | 'today' | 'week' | 'month' | 'half_year' | 'year' | 'custom';
  customDateRange?: {
    from: string | null;
    to: string | null;
  };
  location: {
    enabled: boolean;
    radius: number; // in kilometers
    center: {
      lat: number;
      lng: number;
    } | null;
    address: string;
  };
  searchQuery: string;
}

export interface PlotFilterParams {
  minPrice?: number;
  maxPrice?: number;
  status?: 'for_sale' | 'not_for_sale';
  dateFrom?: string;
  dateTo?: string;
  centerLat?: number;
  centerLng?: number;
  radius?: number;
  search?: string;
} 