package com.company.project.controller;

import com.company.project.dto.PlotFeedbackDto;
import com.company.project.dto.request.MarkOutdatedRequest;
import com.company.project.dto.request.ReportPlotRequest;
import com.company.project.dto.response.ApiResponse;
import com.company.project.service.PlotFeedbackService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Controller for plot feedback operations
 * Allows users to mark plots as outdated, report plots, and suggest prices
 */
@RestController
@RequestMapping("/plots/feedback")
@RequiredArgsConstructor
public class PlotFeedbackController {

    private final PlotFeedbackService feedbackService;

    /**
     * Mark a plot as outdated with optional price suggestion
     * 
     * @param request Request containing plot ID and optional price suggestion
     * @return Created feedback
     */
    @PostMapping("/mark-outdated")
    public ResponseEntity<ApiResponse<PlotFeedbackDto>> markOutdated(
            @Valid @RequestBody MarkOutdatedRequest request) {
        PlotFeedbackDto feedback = feedbackService.markOutdated(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ApiResponse<>("SUCCESS", HttpStatus.CREATED.value(),
                        "Plot marked as outdated", feedback));
    }

    /**
     * Report a plot for removal
     * 
     * @param request Request containing plot ID and optional reason
     * @return Created feedback
     */
    @PostMapping("/report")
    public ResponseEntity<ApiResponse<PlotFeedbackDto>> reportPlot(
            @Valid @RequestBody ReportPlotRequest request) {
        PlotFeedbackDto feedback = feedbackService.reportPlot(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ApiResponse<>("SUCCESS", HttpStatus.CREATED.value(),
                        "Plot reported successfully", feedback));
    }

    /**
     * Get feedback counts for a plot (for admin/moderator use)
     * Currently returns counts but doesn't expose to regular users
     * 
     * @param plotId Plot ID
     * @return Feedback counts
     */
    @GetMapping("/{plotId}/counts")
    public ResponseEntity<ApiResponse<PlotFeedbackService.FeedbackCountsDto>> getFeedbackCounts(
            @PathVariable Long plotId) {
        PlotFeedbackService.FeedbackCountsDto counts = feedbackService.getFeedbackCounts(plotId);
        return ResponseEntity.ok(new ApiResponse<>("SUCCESS", HttpStatus.OK.value(),
                "Feedback counts retrieved", counts));
    }
}

