import { useEffect, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import { useGeolocation } from '../../hooks/useGeolocation';
import PlotMarker from './PlotMarker';
import { LongPressPopup, LongPressModal } from './LongPressPopup';
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
import 'leaflet/dist/leaflet.css';
import type { MapPosition, PlotDto, MapBounds } from '../../types/plot.types';
import { getPlots } from '../../services/plotService';
import LoadingSpinner from '../Common/LoadingSpinner';
// import MarkerClusterGroup from 'react-leaflet-cluster';

// Default center for the map (London)
const DEFAULT_CENTER: MapPosition = { lat: 51.505, lng: -0.09 };
const DEFAULT_ZOOM = 13;

const MapComponent = () => {
  const { position, loading: geoLoading, error: geoError } = useGeolocation();
  const [plots, setPlots] = useState<PlotDto[]>([]);
  const [filteredPlots, setFilteredPlots] = useState<PlotDto[]>([]);
  const [mapBounds, setMapBounds] = useState<MapBounds | null>(null);
  const [longPressPosition, setLongPressPosition] = useState<MapPosition | null>(null);
  const [showPopup, setShowPopup] = useState<boolean>(false);
  const [showPlotForm, setShowPlotForm] = useState<boolean>(false);
  const [plotsVisible, setPlotsVisible] = useState<boolean>(true);
  const [showUserLocation, setShowUserLocation] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showGeoPermission, setShowGeoPermission] = useState<boolean>(true);
  
  // Debug: Add debug marker to visualize click detection
  const [debugMarker, setDebugMarker] = useState<MapPosition | null>(null);
  
  // Transform the geolocation position to the map position format
  const centerPosition: MapPosition | null = position 
    ? { lat: position.latitude, lng: position.longitude } 
    : null;
  
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
  
  // Load plots from API
  useEffect(() => {
    const loadPlots = async () => {
      setLoading(true);
      try {
        const data = await getPlots();
        setPlots(data);
        setFilteredPlots(data);
      } catch (err) {
        console.error('Failed to load plots:', err);
        setError('Failed to load plot data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    loadPlots();
  }, []);
  
  // Filter plots based on map bounds
  useEffect(() => {
    if (mapBounds && plots.length > 0) {
      const visible = plots.filter(plot => 
        plot.latitude <= mapBounds.north &&
        plot.latitude >= mapBounds.south &&
        plot.longitude <= mapBounds.east &&
        plot.longitude >= mapBounds.west
      );
      setFilteredPlots(visible);
    }
  }, [mapBounds, plots]);
  
  const handleLongPress = useCallback((position: MapPosition) => {
    console.log('%c[MAP] Long press handler called with:', 'color: purple; font-weight: bold', position);
    setLongPressPosition(position);
    setDebugMarker(position); // Debug: Show where we detected the click
    setShowPopup(true);
  }, []);
  
  const handleClosePopup = useCallback(() => {
    setShowPopup(false);
    setDebugMarker(null); // Clear debug marker when popup closes
  }, []);
  
  const handleBoundsChange = useCallback((bounds: MapBounds) => {
    setMapBounds(bounds);
  }, []);
  
  const handleTogglePlotVisibility = useCallback((visible: boolean) => {
    setPlotsVisible(visible);
  }, []);
  
  const handleToggleUserLocation = useCallback(() => {
    setShowUserLocation(prev => !prev);
  }, []);
  
  const handlePlotAdded = useCallback(async () => {
    console.log('%c[Map] Refreshing plots after new plot was added', 'color: purple; font-weight: bold');
    try {
      const data = await getPlots();
      console.log(`[Map] Loaded ${data.length} plots`);
      setPlots(data);
      
      // Also update filtered plots to show new plot immediately
      if (mapBounds) {
        const visible = data.filter(plot => 
          plot.latitude <= mapBounds.north &&
          plot.latitude >= mapBounds.south &&
          plot.longitude <= mapBounds.east &&
          plot.longitude >= mapBounds.west
        );
        setFilteredPlots(visible);
      } else {
        setFilteredPlots(data);
      }
    } catch (err) {
      console.error('[Map] Failed to refresh plots:', err);
    }
  }, [mapBounds]);
  
  const handlePermissionChange = useCallback((state: 'granted' | 'denied' | 'prompt' | 'unavailable') => {
    if (state === 'granted') {
      setShowUserLocation(true);
    }
  }, []);
  
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
      {(loading || geoLoading) && (
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(255, 255, 255, 0.7)',
          zIndex: 50
        }}>
          <LoadingSpinner message="Loading map data..." />
        </div>
      )}
      
      {(error || geoError) && (
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
            {error || geoError}
          </div>
        </div>
      )}
      
      {showGeoPermission && <GeolocationPermission onPermissionChange={handlePermissionChange} />}
      
      <MapContainer
        center={centerPosition || DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        style={{ 
          height: '100%', 
          width: '100%', 
          position: 'absolute', 
          top: 0, 
          left: 0,
          zIndex: 0
        }}
        attributionControl={true}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Custom Zoom Control */}
        <CustomZoomControl position="bottomright" />
        
        {/* Custom controls */}
        <MapLayerControl position="topright" />
        <PlotVisibilityControl 
          position="topright" 
          visible={plotsVisible} 
          onToggle={handleTogglePlotVisibility} 
        />
        <LocationButton position="bottomright" />
        
        {/* Helper components */}
        {centerPosition && <MapRecenterComponent position={centerPosition} />}
        {/* Only enable long press handler when no modal is open */}
        {!showPopup && !showPlotForm && <MapLongPressHandler onLongPress={handleLongPress} />}
        <MapBoundsTracker onBoundsChange={handleBoundsChange} />
        
        {/* User location marker */}
        {showUserLocation && <UserLocationMarker />}
        
        {/* Debug marker to visualize click detection */}
        {debugMarker && (
          <Marker 
            position={[debugMarker.lat, debugMarker.lng]}
            icon={L.divIcon({
              className: 'debug-marker',
              html: '<div style="background: red; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 0 2px red;"></div>',
              iconSize: [20, 20],
              iconAnchor: [10, 10]
            })}
          />
        )}
        
        {/* Plot markers with clustering */}
        {plotsVisible && (
          // Temporarily disabled MarkerClusterGroup to fix React-Leaflet context error
          // <MarkerClusterGroup
          //   chunkedLoading
          //   disableClusteringAtZoom={17}
          // >
          //   {filteredPlots.map(plot => (
          //     <PlotMarker key={plot.id} plot={plot} />
          //   ))}
          // </MarkerClusterGroup>
          <>
            {filteredPlots.map(plot => (
              <PlotMarker key={plot.id} plot={plot} />
            ))}
          </>
        )}
        
        {/* Show popup for adding new plot on long press */}
        {showPopup && longPressPosition && (
          <LongPressModal 
            isOpen={showPopup}
            position={longPressPosition} 
            onClose={handleClosePopup} 
            onAddPlot={(lat, lng) => {
              console.log('Opening plot form for ORIGINAL coordinates:', longPressPosition);
              console.log('Button was clicked at:', { lat, lng }, '(ignoring this)');
              // Use the original stored coordinates, not the button click coordinates
              setShowPopup(false);
              setShowPlotForm(true);
              // longPressPosition is already set correctly, no need to update it
            }}
          />
        )}
      </MapContainer>
      
      {/* Plot submission form */}
      <PlotSubmissionForm
        isOpen={showPlotForm}
        position={longPressPosition}
        onClose={() => {
          setShowPlotForm(false);
          setLongPressPosition(null);
        }}
        onPlotAdded={handlePlotAdded}
      />
    </div>
  );
};

export default MapComponent; 