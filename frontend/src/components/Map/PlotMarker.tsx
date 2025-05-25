import React, { useState, useRef } from 'react';
import { Marker, Popup } from 'react-leaflet';
import type { PlotDto, MapPosition } from '../../types/plot.types';
import { PlotEditForm } from '../Forms/PlotEditForm';
import { ConfirmationDialog } from '../Common/ConfirmationDialog';
import { deletePlot } from '../../services/plotService';

interface PlotMarkerProps {
  plot: PlotDto;
  onPlotUpdated?: () => void;
  onPlotDeleted?: () => void;
  onModalStateChange?: (isOpen: boolean) => void;
}

const PlotMarker = ({ plot, onPlotUpdated, onPlotDeleted, onModalStateChange }: PlotMarkerProps) => {
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const popupRef = useRef<any>(null);

  const position: MapPosition = {
    lat: plot.latitude,
    lng: plot.longitude,
  };

  const handleEdit = () => {
    // Close the popup immediately when edit modal opens
    if (popupRef.current) {
      popupRef.current.close();
    }
    setShowEditForm(true);
    if (onModalStateChange) onModalStateChange(true);
  };

  const handleDelete = () => {
    // Close the popup immediately when delete confirmation opens
    if (popupRef.current) {
      popupRef.current.close();
    }
    setShowDeleteConfirm(true);
    if (onModalStateChange) onModalStateChange(true);
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await deletePlot(plot.id!);
      console.log('Plot deleted successfully:', plot.id);
      setShowDeleteConfirm(false);
      if (onModalStateChange) onModalStateChange(false);
      if (onPlotDeleted) {
        onPlotDeleted();
      }
    } catch (error) {
      console.error('Error deleting plot:', error);
      alert('Failed to delete plot. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const handlePlotUpdated = () => {
    setShowEditForm(false);
    if (onModalStateChange) onModalStateChange(false);
    if (onPlotUpdated) {
      onPlotUpdated();
    }
  };

  return (
    <>
      <Marker position={position}>
        <Popup ref={popupRef}>
          <div className="plot-popup">
            <h3>Plot {plot.id}</h3>
            <p><strong>Price:</strong> ${plot.price.toLocaleString()}</p>
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

      {/* Edit Form Modal */}
      <PlotEditForm
        isOpen={showEditForm}
        plot={plot}
        onClose={() => {
          setShowEditForm(false);
          if (onModalStateChange) onModalStateChange(false);
        }}
        onPlotUpdated={handlePlotUpdated}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showDeleteConfirm}
        title="Delete Plot"
        message={`Are you sure you want to delete Plot ${plot.id}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        isDestructive={true}
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => {
          setShowDeleteConfirm(false);
          if (onModalStateChange) onModalStateChange(false);
        }}
      />
    </>
  );
};

export default PlotMarker; 