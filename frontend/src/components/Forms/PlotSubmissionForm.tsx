import { useState } from 'react';
import type { PlotDto } from '../../types/plot.types';
import { createPlot } from '../../services/plotService';
import LoadingSpinner from '../Common/LoadingSpinner';

interface PlotSubmissionFormProps {
  latitude: number;
  longitude: number;
  onSubmitSuccess?: () => void;
  onCancel?: () => void;
}

const PlotSubmissionForm = ({
  latitude,
  longitude,
  onSubmitSuccess,
  onCancel
}: PlotSubmissionFormProps) => {
  const [price, setPrice] = useState<string>('');
  const [isForSale, setIsForSale] = useState<boolean>(true);
  const [description, setDescription] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate input
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
        description: description.trim() || undefined,
        latitude,
        longitude,
      };
      
      await createPlot(plotData);
      setSuccess(true);
      setPrice('');
      setDescription('');
      setIsForSale(true);
      
      if (onSubmitSuccess) {
        onSubmitSuccess();
      }
    } catch (err) {
      setError('Failed to submit plot information. Please try again.');
      console.error('Error submitting plot:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitting) {
    return <LoadingSpinner message="Submitting plot data..." />;
  }

  if (success) {
    return (
      <div className="success-message">
        <h3>Plot Added Successfully!</h3>
        <p>Your plot information has been saved.</p>
        <button 
          type="button" 
          onClick={() => {
            setSuccess(false);
            if (onSubmitSuccess) onSubmitSuccess();
          }}
          className="primary-button"
        >
          Close
        </button>
      </div>
    );
  }

  return (
    <div className="plot-submission-form">
      <h2>Add New Plot</h2>
      
      <div className="coordinates-display">
        <p>
          <strong>Location:</strong> {latitude.toFixed(6)}, {longitude.toFixed(6)}
        </p>
      </div>
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      
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
            placeholder="Enter price"
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
            rows={4}
            placeholder="Enter additional details about this plot..."
          />
          <small>{description.length}/500 characters</small>
        </div>
        
        <div className="form-actions">
          {onCancel && (
            <button 
              type="button" 
              onClick={onCancel}
              className="secondary-button"
            >
              Cancel
            </button>
          )}
          <button 
            type="submit" 
            className="primary-button"
            disabled={submitting}
          >
            Submit Plot
          </button>
        </div>
      </form>
    </div>
  );
};

export default PlotSubmissionForm; 