package com.company.project.exception;

/**
 * Exception thrown when attempting to create a plot at a location that already has a plot within the minimum distance
 */
public class DuplicateLocationException extends RuntimeException {
    
    public DuplicateLocationException(String message) {
        super(message);
    }
    
    public DuplicateLocationException(double latitude, double longitude, double minDistance) {
        super(String.format("A plot already exists within %.2f meters of location (%.6f, %.6f)", 
                minDistance, latitude, longitude));
    }
} 