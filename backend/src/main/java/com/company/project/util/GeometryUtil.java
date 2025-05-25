package com.company.project.util;

import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.PrecisionModel;

import com.company.project.exception.InvalidCoordinateException;

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
     * @throws InvalidCoordinateException if coordinates are out of valid range
     */
    public static Point createPoint(double latitude, double longitude) {
        validateCoordinates(latitude, longitude);
        // In PostGIS/JTS, points are ordered as (x,y) = (longitude, latitude)
        return geometryFactory.createPoint(new Coordinate(longitude, latitude));
    }
    
    /**
     * Validates that coordinates are within valid ranges
     * 
     * @param latitude  the latitude (-90 to 90)
     * @param longitude the longitude (-180 to 180)
     * @throws InvalidCoordinateException if coordinates are out of valid range
     */
    public static void validateCoordinates(double latitude, double longitude) {
        if (latitude < -90.0 || latitude > 90.0) {
            throw new InvalidCoordinateException(latitude, longitude);
        }
        if (longitude < -180.0 || longitude > 180.0) {
            throw new InvalidCoordinateException(latitude, longitude);
        }
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