import { useMapEvents } from 'react-leaflet';
import type { MapPosition } from '../../types/plot.types';

interface MapLongPressHandlerProps {
  onLongPress: (position: MapPosition) => void;
}

const MapLongPressHandler: React.FC<MapLongPressHandlerProps> = ({ onLongPress }) => {
  useMapEvents({
    contextmenu: (event) => {
      const { lat, lng } = event.latlng;
      onLongPress({ lat, lng });
    },
  });
  
  return null;
};

export default MapLongPressHandler; 