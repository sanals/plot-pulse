/* @refresh reset */
import React, { useState, useEffect, memo } from 'react';
import { createPlot } from '../../services/plotService';
import type { PlotDto } from '../../types/plot.types';
import { PRICE_UNIT_OPTIONS } from '../../types/plot.types';
import { useSettings } from '../../contexts/SettingsContext';
import { getCurrencySymbol } from '../../utils/currencyUtils';

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
  const { currency } = useSettings();
  
  // Initialize state only when component mounts
  const [formState, setFormState] = useState({
    name: '',
    price: '',
    priceUnit: 'per_sqft', // Default to per square foot
    isForSale: true,
    description: '',
    submitting: false,
    error: null as string | null
  });

  // Reset form when modal opens or closes
  useEffect(() => {
    if (!isOpen) {
      setFormState({
        name: '',
        price: '',
        priceUnit: 'per_sqft',
        isForSale: true,
        description: '',
        submitting: false,
        error: null
      });
    }
  }, [isOpen]);

  if (!isOpen || !position) return null;

  // Handle input changes
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormState(prev => ({ ...prev, name: e.target.value }));
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormState(prev => ({ ...prev, price: e.target.value }));
  };

  const handlePriceUnitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormState(prev => ({ ...prev, priceUnit: e.target.value }));
  };

  const handleIsForSaleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormState(prev => ({ ...prev, isForSale: e.target.value === 'true' }));
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormState(prev => ({ ...prev, description: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formState.name.trim()) {
      setFormState(prev => ({ ...prev, error: 'Please enter a name for the plot' }));
      return;
    }
    if (!formState.price || isNaN(Number(formState.price)) || Number(formState.price) <= 0) {
      setFormState(prev => ({ ...prev, error: 'Please enter a valid price' }));
      return;
    }
    
    setFormState(prev => ({ ...prev, error: null, submitting: true }));
    
    try {
      const plotData: PlotDto = {
        name: formState.name.trim(),
        price: Number(formState.price),
        priceUnit: formState.priceUnit,
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
        name: '',
        price: '',
        priceUnit: 'per_sqft',
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
  const { name, price, priceUnit, isForSale, description, submitting, error } = formState;

  return (
    <div className="long-press-modal-overlay" onClick={handleBackdropClick}>
      <div className="long-press-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Add New Plot</h3>
          <button className="plot-modal-close-button" onClick={onClose}>
            ×
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="coordinates-display">
              <div className="coordinate-item">
                <label>Latitude:</label>
                <span style={{ color: '#374151', fontWeight: '500' }}>{position.lat.toFixed(6)}</span>
              </div>
              <div className="coordinate-item">
                <label>Longitude:</label>
                <span style={{ color: '#374151', fontWeight: '500' }}>{position.lng.toFixed(6)}</span>
              </div>
            </div>

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="name">Name</label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={handleNameChange}
                  required
                  maxLength={150}
                  disabled={submitting}
                  placeholder="Enter plot name"
                />
              </div>

              <div className="form-group">
                <label htmlFor="price">Price ({getCurrencySymbol(currency)})</label>
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
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="priceUnit">Price Unit</label>
                <select
                  id="priceUnit"
                  value={priceUnit}
                  onChange={handlePriceUnitChange}
                  disabled={submitting}
                >
                  {PRICE_UNIT_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
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
            </div>

            <div className="form-group textarea-group">
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
              <div
                className="char-count"
                style={{ color: '#6B7280', fontSize: '12px', marginTop: '4px', textAlign: 'right' }}
              >
                {description.length}/500 characters
              </div>
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