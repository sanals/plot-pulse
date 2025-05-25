package com.company.project.exception;

/**
 * Exception thrown when a plot is not found
 */
public class PlotNotFoundException extends RuntimeException {
    
    public PlotNotFoundException(String message) {
        super(message);
    }
    
    public PlotNotFoundException(String message, Throwable cause) {
        super(message, cause);
    }
    
    public PlotNotFoundException(Long plotId) {
        super("Plot not found with ID: " + plotId);
    }
} 