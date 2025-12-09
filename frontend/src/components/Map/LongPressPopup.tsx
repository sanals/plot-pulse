import React from 'react';
import { Popup } from 'react-leaflet';
import type { LatLng } from 'leaflet';

interface LongPressPopupProps {
  position: LatLng | null;
  onClose: () => void;
  onAddPlot: (lat: number, lng: number) => void;
}

/**
 * Popup component that appears when user long-presses on the map
 * Shows coordinates and provides option to add a new plot
 */
export const LongPressPopup: React.FC<LongPressPopupProps> = ({
  position,
  onClose,
  onAddPlot
}) => {
  if (!position) return null;

  const handleAddPlot = () => {
    onAddPlot(position.lat, position.lng);
    onClose();
  };

  return (
    <Popup
      position={position}
      closeButton={true}
      autoClose={false}
      closeOnClick={false}
      className="long-press-popup"
      eventHandlers={{
        remove: onClose
      }}
    >
      <div className="long-press-popup-content">
        <h3>Add New Plot</h3>
        <div className="coordinates">
          <p><strong>Latitude:</strong> {position.lat.toFixed(6)}</p>
          <p><strong>Longitude:</strong> {position.lng.toFixed(6)}</p>
        </div>
        <div className="popup-actions">
          <button 
            className="btn btn-primary"
            onClick={handleAddPlot}
            style={{ width: "120px" }}
          >
            Add Plot Here
          </button>
          <button 
            className="btn btn-secondary"
            onClick={onClose}
            style={{ width: "120px" }}
          >
            Cancel
          </button>
        </div>
      </div>
    </Popup>
  );
};

/**
 * Alternative modal-style popup for better mobile experience
 */
interface LongPressModalProps {
  isOpen: boolean;
  position: { lat: number; lng: number } | null;
  onClose: () => void;
  onAddPlot: (lat: number, lng: number) => void;
  isAuthenticated: boolean;
  onRequireLogin: () => void;
}

export const LongPressModal: React.FC<LongPressModalProps> = ({
  isOpen,
  position,
  onClose,
  onAddPlot,
  isAuthenticated,
  onRequireLogin
}) => {
  if (!isOpen || !position) return null;

  const handleAddPlot = () => {
    if (isAuthenticated) {
      onAddPlot(position.lat, position.lng);
      onClose();
    } else {
      onRequireLogin();
      onClose();
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
          <h3>Add New Plot</h3>
          <button className="plot-modal-close-button" onClick={onClose}>
            ×
          </button>
        </div>
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
          <p className="help-text" style={{ textAlign: 'center' }}>
            {isAuthenticated
              ? 'Would you like to add a new plot at this location?'
              : 'Please log in to add a new plot at this location.'}
          </p>
        </div>
        <div className="modal-footer">
          <button 
            className="btn btn-primary"
            onClick={handleAddPlot}
          >
            {isAuthenticated ? 'Add Plot Here' : 'Login to Add Plot'}
          </button>
          <button 
            className="btn btn-secondary"
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}; 