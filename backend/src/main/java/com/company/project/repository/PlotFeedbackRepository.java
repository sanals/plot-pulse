package com.company.project.repository;

import com.company.project.entity.PlotFeedback;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for PlotFeedback entity
 */
@Repository
public interface PlotFeedbackRepository extends JpaRepository<PlotFeedback, Long> {

    /**
     * Find all feedback for a specific plot
     */
    List<PlotFeedback> findByPlotId(Long plotId);

    /**
     * Find feedback by plot and type
     */
    List<PlotFeedback> findByPlotIdAndFeedbackType(Long plotId, PlotFeedback.FeedbackType feedbackType);

    /**
     * Count feedback by plot and type
     */
    long countByPlotIdAndFeedbackType(Long plotId, PlotFeedback.FeedbackType feedbackType);

    /**
     * Check if user has already submitted feedback of a specific type for a plot
     */
    @Query("SELECT COUNT(f) > 0 FROM PlotFeedback f WHERE f.plot.id = :plotId AND f.user.id = :userId AND f.feedbackType = :feedbackType")
    boolean existsByPlotIdAndUserIdAndFeedbackType(
            @Param("plotId") Long plotId,
            @Param("userId") Long userId,
            @Param("feedbackType") PlotFeedback.FeedbackType feedbackType);

    /**
     * Find feedback by plot, user, and type
     */
    Optional<PlotFeedback> findByPlotIdAndUserIdAndFeedbackType(
            Long plotId,
            Long userId,
            PlotFeedback.FeedbackType feedbackType);
}

