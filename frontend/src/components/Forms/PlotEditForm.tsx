/* @refresh reset */
import React, { useState, useEffect, memo } from 'react';
import { updatePlot } from '../../services/plotService';
import type { PlotDto } from '../../types/plot.types';

interface PlotEditFormProps {
  isOpen: boolean;
  plot: PlotDto | null;
  onClose: () => void;
  onPlotUpdated?: () => void;
}

// Use memo to make the component more stable with React refresh
const PlotEditForm = memo(function PlotEditForm({
  isOpen,
  plot,
  onClose,
  onPlotUpdated
}: PlotEditFormProps) {
  // Initialize state only when component mounts
  const [formState, setFormState] = useState({
    price: '',
    isForSale: true,
    description: '',
    submitting: false,
    error: null as string | null
  });

  // Reset form when plot changes or modal opens/closes
  useEffect(() => {
    if (plot && isOpen) {
      setFormState({
        price: plot.price?.toString() || '',
        isForSale: plot.isForSale || true,
        description: plot.description || '',
        submitting: false,
        error: null
      });
    }
  }, [plot, isOpen]);

  if (!isOpen || !plot) return null;

  // Handle input changes
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormState(prev => ({ ...prev, price: e.target.value }));
  };

  const handleIsForSaleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormState(prev => ({ ...prev, isForSale: e.target.value === 'true' }));
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormState(prev => ({ ...prev, description: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formState.price || isNaN(Number(formState.price)) || Number(formState.price) <= 0) {
      setFormState(prev => ({ ...prev, error: 'Please enter a valid price' }));
      return;
    }
    
    setFormState(prev => ({ ...prev, error: null, submitting: true }));
    
    try {
      const updatedPlotData: PlotDto = {
        ...plot,
        price: Number(formState.price),
        isForSale: formState.isForSale,
        description: formState.description || undefined,
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
      setFormState(prev => ({ 
        ...prev, 
        error: 'Failed to update plot. Please try again.',
        submitting: false
      }));
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Destructure for easier access in render
  const { price, isForSale, description, submitting, error } = formState;
  
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
                onChange={handlePriceChange}
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
                onChange={handleIsForSaleChange}
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
                onChange={handleDescriptionChange}
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
});

export { PlotEditForm }; 