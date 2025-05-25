package com.company.project.exception;

/**
 * Exception thrown when coordinates are invalid
 */
public class InvalidCoordinateException extends RuntimeException {
    
    public InvalidCoordinateException(String message) {
        super(message);
    }
    
    public InvalidCoordinateException(double latitude, double longitude) {
        super(String.format("Invalid coordinates: latitude=%.6f (must be -90 to 90), longitude=%.6f (must be -180 to 180)", 
                latitude, longitude));
    }
} 