import { Marker, Popup } from 'react-leaflet';
import type { PlotDto, MapPosition } from '../../types/plot.types';

interface PlotMarkerProps {
  plot: PlotDto;
}

const PlotMarker = ({ plot }: PlotMarkerProps) => {
  const position: MapPosition = {
    lat: plot.latitude,
    lng: plot.longitude,
  };

  return (
    <Marker position={position}>
      <Popup>
        <div className="plot-popup">
          <h3>Plot {plot.id}</h3>
          <p><strong>Price:</strong> ${plot.price.toLocaleString()}</p>
          <p><strong>Status:</strong> {plot.isForSale ? 'For Sale' : 'Not For Sale'}</p>
          {plot.description && <p>{plot.description}</p>}
        </div>
      </Popup>
    </Marker>
  );
};

export default PlotMarker; 