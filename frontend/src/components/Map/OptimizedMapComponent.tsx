import React, { useState, useEffect, useCallback, useMemo, createContext, useContext } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import { useGeolocationContext } from '../../contexts/GeolocationContext';
import { useOptimizedPlotData } from '../../hooks/useOptimizedPlotData';
import { useSettings } from '../../contexts/SettingsContext';
import { getAllCurrencies } from '../../utils/currencyUtils';
import { MapLayerProvider } from '../../contexts/MapLayerContext';
import PlotMarkerCluster from './PlotMarkerCluster';
import { LongPressModal } from './LongPressPopup';
import { PlotSubmissionForm } from '../Forms/PlotSubmissionForm';
import { PlotEditForm } from '../Forms/PlotEditForm';
import { ConfirmationDialog } from '../Common/ConfirmationDialog';
import { FilterPanel } from '../Filters/FilterPanel';
import MapLayerControl from './MapLayerControl';
import LocationButton from './LocationButton';
import UserLocationMarker from './UserLocationMarker';
import { type MarkerDisplayMode } from './PlotMarker';
import MapLongPressHandler from './MapLongPressHandler';
import MapRecenterComponent from './MapRecenterComponent';
import MapBoundsTracker from './MapBoundsTracker';
import CustomZoomControl from './CustomZoomControl';
import GeolocationPermission from './GeolocationPermission';
import MapNavbar from '../Navigation/MapNavbar';
import 'leaflet/dist/leaflet.css';
import '../../styles/map-markers.css';
import '../../styles/navbar.css';
import type { MapPosition, MapBounds, PlotDto } from '../../types/plot.types';
import { AuthModal } from '../Auth/AuthModal';
import { useFilters } from '../../contexts/FilterContext';

// Constants
const DEFAULT_CENTER: MapPosition = { lat: 51.505, lng: -0.09 };
const DEFAULT_ZOOM = 13;

// Modal context for managing modals outside map container
interface ModalContextType {
  showEditForm: (plot: PlotDto) => void;
  showDeleteConfirm: (plot: PlotDto, onConfirm: () => void) => void;
  hideModals: () => void;
}

const ModalContext = createContext<ModalContextType | null>(null);

export const useModalContext = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModalContext must be used within ModalProvider');
  }
  return context;
};

// Memoized error display component
const ErrorDisplay = React.memo<{ error: string }>(({ error }) => (
  <div className="error-display">
    <div className="error-message">
      {error}
    </div>
  </div>
));

ErrorDisplay.displayName = 'ErrorDisplay';

// Component to control map interactions when modals are open
const MapInteractionController: React.FC<{ disabled: boolean }> = ({ disabled }) => {
  const map = useMap();
  
  useEffect(() => {
    if (disabled) {
      // Disable map interactions
      map.dragging.disable();
      map.touchZoom.disable();
      map.doubleClickZoom.disable();
      map.scrollWheelZoom.disable();
      map.boxZoom.disable();
      map.keyboard.disable();
      if ((map as any).tap) (map as any).tap.disable();
    } else {
      // Enable map interactions
      map.dragging.enable();
      map.touchZoom.enable();
      map.doubleClickZoom.enable();
      map.scrollWheelZoom.enable();
      map.boxZoom.enable();
      map.keyboard.enable();
      if ((map as any).tap) (map as any).tap.enable();
    }
  }, [map, disabled]);
  
  return null;
};

// Component to capture map instance for external navigation
const MapInstanceCapture: React.FC<{ onMapReady: (map: any) => void }> = ({ onMapReady }) => {
  const map = useMap();
  
  useEffect(() => {
    onMapReady(map);
  }, [map, onMapReady]);
  
  return null;
};

/**
 * Inner map component that uses the map layer context
 */
const MapComponentInner: React.FC = () => {
  const { position, loading: geoLoading, error: geoError, refreshLocation } = useGeolocationContext();
  const { currency, areaUnit } = useSettings();
  const { getFilterParams } = useFilters();
  
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
    maxCacheSize: 100,
    currency: currency,
    areaUnit: areaUnit,
    filters: getFilterParams()
  });

  // State management
  const [longPressPosition, setLongPressPosition] = useState<MapPosition | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [showPlotForm, setShowPlotForm] = useState(false);
  const plotsVisible = true; // Constant value since we don't need to toggle this
  const [markerDisplayMode, setMarkerDisplayMode] = useState<MarkerDisplayMode>('text');
  const [showUserLocation, setShowUserLocation] = useState(true);
  const [isMapInteracting, setIsMapInteracting] = useState(false);
  const [hasInitiallyRecentered, setHasInitiallyRecentered] = useState(false);
  const [lastKnownPosition, setLastKnownPosition] = useState<MapPosition | null>(null);
  const [mapInstance, setMapInstance] = useState<any>(null);

  // Authentication modal state
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');

  // Modal state for plot edit and delete
  const [editingPlot, setEditingPlot] = useState<PlotDto | null>(null);
  const [deletingPlot, setDeletingPlot] = useState<PlotDto | null>(null);
  const [deleteConfirmCallback, setDeleteConfirmCallback] = useState<(() => void) | null>(null);

  // Navigation state for proper map padding
  const [isNavbarExpanded, setIsNavbarExpanded] = useState(false);

  // Memoized calculations
  const centerPosition = useMemo<MapPosition | null>(() => {
    return position 
      ? { lat: position.latitude, lng: position.longitude } 
      : lastKnownPosition; // Return last known position if current position is lost
  }, [position, lastKnownPosition]);

  // Update last known position when we get a new position
  useEffect(() => {
    if (position) {
      const newPos = { lat: position.latitude, lng: position.longitude };
      setLastKnownPosition(newPos);
    }
  }, [position]);

  const errorMessage = useMemo(() => {
    return plotsError; // Only show plot errors here, geo errors have their own section
  }, [plotsError]);

  // Check if any modal is open to disable map interactions
  const isAnyModalOpen = useMemo(() => {
    return showPopup || showPlotForm || !!editingPlot || !!deletingPlot || showAuthModal;
  }, [showPopup, showPlotForm, editingPlot, deletingPlot, showAuthModal]);

  // Fix for leaflet marker icons in production
  useEffect(() => {
    delete (window as any).L.Icon.Default.prototype._getIconUrl;
    (window as any).L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    });
  }, []);

  // Auto-request location on component mount and retry on errors
  useEffect(() => {
    if (!position && !geoLoading && !geoError) {
      refreshLocation();
    }
    
    // Auto-retry location if there's an error after 30 seconds
    if (geoError && !geoLoading) {
      const retryTimer = setTimeout(() => {
        console.log('Auto-retrying location after error...');
        refreshLocation();
      }, 30000);
      
      return () => clearTimeout(retryTimer);
    }
  }, [position, geoLoading, geoError, refreshLocation]);

  // Authentication handlers
  const handleShowLogin = useCallback(() => {
    setAuthModalMode('login');
    setShowAuthModal(true);
  }, []);

  const handleShowRegister = useCallback(() => {
    setAuthModalMode('register');
    setShowAuthModal(true);
  }, []);

  const handleCloseAuthModal = useCallback(() => {
    setShowAuthModal(false);
  }, []);

  // Event handlers
  const handleLongPress = useCallback((position: MapPosition) => {
    // Always show the plot creation modal, regardless of authentication status
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

  // Handle navigation from search
  const handleNavigateToLocation = useCallback((lat: number, lng: number, zoom: number = 16) => {
    if (mapInstance) {
      mapInstance.setView([lat, lng], zoom);
    }
  }, [mapInstance]);

  // Modal context functions
  const modalContextValue = useMemo<ModalContextType>(() => ({
    showEditForm: (plot: PlotDto) => {
      setEditingPlot(plot);
    },
    showDeleteConfirm: (plot: PlotDto, onConfirm: () => void) => {
      setDeletingPlot(plot);
      setDeleteConfirmCallback(() => onConfirm);
    },
    hideModals: () => {
      setEditingPlot(null);
      setDeletingPlot(null);
      setDeleteConfirmCallback(null);
    }
  }), []);

  // Event handlers for preventing map interactions through overlay
  const handleOverlayEvent = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
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

  // Debug currency and area unit changes and force recalculation
  useEffect(() => {
    console.log('Currency or area unit changed to:', currency, areaUnit);
    // Force a refresh of plot statistics when currency or area unit changes
    if (plots.length > 0) {
      console.log('Forcing plot stats recalculation for currency:', currency, 'and areaUnit:', areaUnit);
    }
  }, [currency, areaUnit, plots.length]);

  const hasActiveFilters = useMemo(() => {
    const filterParams = getFilterParams();
    return Object.keys(filterParams).length > 0;
  }, [getFilterParams]);

  return (
    <ModalContext.Provider value={modalContextValue}>
      <div className={`map-container ${isNavbarExpanded ? 'navbar-expanded' : ''}`}>
        {errorMessage && <ErrorDisplay error={errorMessage} />}
        
        <GeolocationPermission onPermissionChange={handlePermissionChange} />
        
        {/* New Responsive Navigation */}
        <MapNavbar
          markerDisplayMode={markerDisplayMode}
          onMarkerDisplayModeChange={setMarkerDisplayMode}
          showUserLocation={showUserLocation}
          onLocationToggle={handleLocationIndicatorToggle}
          onShowLogin={handleShowLogin}
          onShowRegister={handleShowRegister}
          onNavigateToLocation={handleNavigateToLocation}
          onNavbarExpandChange={setIsNavbarExpanded}
        />
        
        {/* Visual overlay when map interactions are disabled */}
        {isAnyModalOpen && (
          <div 
            className="map-disabled-overlay"
            onMouseDown={handleOverlayEvent}
            onMouseUp={handleOverlayEvent}
            onMouseMove={handleOverlayEvent}
            onTouchStart={handleOverlayEvent}
            onTouchEnd={handleOverlayEvent}
            onTouchMove={handleOverlayEvent}
            onContextMenu={handleOverlayEvent}
            onWheel={handleOverlayEvent}
            onDragStart={handleOverlayEvent}
          />
        )}
        
        <MapContainer key="main-map" {...mapContainerProps}>
          <TileLayer {...tileLayerProps} />
          
          <MapInteractionController disabled={isAnyModalOpen} />
          <MapInstanceCapture onMapReady={setMapInstance} />
          
          <PlotMarkerCluster
            plots={plots}
            mode={markerDisplayMode}
            onPlotDeleted={handlePlotDeleted}
            visible={plotsVisible && markerDisplayMode !== 'none'}
          />
          
          {showUserLocation && <UserLocationMarker key={`user-location-${showUserLocation}`} />}
          
          <MapLongPressHandler onLongPress={handleLongPress} />
          
          <MapBoundsTracker 
            onBoundsChange={handleBoundsChange}
            onInteractionStart={handleInteractionStart}
            onInteractionEnd={handleInteractionEnd}
          />
          
          <MapRecenterComponent 
            position={centerPosition && !geoLoading ? centerPosition : null}
            onlyOnce={false}
            respectUserInteraction={true}
            onRecenter={() => {
              if (!hasInitiallyRecentered) {
                setHasInitiallyRecentered(true);
              }
            }}
          />
          
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

        {geoLoading && (
          <div className="loading-indicator" style={{ top: '60px' }}>
            <div className="loading-spinner" />
            Getting your location...
          </div>
        )}

        {geoError && (
          <div className="error-display" style={{ top: '60px' }}>
            <div 
              className="error-message"
              style={{
                backgroundColor: '#dc2626',
                color: '#ffffff',
                padding: '12px 16px',
                borderRadius: '8px',
                fontWeight: '500',
                fontSize: '14px',
                border: '1px solid #b91c1c',
                textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
              }}
            >
              {geoError}
            </div>
          </div>
        )}

        {import.meta.env.DEV && (
          <div className="dev-stats">
            <div>Plots: {plotStats.total}</div>
            <div>For Sale: {plotStats.forSale}</div>
            <div>Avg Price: {(() => {
              // Use centralized price formatting for consistency
              // Since averagePrice is already in preferred currency and area unit,
              // we just need basic formatting
              const avgPrice = plotStats.averagePrice.toLocaleString(undefined, { 
                minimumFractionDigits: 0, 
                maximumFractionDigits: 0 
              });
              
              // Get currency symbol and area unit label
              const currencySymbol = getAllCurrencies().find(c => c.code === currency)?.symbol || '$';
              const areaUnitLabels = {
                sqft: '/sqft',
                sqm: '/sqm', 
                cent: '/cent',
                acre: '/acre'
              };
              const areaLabel = areaUnitLabels[areaUnit] || '/sqft';
              
              return `${currencySymbol}${avgPrice}${areaLabel}`;
            })()}</div>
            {hasActiveFilters && plotStats.total === 0 && (
              <div style={{ color: '#dc2626', fontWeight: '600', marginTop: '8px' }}>
                🔍 No plots match filters
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Modals rendered outside map container to avoid overlay interference */}
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

      {/* Plot edit modal */}
      <PlotEditForm
        isOpen={!!editingPlot}
        plot={editingPlot}
        onClose={modalContextValue.hideModals}
        onPlotUpdated={() => {
          modalContextValue.hideModals();
          handlePlotUpdated();
        }}
      />

      {/* Plot delete confirmation */}
      <ConfirmationDialog
        isOpen={!!deletingPlot}
        title="Delete Plot"
        message={`Are you sure you want to delete Plot ${deletingPlot?.id}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        isDestructive={true}
        loading={false}
        onConfirm={() => {
          if (deleteConfirmCallback) {
            deleteConfirmCallback();
          }
          modalContextValue.hideModals();
        }}
        onCancel={modalContextValue.hideModals}
      />

      {/* Authentication Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={handleCloseAuthModal}
        initialMode={authModalMode}
      />

      {/* Filter Panel */}
      <FilterPanel />
    </ModalContext.Provider>
  );
};

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