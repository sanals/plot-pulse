import { useState, useRef, useCallback, useEffect } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import type { PlotDto, MapPosition } from '../../types/plot.types';
import { deletePlot } from '../../services/plotService';
import { useModalContext } from './OptimizedMapComponent';

export type MarkerDisplayMode = 'none' | 'icon' | 'text';

interface PlotMarkerProps {
  plot: PlotDto;
  mode: MarkerDisplayMode;
  onPlotUpdated?: () => void;
  onPlotDeleted?: () => void;
}

// Price thresholds for color coding
const PRICE_THRESHOLDS = {
  HIGH: 5000000, // 50 lakh and above
  MEDIUM: 2000000, // 20 lakh to 50 lakh
} as const;

const PlotMarker = ({ plot, mode, onPlotUpdated, onPlotDeleted }: PlotMarkerProps) => {
  const [deleting, setDeleting] = useState(false);
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

  // Get price category for color coding
  const getPriceCategory = useCallback((price: number): string => {
    if (price >= PRICE_THRESHOLDS.HIGH) return 'price-high';
    if (price >= PRICE_THRESHOLDS.MEDIUM) return 'price-medium';
    return 'price-low';
  }, []);

  // Create custom icon for text mode
  const getMarkerIcon = useCallback(() => {
    if (mode === 'text') {
      const price = plot.price ? `₹${plot.price.toLocaleString()}` : 'N/A';
      const priceClass = plot.price ? getPriceCategory(plot.price) : '';
      
      // Calculate dynamic width based on text length
      // Approximate 8px per character + padding
      const textWidth = price.length * 8 + 24; // 24px for padding (12px each side)
      const minWidth = 60; // Minimum width
      const maxWidth = 200; // Maximum width to prevent extremely long boxes
      const dynamicWidth = Math.max(minWidth, Math.min(maxWidth, textWidth));
      
      return L.divIcon({
        className: `plot-price-marker ${priceClass}`,
        html: `<span class="price-label">${price}</span>`,
        iconSize: [dynamicWidth, 28],
        iconAnchor: [dynamicWidth / 2, 14], // Center the anchor point
      });
    }
    return new L.Icon.Default();
  }, [mode, plot.price, getPriceCategory]);

  const handleEdit = useCallback(() => {
    popupRef.current?.close();
    modalContext.showEditForm(plot);
  }, [modalContext, plot]);

  const handleDelete = useCallback(() => {
    popupRef.current?.close();
    
    const confirmDelete = async () => {
      setDeleting(true);
      try {
        await deletePlot(plot.id!);
        onPlotDeleted?.();
      } catch (error) {
        console.error('Error deleting plot:', error);
        alert('Failed to delete plot. Please try again.');
      } finally {
        setDeleting(false);
      }
    };
    
    modalContext.showDeleteConfirm(plot, confirmDelete);
  }, [modalContext, plot, onPlotDeleted]);

  return (
    <Marker 
      position={position} 
      icon={getMarkerIcon()}
      ref={markerRef}
    >
      <Popup ref={popupRef}>
        <div className="plot-popup">
          <h3>Plot {plot.id}</h3>
          <p><strong>Price:</strong> ₹{plot.price.toLocaleString()}</p>
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