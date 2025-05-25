import React, { useState, useEffect } from 'react';
import { updatePlot } from '../../services/plotService';
import type { PlotDto } from '../../types/plot.types';

interface PlotEditFormProps {
  isOpen: boolean;
  plot: PlotDto | null;
  onClose: () => void;
  onPlotUpdated?: () => void;
}

export const PlotEditForm: React.FC<PlotEditFormProps> = ({
  isOpen,
  plot,
  onClose,
  onPlotUpdated
}) => {
  const [price, setPrice] = useState<string>(plot?.price?.toString() || '');
  const [isForSale, setIsForSale] = useState<boolean>(plot?.isForSale || true);
  const [description, setDescription] = useState<string>(plot?.description || '');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Update form when plot changes or modal opens/closes
  useEffect(() => {
    if (plot && isOpen) {
      // Reset form to original plot values when modal opens
      setPrice(plot.price?.toString() || '');
      setIsForSale(plot.isForSale || true);
      setDescription(plot.description || '');
      setError(null);
    }
  }, [plot, isOpen]);

  if (!isOpen || !plot) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!price || isNaN(Number(price)) || Number(price) <= 0) {
      setError('Please enter a valid price');
      return;
    }
    
    setError(null);
    setSubmitting(true);
    
    try {
      const updatedPlotData: PlotDto = {
        ...plot,
        price: Number(price),
        isForSale,
        description: description || undefined,
      };
      
      console.log('Updating plot:', updatedPlotData);
      const updatedPlot = await updatePlot(plot.id!, updatedPlotData);
      console.log('Plot updated successfully:', updatedPlot);
      
      // Notify parent and close
      if (onPlotUpdated) {
        onPlotUpdated();
      }
      onClose();
    } catch (err) {
      console.error('Error updating plot:', err);
      setError('Failed to update plot. Please try again.');
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
      <div className="long-press-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Edit Plot {plot.id}</h3>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="coordinates-display">
              <div className="coordinate-item">
                <label>Latitude:</label>
                <span>{plot.latitude.toFixed(6)}</span>
              </div>
              <div className="coordinate-item">
                <label>Longitude:</label>
                <span>{plot.longitude.toFixed(6)}</span>
              </div>
              <small>Location cannot be changed</small>
            </div>

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="edit-price">Price ($)</label>
              <input
                type="number"
                id="edit-price"
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
              <label htmlFor="edit-isForSale">Status</label>
              <select
                id="edit-isForSale"
                value={isForSale ? 'true' : 'false'}
                onChange={(e) => setIsForSale(e.target.value === 'true')}
                disabled={submitting}
              >
                <option value="true">For Sale</option>
                <option value="false">Not For Sale</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="edit-description">Description (optional)</label>
              <textarea
                id="edit-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={500}
                rows={3}
                disabled={submitting}
                placeholder="Enter plot description..."
              />
              <small>{description.length}/500 characters</small>
            </div>
          </div>

          <div className="modal-footer">
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Updating...' : 'Update Plot'}
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