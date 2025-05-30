import React from 'react';

interface LocationIndicatorToggleProps {
  position?: 'topleft' | 'topright' | 'bottomleft' | 'bottomright';
  visible: boolean;
  onToggle: (visible: boolean) => void;
}

/**
 * Toggle control for showing/hiding the current location indicator
 */
const LocationIndicatorToggle: React.FC<LocationIndicatorToggleProps> = ({
  position = 'bottomright',
  visible,
  onToggle
}) => {
  const handleToggle = () => {
    onToggle(!visible);
  };
  
  const getIcon = () => {
    if (visible) {
      // Location visible icon
      return (
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          style={{ width: '20px', height: '20px' }}
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="1" />
          <line x1="12" y1="2" x2="12" y2="4" />
          <line x1="12" y1="20" x2="12" y2="22" />
          <line x1="4" y1="12" x2="2" y2="12" />
          <line x1="22" y1="12" x2="20" y2="12" />
        </svg>
      );
    } else {
      // Location hidden icon (location with slash)
      return (
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          style={{ width: '20px', height: '20px' }}
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="1" />
          <line x1="12" y1="2" x2="12" y2="4" />
          <line x1="12" y1="20" x2="12" y2="22" />
          <line x1="4" y1="12" x2="2" y2="12" />
          <line x1="22" y1="12" x2="20" y2="12" />
          <line x1="2" y1="2" x2="22" y2="22" />
        </svg>
      );
    }
  };
  
  const getTooltip = () => {
    return visible ? 'Hide location indicator' : 'Show location indicator';
  };
  
  return (
    <div 
      style={{ 
        position: 'absolute',
        top: position === 'topright' ? '160px' : (position === 'topleft' ? '16px' : 'auto'),
        right: position === 'topright' || position === 'bottomright' ? '16px' : 'auto',
        left: position === 'topleft' || position === 'bottomleft' ? '16px' : 'auto',
        bottom: position === 'bottomright' ? '130px' : (position === 'bottomleft' ? '16px' : 'auto'),
        zIndex: 1000
      }}
    >
      <button
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '6px',
          backgroundColor: visible ? '#3b82f6' : 'white',
          color: visible ? 'white' : '#374151',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 5px rgba(0,0,0,0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          outline: 'none'
        }}
        onClick={handleToggle}
        title={getTooltip()}
        aria-label={getTooltip()}
        onMouseEnter={(e) => {
          if (!visible) {
            e.currentTarget.style.backgroundColor = '#f3f4f6';
          } else {
            e.currentTarget.style.backgroundColor = '#2563eb';
          }
        }}
        onMouseLeave={(e) => {
          if (!visible) {
            e.currentTarget.style.backgroundColor = 'white';
          } else {
            e.currentTarget.style.backgroundColor = '#3b82f6';
          }
        }}
      >
        {getIcon()}
      </button>
    </div>
  );
};

export default LocationIndicatorToggle; 