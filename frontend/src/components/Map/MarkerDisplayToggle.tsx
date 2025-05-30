import React from 'react';
import { type MarkerDisplayMode } from './PlotMarker';

interface MarkerDisplayToggleProps {
  position?: 'topleft' | 'topright' | 'bottomleft' | 'bottomright';
  mode: MarkerDisplayMode;
  onModeChange: (mode: MarkerDisplayMode) => void;
}

const MarkerDisplayToggle: React.FC<MarkerDisplayToggleProps> = ({
  position = 'topright',
  mode,
  onModeChange
}) => {
  const modes: { value: MarkerDisplayMode; label: string; icon: string }[] = [
    { value: 'none', label: 'Hidden', icon: '🚫' },
    { value: 'icon', label: 'Icons', icon: '📍' },
    { value: 'text', label: 'Prices', icon: '₹' }
  ];

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
        border: '1px solid #e2e8f0',
        display: 'flex',
        overflow: 'hidden'
      }}
    >
      {modes.map((modeOption, index) => (
        <button
          key={modeOption.value}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '8px 12px',
            fontSize: '12px',
            fontWeight: '500',
            color: mode === modeOption.value ? '#1d4ed8' : '#374151',
            backgroundColor: mode === modeOption.value ? '#eff6ff' : 'white',
            border: 'none',
            borderRight: index < modes.length - 1 ? '1px solid #e2e8f0' : 'none',
            cursor: 'pointer',
            minWidth: '60px',
            transition: 'all 0.2s ease'
          }}
          onClick={() => onModeChange(modeOption.value)}
          title={`Show plots as ${modeOption.label.toLowerCase()}`}
          onMouseEnter={(e) => {
            if (mode !== modeOption.value) {
              e.currentTarget.style.backgroundColor = '#f9fafb';
            }
          }}
          onMouseLeave={(e) => {
            if (mode !== modeOption.value) {
              e.currentTarget.style.backgroundColor = 'white';
            }
          }}
        >
          <span style={{ fontSize: '16px', marginBottom: '2px' }}>
            {modeOption.icon}
          </span>
          <span style={{ fontSize: '10px' }}>
            {modeOption.label}
          </span>
        </button>
      ))}
    </div>
  );
};

export default MarkerDisplayToggle; 