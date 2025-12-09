package com.company.project.exception;

/**
 * Exception thrown when a user attempts to modify or delete a plot
 * that they do not own
 */
public class PlotOwnershipException extends RuntimeException {
    
    private final Long plotId;
    private final Long userId;

    public PlotOwnershipException(Long plotId, Long userId) {
        super(String.format("User %d does not have permission to modify plot %d", userId, plotId));
        this.plotId = plotId;
        this.userId = userId;
    }

    public PlotOwnershipException(Long plotId) {
        super(String.format("User does not have permission to modify plot %d", plotId));
        this.plotId = plotId;
        this.userId = null;
    }

    public Long getPlotId() {
        return plotId;
    }

    public Long getUserId() {
        return userId;
    }
}

