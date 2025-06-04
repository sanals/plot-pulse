import { useRef, useCallback, useEffect } from 'react';
import { Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { PlotDto, MapPosition } from '../../types/plot.types';
import { deletePlot } from '../../services/plotService';
import { useModalContext } from './OptimizedMapComponent';
import { useSettings } from '../../contexts/SettingsContext';
import { convertToPricePerSqft, convertPriceToAllUnits, formatPrice } from '../../utils/priceConversions';
import { formatCurrency, getCurrencySymbol, convertCurrency } from '../../utils/currencyUtils';

export type MarkerDisplayMode = 'none' | 'icon' | 'text';

interface PlotMarkerProps {
  plot: PlotDto;
  mode: MarkerDisplayMode;
  onPlotDeleted?: () => void;
}

// Price thresholds for color coding (based on per sqft prices)
const PRICE_THRESHOLDS = {
  HIGH: 5000, // ₹5000 per sqft and above
  MEDIUM: 2000, // ₹2000 to ₹5000 per sqft
} as const;

const PlotMarker = ({ plot, mode, onPlotDeleted }: PlotMarkerProps) => {
  const popupRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const modalContext = useModalContext();
  const map = useMap();
  const settings = useSettings();

  const position: MapPosition = {
    lat: plot.latitude,
    lng: plot.longitude,
  };

  // Don't render anything if mode is 'none'
  if (mode === 'none') {
    return null;
  }

  // Set plotId in marker options when marker ref is available
  useEffect(() => {
    if (markerRef.current?.options) {
      markerRef.current.options.plotId = plot.id;
    }
  }, [plot.id]);

  // Close popup when user interacts with the map
  useEffect(() => {
    if (!popupRef.current) return;

    const popup = popupRef.current;

    const handleMapInteraction = () => {
      if (popup.isOpen()) {
        popup.close();
      }
    };

    // Close popup on any map interaction
    map.on('movestart', handleMapInteraction);
    map.on('zoomstart', handleMapInteraction);
    map.on('dragstart', handleMapInteraction);
    map.on('click', handleMapInteraction);

    return () => {
      map.off('movestart', handleMapInteraction);
      map.off('zoomstart', handleMapInteraction);
      map.off('dragstart', handleMapInteraction);
      map.off('click', handleMapInteraction);
    };
  }, [map]);

  // Get price category for color coding (based on per sqft price)
  const getPriceCategory = useCallback((pricePerSqft: number): string => {
    if (pricePerSqft >= PRICE_THRESHOLDS.HIGH) return 'price-high';
    if (pricePerSqft >= PRICE_THRESHOLDS.MEDIUM) return 'price-medium';
    return 'price-low';
  }, []);

  // Create custom icon for text mode
  const getMarkerIcon = useCallback(() => {
    if (mode === 'text') {
      // Always display price per square foot in markers
      const pricePerSqft = convertToPricePerSqft(plot.price, plot.priceUnit || 'per_sqft');
      
      // Simple formatting for marker prices - no crore/lakh for per sqft
      const convertedPrice = convertCurrency(pricePerSqft, 'INR', settings.currency);
      const currencySymbol = getCurrencySymbol(settings.currency);
      
      let displayPrice: string;
      if (convertedPrice >= 1000000) {
        displayPrice = `${currencySymbol}${(convertedPrice / 1000000).toFixed(1)}M/sqft`;
      } else if (convertedPrice >= 1000) {
        displayPrice = `${currencySymbol}${(convertedPrice / 1000).toFixed(1)}K/sqft`;
      } else {
        displayPrice = `${currencySymbol}${Math.round(convertedPrice)}/sqft`;
      }
      
      const priceClass = getPriceCategory(pricePerSqft);
      
      // Calculate dynamic width based on text length
      // Approximate 8px per character + padding
      const textWidth = displayPrice.length * 8 + 24; // 24px for padding (12px each side)
      const minWidth = 60; // Minimum width
      const maxWidth = 200; // Maximum width to prevent extremely long boxes
      const dynamicWidth = Math.max(minWidth, Math.min(maxWidth, textWidth));
      
      return L.divIcon({
        className: `plot-price-marker ${priceClass}`,
        html: `<span class="price-label">${displayPrice}</span>`,
        iconSize: [dynamicWidth, 28],
        iconAnchor: [dynamicWidth / 2, 14], // Center the anchor point
      });
    }
    return new L.Icon.Default();
  }, [mode, plot.price, plot.priceUnit, getPriceCategory, settings.currency]);

  const handleEdit = useCallback(() => {
    popupRef.current?.close();
    modalContext.showEditForm(plot);
  }, [modalContext, plot]);

  const handleDelete = useCallback(() => {
    popupRef.current?.close();
    
    const confirmDelete = async () => {
      try {
        await deletePlot(plot.id!);
        onPlotDeleted?.();
      } catch (error) {
        console.error('Error deleting plot:', error);
        alert('Failed to delete plot. Please try again.');
      }
    };
    
    modalContext.showDeleteConfirm(plot, confirmDelete);
  }, [modalContext, plot, onPlotDeleted]);

  // Get all price conversions for popup display
  const getAllPriceConversions = useCallback(() => {
    return convertPriceToAllUnits(plot.price, plot.priceUnit || 'per_sqft');
  }, [plot.price, plot.priceUnit]);

  return (
    <Marker 
      position={position} 
      icon={getMarkerIcon()}
      ref={markerRef}
    >
      <Popup 
        ref={popupRef}
        autoPan={false}
        keepInView={false}
        closeOnEscapeKey={true}
        closeOnClick={false}
      >
        <div className="plot-popup">
          <h3>Plot {plot.id}</h3>
          
          <div className="price-conversions">
            <h4>Price in All Units:</h4>
            {getAllPriceConversions().map((conversion) => (
              <div key={conversion.unit} className="price-conversion-item">
                <strong>{getCurrencySymbol(settings.currency)} {conversion.formattedPrice}</strong> {conversion.label}
              </div>
            ))}
          </div>
          
          <p><strong>Status:</strong> {plot.isForSale ? 'For Sale' : 'Not For Sale'}</p>
          {plot.description && <p><strong>Description:</strong> {plot.description}</p>}
          
          {(plot.createdAt || plot.updatedAt) && (
            <div>
              {plot.createdAt && (
                <p><strong>Added on:</strong> {new Date(plot.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</p>
              )}
              {plot.updatedAt && plot.updatedAt !== plot.createdAt && (
                <p><strong>Last updated:</strong> {new Date(plot.updatedAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</p>
              )}
            </div>
          )}
          
          <div className="plot-actions">
            <button 
              className="btn btn-primary btn-small"
              style={{ 
                marginTop: 0, 
                transition: 'background-color 0.2s',
                transform: 'none'
              }}
              onClick={handleEdit}
              title="Edit this plot"
            >
              <span className="btn-icon">✏️</span>
              <span>Edit</span>
            </button>
            <button 
              className="btn btn-danger btn-small"
              style={{ 
                transition: 'background-color 0.2s',
                transform: 'none'
              }}
              onClick={handleDelete}
              title="Delete this plot"
            >
              <span className="btn-icon">🗑️</span>
              <span>Delete</span>
            </button>
          </div>
        </div>
      </Popup>
    </Marker>
  );
};

export default PlotMarker; 