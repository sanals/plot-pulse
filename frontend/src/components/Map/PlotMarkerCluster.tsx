import React, { useMemo, useEffect, useRef, useCallback } from 'react';
import MarkerClusterGroup from 'react-leaflet-cluster';
import PlotMarker, { type MarkerDisplayMode } from './PlotMarker';
import type { PlotDto } from '../../types/plot.types';
import { convertToPricePerSqft, convertToPreferredAreaUnit, formatDisplayPrice } from '../../utils/priceConversions';
import { useSettings } from '../../contexts/SettingsContext';

interface PlotMarkerClusterProps {
  plots: PlotDto[];
  mode: MarkerDisplayMode;
  onPlotDeleted?: () => void;
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
  mode,
  onPlotDeleted,
  visible
}) => {
  const clusterGroupRef = useRef<any>(null);
  const { currency, areaUnit } = useSettings();

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

  // Helper function to find plot by coordinates with fallback precision levels
  const findPlotByCoordinates = useCallback((lat: number, lng: number): PlotDto | undefined => {
    // Try high precision first
    let plot = plots.find(p => 
      Math.abs(p.latitude - lat) < 0.000001 && 
      Math.abs(p.longitude - lng) < 0.000001
    );
    
    // Fallback to lower precision for floating point errors
    if (!plot) {
      plot = plots.find(p => 
        Math.abs(p.latitude - lat) < 0.00001 && 
        Math.abs(p.longitude - lng) < 0.00001
      );
    }
    
    return plot;
  }, [plots]);

  // Custom cluster icon creation with improved plot data matching
  const createClusterCustomIcon = useMemo(() => (cluster: any) => {
    const count = cluster.getChildCount();
    let className = 'cluster-small';
    
    if (count >= 100) {
      className = 'cluster-large';
    } else if (count >= 10) {
      className = 'cluster-medium';
    }

    // If in text mode, show average price in preferred area unit instead of count
    if (mode === 'text') {
      const markers = cluster.getAllChildMarkers();
      let totalPriceInPreferredUnit = 0;
      let validPrices = 0;
      
      // Calculate average price in preferred area unit from the cluster markers
      markers.forEach((marker: any) => {
        let plot: PlotDto | undefined;
        
        // Try to get plot ID from marker options first
        const plotId = marker.options?.plotId;
        if (plotId) {
          plot = plots.find(p => p.id === plotId);
        }
        
        // If no plotId or plot not found, try coordinate matching
        if (!plot) {
          const lat = marker.getLatLng().lat;
          const lng = marker.getLatLng().lng;
          plot = findPlotByCoordinates(lat, lng);
        }
        
        if (plot && plot.price > 0) {
          // Convert to user's preferred area unit
          const { price: convertedPrice } = convertToPreferredAreaUnit(
            plot.price,
            plot.priceUnit || 'per_sqft',
            areaUnit
          );
          totalPriceInPreferredUnit += convertedPrice;
          validPrices++;
        }
      });
      
      const avgPriceInPreferredUnit = validPrices > 0 ? totalPriceInPreferredUnit / validPrices : 0;
      
      if (avgPriceInPreferredUnit > 0) {
        // Use centralized formatting for cluster average price
        // Create a dummy plot object to use formatDisplayPrice
        const displayPrice = formatDisplayPrice(
          avgPriceInPreferredUnit,
          areaUnit === 'sqft' ? 'per_sqft' : 
          areaUnit === 'sqm' ? 'per_sqm' :
          areaUnit === 'cent' ? 'per_cent' : 'per_acre',
          currency,
          areaUnit
        );
        
        // Debug logging removed for performance
        // console.log('🏘️ Cluster price display:', { avgPriceInPreferredUnit, currency, areaUnit, displayPrice, count });
        
        return new (window as any).L.DivIcon({
          html: `<div class="${className} cluster-price">
                   <div class="price-main">${displayPrice}</div>
                   <div class="price-count">${count} plots</div>
                 </div>`,
          className: 'custom-marker-cluster price-cluster',
          iconSize: null,
        });
      } else {
        // Fallback to regular count display when no valid prices found
        return new (window as any).L.DivIcon({
          html: `<div class="${className}"><span>${count}</span></div>`,
          className: 'custom-marker-cluster',
          iconSize: new (window as any).L.Point(40, 40, true),
        });
      }
    }

    return new (window as any).L.DivIcon({
      html: `<div class="${className}"><span>${count}</span></div>`,
      className: 'custom-marker-cluster',
      iconSize: new (window as any).L.Point(40, 40, true),
    });
  }, [mode, plots, findPlotByCoordinates, currency, areaUnit]);

  // Force cluster refresh when plots change
  useEffect(() => {
    if (clusterGroupRef.current?.refreshClusters) {
      const timeoutId = setTimeout(() => {
        clusterGroupRef.current.refreshClusters();
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [plots, mode, currency, areaUnit]);

  // Add smooth animations for map interactions
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
      ref={clusterGroupRef}
      key={`cluster-${mode}-${plots.length}-${currency}-${areaUnit}`}
      {...clusterOptions}
      iconCreateFunction={createClusterCustomIcon}
    >
      {visiblePlots.map((plot) => (
        <PlotMarker
          key={`plot-${plot.id}`}
          plot={plot}
          mode={mode}
          onPlotDeleted={onPlotDeleted}
        />
      ))}
    </MarkerClusterGroup>
  );
});

PlotMarkerCluster.displayName = 'PlotMarkerCluster';

export default PlotMarkerCluster; 