import { useMap } from 'react-leaflet';

interface CustomZoomControlProps {
  position?: 'topleft' | 'topright' | 'bottomleft' | 'bottomright';
}

const CustomZoomControl: React.FC<CustomZoomControlProps> = ({ 
  position = 'bottomright' 
}) => {
  const map = useMap();
  
  return (
    <div 
      style={{
        position: 'absolute',
        top: position === 'topleft' || position === 'topright' ? '16px' : 'auto',
        right: position === 'topright' || position === 'bottomright' ? '16px' : 'auto',
        left: position === 'topleft' || position === 'bottomleft' ? '16px' : 'auto',
        bottom: position === 'bottomleft' || position === 'bottomright' ? '16px' : 'auto',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'white',
        borderRadius: '6px',
        boxShadow: '0 1px 5px rgba(0,0,0,0.4)',
        border: '1px solid #e2e8f0',
        overflow: 'hidden'
      }}
    >
      <button
        style={{
          width: '40px',
          height: '40px',
          backgroundColor: 'white',
          border: 'none',
          borderBottom: '1px solid #e2e8f0',
          fontSize: '18px',
          fontWeight: 'bold',
          color: '#374151',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 0
        }}
        onClick={() => map.zoomIn()}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
        title="Zoom in"
      >
        +
      </button>
      <button
        style={{
          width: '40px',
          height: '40px',
          backgroundColor: 'white',
          border: 'none',
          fontSize: '18px',
          fontWeight: 'bold',
          color: '#374151',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 0
        }}
        onClick={() => map.zoomOut()}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
        title="Zoom out"
      >
        −
      </button>
    </div>
  );
};

export default CustomZoomControl; 