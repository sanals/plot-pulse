package com.company.project.service.impl;

import com.company.project.dto.PlotFeedbackDto;
import com.company.project.dto.request.MarkOutdatedRequest;
import com.company.project.dto.request.ReportPlotRequest;
import com.company.project.entity.Plot;
import com.company.project.entity.PlotFeedback;
import com.company.project.entity.User;
import com.company.project.exception.PlotNotFoundException;
import com.company.project.repository.PlotFeedbackRepository;
import com.company.project.repository.PlotRepository;
import com.company.project.service.PlotFeedbackService;
import com.company.project.util.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Implementation of PlotFeedbackService
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class PlotFeedbackServiceImpl implements PlotFeedbackService {

    private final PlotFeedbackRepository feedbackRepository;
    private final PlotRepository plotRepository;
    private final SecurityUtils securityUtils;

    @Override
    public PlotFeedbackDto markOutdated(MarkOutdatedRequest request) {
        log.debug("Marking plot {} as outdated", request.getPlotId());
        
        Plot plot = plotRepository.findById(request.getPlotId())
                .orElseThrow(() -> new PlotNotFoundException(request.getPlotId()));
        
        // Get current user (optional - anonymous users can also mark as outdated)
        User currentUser = securityUtils.getCurrentUser().orElse(null);
        
        // Check if user already marked this plot as outdated (prevent duplicates)
        if (currentUser != null) {
            boolean alreadyExists = feedbackRepository.existsByPlotIdAndUserIdAndFeedbackType(
                    request.getPlotId(),
                    currentUser.getId(),
                    PlotFeedback.FeedbackType.OUTDATED);
            
            if (alreadyExists) {
                log.debug("User {} already marked plot {} as outdated", currentUser.getId(), request.getPlotId());
                // Return existing feedback
                PlotFeedback existing = feedbackRepository.findByPlotIdAndUserIdAndFeedbackType(
                        request.getPlotId(),
                        currentUser.getId(),
                        PlotFeedback.FeedbackType.OUTDATED)
                        .orElseThrow(() -> new IllegalStateException("Feedback exists but could not be retrieved"));
                return toDto(existing);
            }
        }
        
        PlotFeedback feedback = PlotFeedback.builder()
                .plot(plot)
                .user(currentUser)
                .feedbackType(PlotFeedback.FeedbackType.OUTDATED)
                .suggestedPrice(request.getSuggestedPrice())
                .suggestedPriceUnit(request.getSuggestedPriceUnit())
                .comment(request.getComment())
                .build();
        
        PlotFeedback saved = feedbackRepository.save(feedback);
        log.info("Plot {} marked as outdated by user {}", request.getPlotId(), 
                currentUser != null ? currentUser.getId() : "anonymous");
        
        return toDto(saved);
    }

    @Override
    public PlotFeedbackDto reportPlot(ReportPlotRequest request) {
        log.debug("Reporting plot {} for removal", request.getPlotId());
        
        Plot plot = plotRepository.findById(request.getPlotId())
                .orElseThrow(() -> new PlotNotFoundException(request.getPlotId()));
        
        // Get current user (optional - anonymous users can also report)
        User currentUser = securityUtils.getCurrentUser().orElse(null);
        
        // Check if user already reported this plot (prevent duplicates)
        if (currentUser != null) {
            boolean alreadyExists = feedbackRepository.existsByPlotIdAndUserIdAndFeedbackType(
                    request.getPlotId(),
                    currentUser.getId(),
                    PlotFeedback.FeedbackType.REPORTED);
            
            if (alreadyExists) {
                log.debug("User {} already reported plot {}", currentUser.getId(), request.getPlotId());
                // Return existing feedback
                PlotFeedback existing = feedbackRepository.findByPlotIdAndUserIdAndFeedbackType(
                        request.getPlotId(),
                        currentUser.getId(),
                        PlotFeedback.FeedbackType.REPORTED)
                        .orElseThrow(() -> new IllegalStateException("Feedback exists but could not be retrieved"));
                return toDto(existing);
            }
        }
        
        PlotFeedback feedback = PlotFeedback.builder()
                .plot(plot)
                .user(currentUser)
                .feedbackType(PlotFeedback.FeedbackType.REPORTED)
                .comment(request.getReason())
                .build();
        
        PlotFeedback saved = feedbackRepository.save(feedback);
        log.info("Plot {} reported by user {}", request.getPlotId(), 
                currentUser != null ? currentUser.getId() : "anonymous");
        
        return toDto(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public FeedbackCountsDto getFeedbackCounts(Long plotId) {
        long outdatedCount = feedbackRepository.countByPlotIdAndFeedbackType(
                plotId, PlotFeedback.FeedbackType.OUTDATED);
        long reportedCount = feedbackRepository.countByPlotIdAndFeedbackType(
                plotId, PlotFeedback.FeedbackType.REPORTED);
        long priceSuggestionCount = feedbackRepository.countByPlotIdAndFeedbackType(
                plotId, PlotFeedback.FeedbackType.PRICE_SUGGESTION);
        
        return new FeedbackCountsDto(outdatedCount, reportedCount, priceSuggestionCount);
    }

    private PlotFeedbackDto toDto(PlotFeedback feedback) {
        return PlotFeedbackDto.builder()
                .id(feedback.getId())
                .plotId(feedback.getPlot().getId())
                .userId(feedback.getUser() != null ? feedback.getUser().getId() : null)
                .feedbackType(feedback.getFeedbackType())
                .suggestedPrice(feedback.getSuggestedPrice())
                .suggestedPriceUnit(feedback.getSuggestedPriceUnit())
                .comment(feedback.getComment())
                .createdAt(feedback.getCreatedAt())
                .build();
    }
}

