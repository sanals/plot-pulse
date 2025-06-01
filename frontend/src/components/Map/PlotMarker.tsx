import { useRef, useCallback, useEffect } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import type { PlotDto, MapPosition } from '../../types/plot.types';
import { deletePlot } from '../../services/plotService';
import { useModalContext } from './OptimizedMapComponent';
import { convertToPricePerSqft, convertPriceToAllUnits, formatPrice } from '../../utils/priceConversions';

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
      const displayPrice = `₹${formatPrice(pricePerSqft)}/sqft`;
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
  }, [mode, plot.price, plot.priceUnit, getPriceCategory]);

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
      <Popup ref={popupRef}>
        <div className="plot-popup">
          <h3>Plot {plot.id}</h3>
          
          <div className="price-conversions">
            <h4>Price in All Units:</h4>
            {getAllPriceConversions().map((conversion) => (
              <div key={conversion.unit} className="price-conversion-item">
                <strong>₹{conversion.formattedPrice}</strong> {conversion.label}
              </div>
            ))}
          </div>
          
          <p><strong>Status:</strong> {plot.isForSale ? 'For Sale' : 'Not For Sale'}</p>
          {plot.description && <p><strong>Description:</strong> {plot.description}</p>}
          
          <div className="plot-actions">
            <button 
              className="btn btn-primary btn-small"
              onClick={handleEdit}
              title="Edit this plot"
            >
              ✏️ Edit
            </button>
            <button 
              className="btn btn-danger btn-small"
              onClick={handleDelete}
              title="Delete this plot"
            >
              🗑️ Delete
            </button>
          </div>
        </div>
      </Popup>
    </Marker>
  );
};

export default PlotMarker; 