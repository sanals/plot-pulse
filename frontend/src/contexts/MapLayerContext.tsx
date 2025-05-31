import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

export type MapLayerType = 'Standard' | 'Satellite' | 'Topo';

interface MapLayerContextType {
  activeLayer: MapLayerType;
  setActiveLayer: (layer: MapLayerType) => void;
  isSatelliteMode: boolean;
}

const MapLayerContext = createContext<MapLayerContextType | undefined>(undefined);

interface MapLayerProviderProps {
  children: ReactNode;
}

export const MapLayerProvider: React.FC<MapLayerProviderProps> = ({ children }) => {
  const [activeLayer, setActiveLayer] = useState<MapLayerType>('Standard');

  const isSatelliteMode = activeLayer === 'Satellite';

  return (
    <MapLayerContext.Provider value={{
      activeLayer,
      setActiveLayer,
      isSatelliteMode
    }}>
      {children}
    </MapLayerContext.Provider>
  );
};

export const useMapLayer = (): MapLayerContextType => {
  const context = useContext(MapLayerContext);
  if (context === undefined) {
    throw new Error('useMapLayer must be used within a MapLayerProvider');
  }
  return context;
}; 