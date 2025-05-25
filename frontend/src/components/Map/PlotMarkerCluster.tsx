import React, { useMemo, useEffect } from 'react';
import MarkerClusterGroup from 'react-leaflet-cluster';
import PlotMarker from './PlotMarker';
import type { PlotDto } from '../../types/plot.types';

interface PlotMarkerClusterProps {
  plots: PlotDto[];
  onPlotUpdated?: () => void;
  onPlotDeleted?: () => void;
  onModalStateChange?: (isOpen: boolean) => void;
  visible: boolean;
}

/**
 * Optimized marker clustering component for plot visualization
 * 
 * Features:
 * - Automatic clustering for dense plot areas
 * - Custom cluster icons with plot counts
 * - Optimized rendering with React.memo
 * - Configurable cluster settings for performance
 */
const PlotMarkerCluster: React.FC<PlotMarkerClusterProps> = React.memo(({
  plots,
  onPlotUpdated,
  onPlotDeleted,
  onModalStateChange,
  visible
}) => {
  // Memoize cluster options for performance
  const clusterOptions = useMemo(() => ({
    chunkedLoading: true,
    chunkInterval: 200,
    chunkDelay: 50,
    maxClusterRadius: 80,
    spiderfyOnMaxZoom: true,
    showCoverageOnHover: false,
    zoomToBoundsOnClick: true,
    spiderfyDistanceMultiplier: 1.5,
    removeOutsideVisibleBounds: true,
    animate: true,
    animateAddingMarkers: false,
    disableClusteringAtZoom: 18,
  }), []);

  // Custom cluster icon creation
  const createClusterCustomIcon = useMemo(() => (cluster: any) => {
    const count = cluster.getChildCount();
    let className = 'cluster-small';
    
    if (count >= 100) {
      className = 'cluster-large';
    } else if (count >= 10) {
      className = 'cluster-medium';
    }

    return new (window as any).L.DivIcon({
      html: `<div class="${className}"><span>${count}</span></div>`,
      className: 'custom-marker-cluster',
      iconSize: new (window as any).L.Point(40, 40, true),
    });
  }, []);

  // Add a style to the document for smooth fade animations
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      .leaflet-marker-icon, 
      .leaflet-marker-shadow,
      .leaflet-pane {
        transition: opacity 0.3s ease-in-out;
      }
      .leaflet-fade-anim .leaflet-tile {
        transition: opacity 0.5s ease-in-out;
      }
      .leaflet-zoom-anim .leaflet-zoom-animated {
        transition: transform 0.3s ease-out;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Memoize filtered plots to avoid unnecessary re-renders
  const visiblePlots = useMemo(() => {
    return visible ? plots : [];
  }, [plots, visible]);

  if (!visible || visiblePlots.length === 0) {
    return null;
  }

  return (
    <MarkerClusterGroup
      {...clusterOptions}
      iconCreateFunction={createClusterCustomIcon}
    >
      {visiblePlots.map((plot) => (
        <PlotMarker
          key={`plot-${plot.id}`}
          plot={plot}
          onPlotUpdated={onPlotUpdated}
          onPlotDeleted={onPlotDeleted}
          onModalStateChange={onModalStateChange}
        />
      ))}
    </MarkerClusterGroup>
  );
});

PlotMarkerCluster.displayName = 'PlotMarkerCluster';

export default PlotMarkerCluster; 