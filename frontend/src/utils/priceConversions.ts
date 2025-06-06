/**
 * Price conversion utilities for different area units
 */
import type { AreaUnit } from '../contexts/SettingsContext';

// Conversion factors to square feet (base unit)
const CONVERSION_TO_SQFT = {
  per_sqft: 1,
  per_sqm: 10.764, // 1 sqm = 10.764 sqft
  per_cent: 435.6, // 1 cent = 435.6 sqft
  per_acre: 43560, // 1 acre = 43,560 sqft
  per_hectare: 107639, // 1 hectare = 107,639 sqft
};

// Mapping from AreaUnit to price unit string
const AREA_UNIT_TO_PRICE_UNIT: Record<AreaUnit, string> = {
  sqft: 'per_sqft',
  sqm: 'per_sqm',
  cent: 'per_cent',
  acre: 'per_acre',
};

// Mapping from AreaUnit to display label
const AREA_UNIT_LABELS: Record<AreaUnit, string> = {
  sqft: '/sqft',
  sqm: '/sqm',
  cent: '/cent',
  acre: '/acre',
};

export interface ConvertedPrice {
  unit: string;
  label: string;
  shortLabel: string;
  price: number;
  formattedPrice: string;
}

/**
 * Convert a price from one unit to all other units
 */
export const convertPriceToAllUnits = (
  originalPrice: number,
  originalUnit: string
): ConvertedPrice[] => {
  // First convert to price per square foot (base unit)
  const pricePerSqft = originalPrice / (CONVERSION_TO_SQFT[originalUnit as keyof typeof CONVERSION_TO_SQFT] || 1);
  
  // Then convert to all units
  const conversions: ConvertedPrice[] = [
    {
      unit: 'per_sqft',
      label: 'Per Square Foot',
      shortLabel: '/sqft',
      price: pricePerSqft,
      formattedPrice: formatPrice(pricePerSqft)
    },
    {
      unit: 'per_sqm',
      label: 'Per Square Meter',
      shortLabel: '/sqm',
      price: pricePerSqft * CONVERSION_TO_SQFT.per_sqm,
      formattedPrice: formatPrice(pricePerSqft * CONVERSION_TO_SQFT.per_sqm)
    },
    {
      unit: 'per_cent',
      label: 'Per Cent',
      shortLabel: '/cent',
      price: pricePerSqft * CONVERSION_TO_SQFT.per_cent,
      formattedPrice: formatPrice(pricePerSqft * CONVERSION_TO_SQFT.per_cent)
    },
    {
      unit: 'per_acre',
      label: 'Per Acre',
      shortLabel: '/acre',
      price: pricePerSqft * CONVERSION_TO_SQFT.per_acre,
      formattedPrice: formatPrice(pricePerSqft * CONVERSION_TO_SQFT.per_acre)
    },
    {
      unit: 'per_hectare',
      label: 'Per Hectare',
      shortLabel: '/hectare',
      price: pricePerSqft * CONVERSION_TO_SQFT.per_hectare,
      formattedPrice: formatPrice(pricePerSqft * CONVERSION_TO_SQFT.per_hectare)
    }
  ];
  
  return conversions;
};

/**
 * Convert a price to per square foot for display consistency
 */
export const convertToPricePerSqft = (
  originalPrice: number,
  originalUnit: string
): number => {
  const conversionFactor = CONVERSION_TO_SQFT[originalUnit as keyof typeof CONVERSION_TO_SQFT] || 1;
  return originalPrice / conversionFactor;
};

/**
 * Convert a price to the user's preferred area unit
 */
export const convertToPreferredAreaUnit = (
  originalPrice: number,
  originalUnit: string,
  preferredAreaUnit: AreaUnit
): { price: number; label: string } => {
  // First convert to price per square foot (base unit)
  const pricePerSqft = convertToPricePerSqft(originalPrice, originalUnit);
  
  // Get the target unit string
  const targetUnit = AREA_UNIT_TO_PRICE_UNIT[preferredAreaUnit];
  
  // Convert to the preferred unit
  const conversionFactor = CONVERSION_TO_SQFT[targetUnit as keyof typeof CONVERSION_TO_SQFT] || 1;
  const convertedPrice = pricePerSqft * conversionFactor;
  
  return {
    price: convertedPrice,
    label: AREA_UNIT_LABELS[preferredAreaUnit]
  };
};

/**
 * Format price with proper decimal places (max 2, none if not needed)
 */
export const formatPrice = (price: number): string => {
  // Round to 2 decimal places
  const rounded = Math.round(price * 100) / 100;
  
  // If it's a whole number, don't show decimals
  if (rounded === Math.floor(rounded)) {
    return rounded.toLocaleString();
  }
  
  // Show up to 2 decimal places, removing trailing zeros
  return rounded.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });
}; 