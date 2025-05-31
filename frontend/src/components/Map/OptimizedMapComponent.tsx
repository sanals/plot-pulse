import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import { useGeolocation } from '../../hooks/useGeolocation';
import { useOptimizedPlotData } from '../../hooks/useOptimizedPlotData';
import { MapLayerProvider, useMapLayer } from '../../contexts/MapLayerContext';
import PlotMarkerCluster from './PlotMarkerCluster';
import { LongPressModal } from './LongPressPopup';
import { PlotSubmissionForm } from '../Forms/PlotSubmissionForm';
import MapLayerControl from './MapLayerControl';
import LocationButton from './LocationButton';
import UserLocationMarker from './UserLocationMarker';
import LocationIndicatorToggle from './LocationIndicatorToggle';
import MarkerDisplayToggle from './MarkerDisplayToggle';
import { type MarkerDisplayMode } from './PlotMarker';
import MapLongPressHandler from './MapLongPressHandler';
import MapRecenterComponent from './MapRecenterComponent';
import MapBoundsTracker from './MapBoundsTracker';
import CustomZoomControl from './CustomZoomControl';
import GeolocationPermission from './GeolocationPermission';
import 'leaflet/dist/leaflet.css';
import '../../styles/map-markers.css';
import type { MapPosition, MapBounds } from '../../types/plot.types';

// Constants
const DEFAULT_CENTER: MapPosition = { lat: 51.505, lng: -0.09 };
const DEFAULT_ZOOM = 13;

// Memoized error display component
const ErrorDisplay = React.memo<{ error: string }>(({ error }) => (
  <div className="error-display">
    <div className="error-message">
      {error}
    </div>
  </div>
));

ErrorDisplay.displayName = 'ErrorDisplay';

/**
 * Inner map component that uses the map layer context
 */
const MapComponentInner: React.FC = React.memo(() => {
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
    debounceDelay: 500,
    cacheTimeout: 30 * 60 * 1000, // 30 minutes
    maxCacheSize: 100
  });

  // State management
  const [longPressPosition, setLongPressPosition] = useState<MapPosition | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [showPlotForm, setShowPlotForm] = useState(false);
  const [plotsVisible, setPlotsVisible] = useState(true);
  const [markerDisplayMode, setMarkerDisplayMode] = useState<MarkerDisplayMode>('text');
  const [showUserLocation, setShowUserLocation] = useState(true);
  const [hasInitiallyRecentered, setHasInitiallyRecentered] = useState(false);
  const [isMapInteracting, setIsMapInteracting] = useState(false);

  // Memoized calculations
  const centerPosition = useMemo<MapPosition | null>(() => {
    return position 
      ? { lat: position.latitude, lng: position.longitude } 
      : null;
  }, [position]);

  const errorMessage = useMemo(() => {
    return plotsError || geoError;
  }, [plotsError, geoError]);

  // Fix for leaflet marker icons in production
  useEffect(() => {
    delete (window as any).L.Icon.Default.prototype._getIconUrl;
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

  // Event handlers
  const handleLongPress = useCallback((position: MapPosition) => {
    setLongPressPosition(position);
    setShowPopup(true);
  }, []);

  const handleClosePopup = useCallback(() => {
    setShowPopup(false);
  }, []);

  const handleBoundsChange = useCallback((bounds: MapBounds) => {
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

  const handlePlotAdded = useCallback(() => {
    refreshPlots();
  }, [refreshPlots]);

  const handlePermissionChange = useCallback((state: 'granted' | 'denied' | 'prompt' | 'unavailable') => {
    if (state === 'granted') {
      setShowUserLocation(true);
    }
  }, []);

  const handlePlotUpdated = useCallback(() => {
    refreshPlots();
  }, [refreshPlots]);

  const handlePlotDeleted = useCallback(() => {
    refreshPlots();
  }, [refreshPlots]);

  const handleLocationIndicatorToggle = useCallback((visible: boolean) => {
    setShowUserLocation(visible);
  }, []);

  // Memoized props for performance
  const mapContainerProps = useMemo(() => ({
    center: DEFAULT_CENTER,
    zoom: DEFAULT_ZOOM,
    style: { 
      height: '100%', 
      width: '100%',
      zIndex: 1
    },
    zoomControl: false,
    attributionControl: false,
    preferCanvas: true,
    maxZoom: 19,
    minZoom: 3
  }), []);

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
    <div className="map-container">
      {errorMessage && <ErrorDisplay error={errorMessage} />}
      
      <GeolocationPermission onPermissionChange={handlePermissionChange} />
      
      <MapContainer {...mapContainerProps}>
        <TileLayer {...tileLayerProps} />
        
        <PlotMarkerCluster
          plots={plots}
          mode={markerDisplayMode}
          onPlotUpdated={handlePlotUpdated}
          onPlotDeleted={handlePlotDeleted}
          visible={plotsVisible && markerDisplayMode !== 'none'}
        />
        
        {showUserLocation && <UserLocationMarker />}
        
        <MapLongPressHandler onLongPress={handleLongPress} />
        
        <MapBoundsTracker 
          onBoundsChange={handleBoundsChange}
          onInteractionStart={handleInteractionStart}
          onInteractionEnd={handleInteractionEnd}
        />
        
        {centerPosition && !geoLoading && !hasInitiallyRecentered && (
          <MapRecenterComponent 
            position={centerPosition} 
            onlyOnce={true}
            onRecenter={() => setHasInitiallyRecentered(true)}
          />
        )}
        
        <MapLayerControl position="topright" />
        <CustomZoomControl position="bottomright" />
        <LocationButton position="bottomright" />
      </MapContainer>
      
      {plotsLoading && (
        <div className="loading-indicator">
          <div className="loading-spinner" />
          Loading plots...
        </div>
      )}

      <MarkerDisplayToggle 
        position="topright"
        mode={markerDisplayMode}
        onModeChange={setMarkerDisplayMode}
      />
      
      <LocationIndicatorToggle
        position="topright"
        visible={showUserLocation}
        onToggle={handleLocationIndicatorToggle}
      />
      
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
      
      {import.meta.env.DEV && (
        <div className="dev-stats">
          <div>Plots: {plotStats.total}</div>
          <div>For Sale: {plotStats.forSale}</div>
          <div>Avg Price: ₹{plotStats.averagePrice.toLocaleString()}</div>
        </div>
      )}
    </div>
  );
});

MapComponentInner.displayName = 'MapComponentInner';

/**
 * Optimized MapComponent with performance enhancements and satellite mode support
 * 
 * Features:
 * - React.memo for expensive components
 * - useMemo for expensive calculations
 * - useCallback for stable function references
 * - Marker clustering for better performance
 * - Viewport-based plot loading
 * - Debounced API calls
 * - Dynamic color schemes based on map layer
 */
const OptimizedMapComponent: React.FC = React.memo(() => {
  return (
    <MapLayerProvider>
      <MapComponentInner />
    </MapLayerProvider>
  );
});

OptimizedMapComponent.displayName = 'OptimizedMapComponent';

export default OptimizedMapComponent; 