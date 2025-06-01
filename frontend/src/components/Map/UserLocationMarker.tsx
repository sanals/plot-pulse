import { useEffect, useState, useRef } from 'react';
import { Marker, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useGeolocation } from '../../hooks/useGeolocation';

interface UserLocationMarkerProps {
  showAccuracy?: boolean;
  accuracyColor?: string;
  accuracyFillColor?: string;
  accuracyFillOpacity?: number;
  pulsatingMarker?: boolean;
  followUser?: boolean;
  zoomLevel?: number;
}

/**
 * Component to display the user's current location on the map
 */
const UserLocationMarker: React.FC<UserLocationMarkerProps> = ({
  showAccuracy = true,
  accuracyColor = '#4285F4',
  accuracyFillColor = '#4285F4',
  accuracyFillOpacity = 0.15,
  pulsatingMarker = true,
  followUser = false,
  zoomLevel = 16
}) => {
  const map = useMap();
  const { position, loading, error, refreshLocation } = useGeolocation({
    watchPosition: true,
    enableHighAccuracy: true
  });
  const [userIcon, setUserIcon] = useState<L.DivIcon | null>(null);
  const mountedRef = useRef(true);
  
  // Refresh location when component mounts to ensure we have current data
  useEffect(() => {
    mountedRef.current = true;
    
    // If we don't have a position and we're not loading, try to refresh
    if (!position && !loading && !error) {
      refreshLocation();
    }
    
    return () => {
      mountedRef.current = false;
    };
  }, [position, loading, error, refreshLocation]);
  
  // Create custom icon for user location
  useEffect(() => {
    if (!mountedRef.current) return;
    
    const icon = L.divIcon({
      className: pulsatingMarker ? 'user-location-marker pulsating' : 'user-location-marker',
      html: `<div class="marker-inner"></div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });
    
    setUserIcon(icon);
    
    // Add CSS for pulsating effect if enabled
    if (pulsatingMarker && !document.getElementById('user-marker-style')) {
      const style = document.createElement('style');
      style.id = 'user-marker-style';
      style.textContent = `
        .user-location-marker {
          display: block;
          width: 24px !important;
          height: 24px !important;
          border-radius: 50%;
          background-color: ${accuracyColor};
          border: 2px solid white;
          box-shadow: 0 0 0 2px ${accuracyColor};
        }
        .user-location-marker.pulsating::before {
          content: "";
          position: absolute;
          width: 24px;
          height: 24px;
          left: 0;
          top: 0;
          background-color: ${accuracyColor};
          border-radius: 50%;
          opacity: 0.5;
          animation: pulse 2s infinite;
        }
        .marker-inner {
          width: 12px;
          height: 12px;
          margin: 4px;
          background-color: white;
          border-radius: 50%;
        }
        @keyframes pulse {
          0% {
            transform: scale(1);
            opacity: 0.8;
          }
          70% {
            transform: scale(3);
            opacity: 0;
          }
          100% {
            transform: scale(1);
            opacity: 0;
          }
        }
      `;
      document.head.appendChild(style);
    }
  }, [pulsatingMarker, accuracyColor]);
  
  // Follow user if enabled
  useEffect(() => {
    if (followUser && position && !loading && !error && mountedRef.current) {
      map.setView([position.latitude, position.longitude], zoomLevel);
    }
  }, [position, followUser, loading, error, map, zoomLevel]);
  
  // Don't render if we don't have the required data
  if (!mountedRef.current || !position || loading || error || !userIcon) {
    return null;
  }
  
  return (
    <>
      {showAccuracy && position.accuracy && (
        <Circle
          center={[position.latitude, position.longitude]}
          radius={position.accuracy}
          pathOptions={{
            color: accuracyColor,
            fillColor: accuracyFillColor,
            fillOpacity: accuracyFillOpacity,
            weight: 1
          }}
        />
      )}
      <Marker
        position={[position.latitude, position.longitude]}
        icon={userIcon}
      />
    </>
  );
};

export default UserLocationMarker; 