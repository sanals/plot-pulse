package com.company.project.service;

import com.company.project.dto.PlotFeedbackDto;
import com.company.project.dto.request.MarkOutdatedRequest;
import com.company.project.dto.request.ReportPlotRequest;

/**
 * Service interface for plot feedback operations
 */
public interface PlotFeedbackService {
    
    /**
     * Mark a plot as outdated with optional price suggestion
     */
    PlotFeedbackDto markOutdated(MarkOutdatedRequest request);
    
    /**
     * Report a plot for removal
     */
    PlotFeedbackDto reportPlot(ReportPlotRequest request);
    
    /**
     * Get feedback counts for a plot (for admin/moderator use)
     */
    FeedbackCountsDto getFeedbackCounts(Long plotId);
    
    /**
     * DTO for feedback counts
     */
    record FeedbackCountsDto(
        long outdatedCount,
        long reportedCount,
        long priceSuggestionCount
    ) {}
}

