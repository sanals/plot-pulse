import { useState } from 'react';
import { Popup, Marker, useMapEvents } from 'react-leaflet';
import type { MapPosition, PlotDto } from '../../types/plot.types';
import { createPlot } from '../../services/plotService';

interface LongPressPopupProps {
  position: MapPosition;
  onClose: () => void;
  onPlotAdded?: () => void;
}

const LongPressPopup = ({ position, onClose, onPlotAdded }: LongPressPopupProps) => {
  const [price, setPrice] = useState<string>('');
  const [isForSale, setIsForSale] = useState<boolean>(true);
  const [description, setDescription] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Register map event to close popup when clicking elsewhere
  useMapEvents({
    popupclose: () => {
      onClose();
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!price || isNaN(Number(price)) || Number(price) <= 0) {
      setError('Please enter a valid price');
      return;
    }
    
    setError(null);
    setSubmitting(true);
    
    try {
      const plotData: PlotDto = {
        price: Number(price),
        isForSale,
        description: description || undefined,
        latitude: position.lat,
        longitude: position.lng,
      };
      
      await createPlot(plotData);
      
      // Notify parent component that a plot was added
      if (onPlotAdded) {
        onPlotAdded();
      }
      
      onClose();
    } catch (err) {
      setError('Failed to create plot. Please try again.');
      console.error('Error creating plot:', err);
    } finally {
      setSubmitting(false);
    }
  };
  
  return (
    <Marker position={position}>
      <Popup autoClose={false}>
        <div className="add-plot-form">
          <h3>Add New Plot</h3>
          <p>
            Location: {position.lat.toFixed(6)}, {position.lng.toFixed(6)}
          </p>
          
          {error && <div className="error-message">{error}</div>}
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="price">Price ($)</label>
              <input
                type="number"
                id="price"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
                min="1"
                step="any"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="isForSale">Status</label>
              <select
                id="isForSale"
                value={isForSale ? 'true' : 'false'}
                onChange={(e) => setIsForSale(e.target.value === 'true')}
              >
                <option value="true">For Sale</option>
                <option value="false">Not For Sale</option>
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="description">Description (optional)</label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={500}
                rows={3}
              />
            </div>
            
            <div className="form-actions">
              <button type="button" onClick={onClose} disabled={submitting}>
                Cancel
              </button>
              <button type="submit" disabled={submitting}>
                {submitting ? 'Submitting...' : 'Add Plot'}
              </button>
            </div>
          </form>
        </div>
      </Popup>
    </Marker>
  );
};

export default LongPressPopup; 