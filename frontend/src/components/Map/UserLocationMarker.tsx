import { useEffect, useState } from 'react';
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
  const { position, loading, error } = useGeolocation({
    watchPosition: true,
    enableHighAccuracy: true
  });
  const [userIcon, setUserIcon] = useState<L.DivIcon | null>(null);
  
  // Create custom icon for user location
  useEffect(() => {
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
    
    return () => {
      // Clean up CSS if component unmounts
      const styleElement = document.getElementById('user-marker-style');
      if (styleElement) {
        document.head.removeChild(styleElement);
      }
    };
  }, [pulsatingMarker, accuracyColor]);
  
  // Follow user if enabled
  useEffect(() => {
    if (followUser && position && !loading && !error) {
      map.setView([position.latitude, position.longitude], zoomLevel);
    }
  }, [position, followUser, loading, error, map, zoomLevel]);
  
  if (!position || loading || error || !userIcon) {
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