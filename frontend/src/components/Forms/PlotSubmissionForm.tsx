/* @refresh reset */
import React, { useState, useEffect, memo } from 'react';
import { createPlot } from '../../services/plotService';
import type { PlotDto } from '../../types/plot.types';

interface PlotSubmissionFormProps {
  isOpen: boolean;
  position: { lat: number; lng: number } | null;
  onClose: () => void;
  onPlotAdded?: () => void;
}

// Use memo to make the component more stable with React refresh
const PlotSubmissionForm = memo(function PlotSubmissionForm({
  isOpen,
  position,
  onClose,
  onPlotAdded
}: PlotSubmissionFormProps) {
  // Initialize state only when component mounts
  const [formState, setFormState] = useState({
    price: '',
    isForSale: true,
    description: '',
    submitting: false,
    error: null as string | null
  });

  // Reset form when modal opens or closes
  useEffect(() => {
    if (!isOpen) {
      setFormState({
        price: '',
        isForSale: true,
        description: '',
        submitting: false,
        error: null
      });
    }
  }, [isOpen]);

  if (!isOpen || !position) return null;

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
      const plotData: PlotDto = {
        price: Number(formState.price),
        isForSale: formState.isForSale,
        description: formState.description || undefined,
        latitude: position.lat,
        longitude: position.lng,
      };
      
      console.log('Creating plot:', plotData);
      const newPlot = await createPlot(plotData);
      console.log('Plot created successfully:', newPlot);
      
      // Reset form and notify parent
      setFormState({
        price: '',
        isForSale: true,
        description: '',
        submitting: false,
        error: null
      });
      
      if (onPlotAdded) {
        onPlotAdded();
      }
      onClose();
    } catch (err: any) {
      console.error('Error creating plot:', err);
      let errorMessage = 'Failed to create plot. Please try again.';
      
      // Check if it's an HTTP error and has a response
      if (err.response && err.response.data) {
        // Check for 409 Conflict and extract specific message
        if (err.response.status === 409 && err.response.data.message) {
          errorMessage = err.response.data.message;
        } else if (err.response.data.message) {
            // For other backend errors with a message
            errorMessage = err.response.data.message;
        }
      }
      
      setFormState(prev => ({ ...prev, error: errorMessage, submitting: false }));
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
                onChange={handlePriceChange}
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
                onChange={handleIsForSaleChange}
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
                onChange={handleDescriptionChange}
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
});

export { PlotSubmissionForm }; 