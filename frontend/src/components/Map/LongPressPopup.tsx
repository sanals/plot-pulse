import { useState, useEffect } from 'react';
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
  const [success, setSuccess] = useState<boolean>(false);
  const [createdPlot, setCreatedPlot] = useState<PlotDto | null>(null);

  // Register map event to close popup when clicking elsewhere
  useMapEvents({
    popupclose: () => {
      if (!submitting) {
        onClose();
      }
    },
  });

  // When successful, notify parent and close after delay
  useEffect(() => {
    if (success && createdPlot && !submitting) {
      const timer = setTimeout(() => {
        if (onPlotAdded) {
          onPlotAdded();
        }
        onClose();
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [success, createdPlot, submitting, onPlotAdded, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('%c[Form] Submitting plot form...', 'color: #2196F3');
    
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
      
      console.log('[Form] Sending plot data:', plotData);
      const newPlot = await createPlot(plotData);
      console.log('%c[Form] Plot created successfully!', 'color: green; font-weight: bold');
      console.log(newPlot);
      
      setCreatedPlot(newPlot);
      setSuccess(true);
    } catch (err) {
      console.error('[Form] Error creating plot:', err);
      setError('Failed to create plot. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };
  
  return (
    <Marker position={position}>
      <Popup autoClose={false}>
        <div style={{ minWidth: '250px', padding: '10px' }}>
          <h3 style={{ marginBottom: '8px', color: '#2196F3' }}>Add New Plot</h3>
          
          {!success && (
            <p style={{ marginBottom: '15px' }}>
              Location: {position.lat.toFixed(6)}, {position.lng.toFixed(6)}
            </p>
          )}
          
          {error && (
            <div style={{ 
              padding: '8px', 
              backgroundColor: '#f44336', 
              color: 'white', 
              borderRadius: '4px', 
              marginBottom: '15px' 
            }}>
              {error}
            </div>
          )}
          
          {success && createdPlot && (
            <div style={{ 
              padding: '15px', 
              backgroundColor: '#4CAF50', 
              color: 'white', 
              borderRadius: '4px', 
              marginBottom: '15px',
              textAlign: 'center'
            }}>
              <h3 style={{ marginBottom: '10px' }}>Plot Added Successfully!</h3>
              <p>ID: #{createdPlot.id}</p>
              <p>Price: ${createdPlot.price.toLocaleString()}</p>
              <p>Status: {createdPlot.isForSale ? 'For Sale' : 'Not For Sale'}</p>
            </div>
          )}
          
          {!success && (
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '15px' }}>
                <label 
                  htmlFor="price" 
                  style={{ 
                    display: 'block', 
                    marginBottom: '5px', 
                    fontWeight: '600' 
                  }}
                >
                  Price ($)
                </label>
                <input
                  type="number"
                  id="price"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                  min="1"
                  step="any"
                  style={{ 
                    width: '100%', 
                    padding: '8px 12px', 
                    border: '1px solid #BDBDBD', 
                    borderRadius: '4px', 
                    fontSize: '16px' 
                  }}
                />
              </div>
              
              <div style={{ marginBottom: '15px' }}>
                <label 
                  htmlFor="isForSale"
                  style={{ 
                    display: 'block', 
                    marginBottom: '5px', 
                    fontWeight: '600' 
                  }}
                >
                  Status
                </label>
                <select
                  id="isForSale"
                  value={isForSale ? 'true' : 'false'}
                  onChange={(e) => setIsForSale(e.target.value === 'true')}
                  style={{ 
                    width: '100%', 
                    padding: '8px 12px', 
                    border: '1px solid #BDBDBD', 
                    borderRadius: '4px', 
                    fontSize: '16px' 
                  }}
                >
                  <option value="true">For Sale</option>
                  <option value="false">Not For Sale</option>
                </select>
              </div>
              
              <div style={{ marginBottom: '15px' }}>
                <label 
                  htmlFor="description"
                  style={{ 
                    display: 'block', 
                    marginBottom: '5px', 
                    fontWeight: '600' 
                  }}
                >
                  Description (optional)
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={500}
                  rows={3}
                  style={{ 
                    width: '100%', 
                    padding: '8px 12px', 
                    border: '1px solid #BDBDBD', 
                    borderRadius: '4px', 
                    fontSize: '16px',
                    resize: 'vertical'
                  }}
                />
              </div>
              
              <div style={{ 
                display: 'flex', 
                justifyContent: 'flex-end', 
                gap: '10px', 
                marginTop: '20px' 
              }}>
                <button 
                  type="button" 
                  onClick={onClose} 
                  disabled={submitting}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '4px',
                    backgroundColor: 'transparent',
                    color: '#2196F3',
                    border: '1px solid #2196F3',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    opacity: submitting ? 0.6 : 1
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={submitting}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '4px',
                    backgroundColor: '#2196F3',
                    color: 'white',
                    border: 'none',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    opacity: submitting ? 0.6 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {submitting ? (
                    <>
                      <div 
                        style={{
                          width: '16px',
                          height: '16px',
                          borderRadius: '50%',
                          border: '2px solid white',
                          borderTopColor: 'transparent',
                          animation: 'spin 1s linear infinite',
                          marginRight: '8px'
                        }}
                      />
                      Submitting...
                    </>
                  ) : 'Add Plot'}
                </button>
              </div>
            </form>
          )}
        </div>
      </Popup>
    </Marker>
  );
};

export default LongPressPopup; 