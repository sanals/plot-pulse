import React, { useState } from 'react';
import { createPlot } from '../../services/plotService';
import type { PlotDto } from '../../types/plot.types';

interface PlotSubmissionFormProps {
  isOpen: boolean;
  position: { lat: number; lng: number } | null;
  onClose: () => void;
  onPlotAdded?: () => void;
}

export const PlotSubmissionForm: React.FC<PlotSubmissionFormProps> = ({
  isOpen,
  position,
  onClose,
  onPlotAdded
}) => {
  const [price, setPrice] = useState<string>('');
  const [isForSale, setIsForSale] = useState<boolean>(true);
  const [description, setDescription] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !position) return null;

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
      
      console.log('Creating plot:', plotData);
      const newPlot = await createPlot(plotData);
      console.log('Plot created successfully:', newPlot);
      
      // Reset form
      setPrice('');
      setDescription('');
      setIsForSale(true);
      
      // Notify parent and close
      if (onPlotAdded) {
        onPlotAdded();
      }
      onClose();
    } catch (err) {
      console.error('Error creating plot:', err);
      setError('Failed to create plot. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="long-press-modal-overlay" onClick={handleBackdropClick}>
      <div className="long-press-modal">
        <div className="modal-header">
          <h3>Add New Plot</h3>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="coordinates-display">
              <div className="coordinate-item">
                <label>Latitude:</label>
                <span>{position.lat.toFixed(6)}</span>
              </div>
              <div className="coordinate-item">
                <label>Longitude:</label>
                <span>{position.lng.toFixed(6)}</span>
              </div>
            </div>

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

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
                disabled={submitting}
                placeholder="Enter plot price"
              />
            </div>

            <div className="form-group">
              <label htmlFor="isForSale">Status</label>
              <select
                id="isForSale"
                value={isForSale ? 'true' : 'false'}
                onChange={(e) => setIsForSale(e.target.value === 'true')}
                disabled={submitting}
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
                disabled={submitting}
                placeholder="Enter plot description..."
              />
            </div>
          </div>

          <div className="modal-footer">
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Creating...' : 'Create Plot'}
            </button>
            <button 
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}; 