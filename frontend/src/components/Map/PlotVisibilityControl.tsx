import { useState } from 'react';

interface PlotVisibilityControlProps {
  position?: 'topleft' | 'topright' | 'bottomleft' | 'bottomright';
  visible: boolean;
  onToggle: (visible: boolean) => void;
}

const PlotVisibilityControl: React.FC<PlotVisibilityControlProps> = ({
  position = 'topright',
  visible,
  onToggle
}) => {
  const handleToggle = () => {
    onToggle(!visible);
  };
  
  const getPositionClass = () => {
    switch(position) {
      case 'topright': return 'top-16 right-4'; // Below layer control
      case 'topleft': return 'top-4 left-4';
      case 'bottomright': return 'bottom-32 right-4'; // Above locate control
      case 'bottomleft': return 'bottom-20 left-4';
      default: return 'top-16 right-4';
    }
  };
  
  return (
    <div 
      style={{ 
        position: 'absolute',
        top: position === 'topright' ? '72px' : (position === 'topleft' ? '16px' : 'auto'),
        right: position === 'topright' || position === 'bottomright' ? '16px' : 'auto',
        left: position === 'topleft' || position === 'bottomleft' ? '16px' : 'auto',
        bottom: position === 'bottomright' ? '128px' : (position === 'bottomleft' ? '80px' : 'auto'),
        backgroundColor: 'white',
        borderRadius: '6px',
        boxShadow: '0 1px 5px rgba(0,0,0,0.4)',
        zIndex: 999,
        border: '1px solid #e2e8f0'
      }}
    >
      <button 
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '8px 12px',
          fontSize: '14px',
          fontWeight: '500',
          color: '#374151',
          backgroundColor: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer'
        }}
        onClick={handleToggle}
        title={visible ? 'Hide all plots' : 'Show all plots'}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          width="16"
          height="16"
          style={{ marginRight: '8px' }}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {visible ? (
            <>
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </>
          ) : (
            <>
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
              <line x1="1" y1="1" x2="23" y2="23" />
            </>
          )}
        </svg>
        <span>{visible ? 'Plots Visible' : 'Plots Hidden'}</span>
      </button>
    </div>
  );
};

export default PlotVisibilityControl; 