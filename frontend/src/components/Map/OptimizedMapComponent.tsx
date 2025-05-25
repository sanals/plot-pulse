import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import { useGeolocation } from '../../hooks/useGeolocation';
import { useOptimizedPlotData } from '../../hooks/useOptimizedPlotData';
import PlotMarkerCluster from './PlotMarkerCluster';
import { LongPressModal } from './LongPressPopup';
import { PlotSubmissionForm } from '../Forms/PlotSubmissionForm';
import MapLayerControl from './MapLayerControl';
import LocationButton from './LocationButton';
import UserLocationMarker from './UserLocationMarker';
import PlotVisibilityControl from './PlotVisibilityControl';
import MapLongPressHandler from './MapLongPressHandler';
import MapRecenterComponent from './MapRecenterComponent';
import MapBoundsTracker from './MapBoundsTracker';
import CustomZoomControl from './CustomZoomControl';
import GeolocationPermission from './GeolocationPermission';
import LoadingSpinner from '../Common/LoadingSpinner';
import 'leaflet/dist/leaflet.css';
import type { MapPosition, MapBounds } from '../../types/plot.types';

// Default center for the map (London)
const DEFAULT_CENTER: MapPosition = { lat: 51.505, lng: -0.09 };
const DEFAULT_ZOOM = 13;

// Memoized error display component
const ErrorDisplay = React.memo<{ error: string }>(({ error }) => (
  <div style={{
    position: 'absolute',
    top: '16px',
    left: 0,
    right: 0,
    margin: '0 auto',
    width: 'max-content',
    maxWidth: '28rem',
    zIndex: 50
  }}>
    <div style={{
      padding: '8px 16px',
      borderRadius: '6px',
      backgroundColor: '#f44336',
      color: 'white',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
    }}>
      {error}
    </div>
  </div>
));

ErrorDisplay.displayName = 'ErrorDisplay';

// Memoized loading overlay component
const LoadingOverlay = React.memo<{ message: string }>(({ message }) => (
  <div style={{
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    zIndex: 50
  }}>
    <LoadingSpinner message={message} />
  </div>
));

LoadingOverlay.displayName = 'LoadingOverlay';

/**
 * Optimized MapComponent with performance enhancements
 * 
 * Features:
 * - React.memo for expensive components
 * - useMemo for expensive calculations
 * - useCallback for stable function references
 * - Marker clustering for better performance
 * - Viewport-based plot loading
 * - Debounced API calls
 */
const OptimizedMapComponent: React.FC = React.memo(() => {
  const { position, loading: geoLoading, error: geoError, refreshLocation } = useGeolocation();
  
  // Use optimized plot data hook
  const {
    plots,
    loading: plotsLoading,
    error: plotsError,
    plotStats,
    loadPlotsInViewport,
    refreshPlots
  } = useOptimizedPlotData({
    enableViewportLoading: true,
    debounceDelay: 500, // Balanced between responsiveness and performance
    cacheTimeout: 30 * 60 * 1000, // 30 minutes
    maxCacheSize: 100 // Increased from 50 to cache more regions
  });

  const [longPressPosition, setLongPressPosition] = useState<MapPosition | null>(null);
  const [showPopup, setShowPopup] = useState<boolean>(false);
  const [showPlotForm, setShowPlotForm] = useState<boolean>(false);
  const [plotsVisible, setPlotsVisible] = useState<boolean>(true);
  const [showUserLocation, setShowUserLocation] = useState<boolean>(true);
  // const [anyPlotModalOpen, setAnyPlotModalOpen] = useState<boolean>(false);
  const [debugMarker, setDebugMarker] = useState<MapPosition | null>(null);
  const [hasInitiallyRecentered, setHasInitiallyRecentered] = useState<boolean>(false);
  const [isMapInteracting, setIsMapInteracting] = useState<boolean>(false);

  // Memoized center position calculation
  const centerPosition = useMemo<MapPosition | null>(() => {
    return position 
      ? { lat: position.latitude, lng: position.longitude } 
      : null;
  }, [position]);

  // Memoized map center for initial render (only set once)
  const mapCenter = useMemo<MapPosition>(() => {
    return DEFAULT_CENTER; // Always start with default center, let MapRecenterComponent handle user location
  }, []);

  // Memoized loading state
  const isLoading = useMemo(() => {
    return geoLoading || plotsLoading;
  }, [geoLoading, plotsLoading]);

  // Memoized error state
  const errorMessage = useMemo(() => {
    return plotsError || geoError;
  }, [plotsError, geoError]);

  // Fix for leaflet marker icons in production
  useEffect(() => {
    // Delete the default marker icon
    delete (window as any).L.Icon.Default.prototype._getIconUrl;
    // Set up the path to the marker icon
    (window as any).L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    });
  }, []);

  // Auto-request location on component mount
  useEffect(() => {
    if (!position && !geoLoading && !geoError) {
      refreshLocation();
    }
  }, [position, geoLoading, geoError, refreshLocation]);

  // Stable callback functions with useCallback
  const handleLongPress = useCallback((position: MapPosition) => {
    console.log('%c[MAP] Long press handler called with:', 'color: purple; font-weight: bold', position);
    setLongPressPosition(position);
    setDebugMarker(position);
    setShowPopup(true);
  }, []);

  const handleClosePopup = useCallback(() => {
    setShowPopup(false);
    setDebugMarker(null);
  }, []);

  const handleBoundsChange = useCallback((bounds: MapBounds) => {
    // Only load plots if not currently interacting with the map
    if (!isMapInteracting) {
      loadPlotsInViewport(bounds);
    }
  }, [loadPlotsInViewport, isMapInteracting]);

  const handleInteractionStart = useCallback(() => {
    setIsMapInteracting(true);
  }, []);

  const handleInteractionEnd = useCallback(() => {
    setIsMapInteracting(false);
  }, []);

  const handleTogglePlotVisibility = useCallback((visible: boolean) => {
    setPlotsVisible(visible);
  }, []);

  const handlePlotAdded = useCallback(async () => {
    console.log('%c[Map] Plot added, refreshing data', 'color: purple; font-weight: bold');
    // Refresh plots to show the newly added plot immediately
    refreshPlots();
  }, [refreshPlots]);

  const handlePermissionChange = useCallback((state: 'granted' | 'denied' | 'prompt' | 'unavailable') => {
    if (state === 'granted') {
      setShowUserLocation(true);
    }
  }, []);

  const handlePlotModalStateChange = useCallback((isOpen: boolean) => {
    // Modal state tracking for future use
    console.log('Plot modal state changed:', isOpen);
  }, []);

  const handlePlotUpdated = useCallback(() => {
    console.log('%c[Map] Plot updated', 'color: green; font-weight: bold');
    // Refresh plots to show the updated plot immediately
    refreshPlots();
  }, [refreshPlots]);

  const handlePlotDeleted = useCallback(() => {
    console.log('%c[Map] Plot deleted', 'color: red; font-weight: bold');
    // Refresh plots to remove the deleted plot immediately
    refreshPlots();
  }, [refreshPlots]);

  // Memoized map container props for performance
  const mapContainerProps = useMemo(() => ({
    center: mapCenter,
    zoom: DEFAULT_ZOOM,
    style: { 
      height: '100%', 
      width: '100%',
      zIndex: 1
    },
    zoomControl: false,
    attributionControl: false,
    preferCanvas: true, // Use canvas for better performance
    maxZoom: 19,
    minZoom: 3
  }), []); // Remove mapCenter dependency since it's now constant

  // Memoized tile layer props
  const tileLayerProps = useMemo(() => ({
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
    tileSize: 256,
    updateWhenIdle: true,
    updateWhenZooming: false,
    keepBuffer: 2
  }), []);

  return (
    <div style={{ 
      position: 'absolute', 
      top: 0, 
      left: 0, 
      right: 0, 
      bottom: 0, 
      width: '100%', 
      height: '100%',
      overflow: 'hidden'
    }}>
      {/* Removed full-screen loading overlay to prevent blinking */}
      
      {errorMessage && (
        <ErrorDisplay error={errorMessage} />
      )}
      
      <GeolocationPermission onPermissionChange={handlePermissionChange} />
      
      <MapContainer {...mapContainerProps}>
        <TileLayer {...tileLayerProps} />
        
        {/* Optimized plot markers with clustering */}
        <PlotMarkerCluster
          plots={plots}
          onPlotUpdated={handlePlotUpdated}
          onPlotDeleted={handlePlotDeleted}
          onModalStateChange={handlePlotModalStateChange}
          visible={plotsVisible}
        />
        
        {/* User location marker */}
        {showUserLocation && (
          <UserLocationMarker />
        )}
        
        {/* Debug marker for long press detection */}
        {debugMarker && (
          <div style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: '10px',
            height: '10px',
            backgroundColor: 'red',
            borderRadius: '50%',
            zIndex: 1000,
            pointerEvents: 'none'
          }} />
        )}
        
        {/* Map interaction handlers */}
        <MapLongPressHandler 
          onLongPress={handleLongPress}
        />
        
        <MapBoundsTracker 
          onBoundsChange={handleBoundsChange}
          onInteractionStart={handleInteractionStart}
          onInteractionEnd={handleInteractionEnd}
        />
        
        {/* Auto-center map when user location is available (only once) */}
        {centerPosition && !geoLoading && !hasInitiallyRecentered && (
          <MapRecenterComponent 
            position={centerPosition} 
            onlyOnce={true}
            onRecenter={() => setHasInitiallyRecentered(true)}
          />
        )}
        
        {/* Map controls that need map context */}
        <MapLayerControl position="topright" />
        <CustomZoomControl position="bottomright" />
        <LocationButton position="bottomright" />
      </MapContainer>
      
      {/* Loading indicator for plot data */}
      {plotsLoading && (
        <div style={{
          position: 'absolute',
          top: '16px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          padding: '8px 16px',
          borderRadius: '20px',
          fontSize: '14px',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <div style={{
            width: '16px',
            height: '16px',
            border: '2px solid #ffffff40',
            borderTop: '2px solid #ffffff',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          Loading plots...
        </div>
      )}

      {/* Map controls that don't need map context */}
      <PlotVisibilityControl 
        position="topright"
        visible={plotsVisible}
        onToggle={handleTogglePlotVisibility}
      />
      
      {/* Modals */}
      <LongPressModal
        isOpen={showPopup}
        position={longPressPosition}
        onClose={handleClosePopup}
        onAddPlot={() => {
          setShowPlotForm(true);
          setShowPopup(false);
        }}
      />
      
      <PlotSubmissionForm
        isOpen={showPlotForm}
        position={longPressPosition}
        onClose={() => setShowPlotForm(false)}
        onPlotAdded={handlePlotAdded}
      />
      
      {/* Performance stats display (development only) */}
      {import.meta.env.DEV && (
        <div style={{
          position: 'absolute',
          bottom: '10px',
          left: '10px',
          background: 'rgba(0,0,0,0.7)',
          color: 'white',
          padding: '8px',
          borderRadius: '4px',
          fontSize: '12px',
          zIndex: 1000
        }}>
          <div>Plots: {plotStats.total}</div>
          <div>For Sale: {plotStats.forSale}</div>
          <div>Avg Price: ${plotStats.averagePrice.toLocaleString()}</div>
        </div>
      )}
    </div>
  );
});

OptimizedMapComponent.displayName = 'OptimizedMapComponent';

export default OptimizedMapComponent; 