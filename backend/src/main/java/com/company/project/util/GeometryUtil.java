package com.company.project.util;

import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.PrecisionModel;

/**
 * Utility class for geometry operations
 */
public class GeometryUtil {
    
    // WGS84 coordinate system (standard for GPS/mapping)
    private static final int SRID = 4326;
    
    private static final GeometryFactory geometryFactory = new GeometryFactory(
            new PrecisionModel(), SRID);
    
    /**
     * Creates a Point geometry from latitude and longitude
     * 
     * @param latitude  the latitude
     * @param longitude the longitude
     * @return a Point geometry
     */
    public static Point createPoint(double latitude, double longitude) {
        // In PostGIS/JTS, points are ordered as (x,y) = (longitude, latitude)
        return geometryFactory.createPoint(new Coordinate(longitude, latitude));
    }
    
    /**
     * Calculate distance between two points in meters
     * 
     * @param lat1 first point latitude
     * @param lon1 first point longitude
     * @param lat2 second point latitude
     * @param lon2 second point longitude
     * @return distance in meters
     */
    public static double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
        final int R = 6371000; // Earth radius in meters
        
        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);
        
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
        
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        
        return R * c;
    }
    
    /**
     * Alias for calculateDistance to maintain backward compatibility with tests
     */
    public static double calculateDistanceInMeters(double lat1, double lon1, Double lat2, Double lon2) {
        return calculateDistance(lat1, lon1, lat2, lon2);
    }
    
    private GeometryUtil() {
        // Private constructor to prevent instantiation
    }
} 