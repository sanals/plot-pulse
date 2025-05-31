import { useMap } from 'react-leaflet';
import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { TileLayer } from 'leaflet';
import L from 'leaflet';
import { useMapLayer, type MapLayerType } from '../../contexts/MapLayerContext';

interface MapLayer {
  name: MapLayerType;
  url: string;
  attribution: string;
}

interface MapLayerControlProps {
  position?: 'topleft' | 'topright' | 'bottomleft' | 'bottomright';
}

const MAP_LAYERS: MapLayer[] = [
  {
    name: 'Standard',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  },
  {
    name: 'Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
  },
  {
    name: 'Topo',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
  }
];

const MapLayerControl: React.FC<MapLayerControlProps> = ({ 
  position = 'topright' 
}) => {
  const map = useMap();
  const { activeLayer, setActiveLayer } = useMapLayer();
  const [isOpen, setIsOpen] = useState(false);
  const customLayerRef = useRef<TileLayer | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  
  // Prevent map interactions on the dropdown button
  useEffect(() => {
    if (buttonRef.current) {
      L.DomEvent.disableClickPropagation(buttonRef.current);
      L.DomEvent.disableScrollPropagation(buttonRef.current);
    }
  }, []);
  
  const updateMapLayer = useCallback((layer: MapLayer) => {
    // Remove existing custom layer
    if (customLayerRef.current) {
      map.removeLayer(customLayerRef.current);
      customLayerRef.current = null;
    }
    
    // Add new layer if not the default "Standard" layer
    if (layer.name !== 'Standard') {
      const tileLayer = new TileLayer(layer.url, { 
        attribution: layer.attribution 
      });
      tileLayer.addTo(map);
      customLayerRef.current = tileLayer;
    }
    
    setActiveLayer(layer.name);
    setIsOpen(false);
  }, [map, setActiveLayer]);

  const toggleDropdown = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  const getDropdownPosition = useCallback(() => {
    if (!buttonRef.current) return {};
    
    const rect = buttonRef.current.getBoundingClientRect();
    return {
      position: 'fixed' as const,
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
    };
  }, []);
  
  return (
    <div className="map-layer-control" style={{ 
      position: 'absolute',
      top: position === 'topright' || position === 'topleft' ? '16px' : 'auto',
      right: position === 'topright' || position === 'bottomright' ? '16px' : 'auto',
      left: position === 'topleft' || position === 'bottomleft' ? '16px' : 'auto',
      bottom: position === 'bottomright' || position === 'bottomleft' ? '80px' : 'auto',
      backgroundColor: 'white',
      borderRadius: '6px',
      boxShadow: '0 1px 5px rgba(0,0,0,0.4)',
      zIndex: 1000,
      minWidth: '120px',
      border: '1px solid #e2e8f0'
    }}>
      <button 
        ref={buttonRef}
        style={{
          width: '100%',
          padding: '8px 12px',
          backgroundColor: 'white',
          border: 'none',
          borderRadius: '6px',
          fontSize: '14px',
          color: '#374151',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          outline: 'none'
        }}
        onClick={toggleDropdown}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
        aria-label="Select map layer"
        aria-expanded={isOpen}
      >
        <span>{activeLayer}</span>
        <span style={{ 
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', 
          transition: 'transform 0.2s' 
        }}>
          ▼
        </span>
      </button>
      
      {isOpen && buttonRef.current && createPortal(
        <div style={{
          ...getDropdownPosition(),
          backgroundColor: 'white',
          border: '1px solid #e2e8f0',
          borderRadius: '6px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          zIndex: 9999
        }}>
          {MAP_LAYERS.map((layer) => (
            <button
              key={layer.name}
              style={{
                width: '100%',
                padding: '8px 16px',
                backgroundColor: activeLayer === layer.name ? '#eff6ff' : 'white',
                color: activeLayer === layer.name ? '#1d4ed8' : '#374151',
                border: 'none',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: '14px',
                outline: 'none'
              }}
              onClick={() => updateMapLayer(layer)}
              onMouseEnter={(e) => {
                if (activeLayer !== layer.name) {
                  e.currentTarget.style.backgroundColor = '#f3f4f6';
                }
              }}
              onMouseLeave={(e) => {
                if (activeLayer !== layer.name) {
                  e.currentTarget.style.backgroundColor = 'white';
                }
              }}
              aria-label={`Switch to ${layer.name} layer`}
            >
              {layer.name}
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
};

export default MapLayerControl; 