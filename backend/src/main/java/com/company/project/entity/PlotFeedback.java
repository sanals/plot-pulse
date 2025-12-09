package com.company.project.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Entity representing user feedback on plots
 * Tracks reports, outdated flags, and price suggestions
 */
@Entity
@Table(name = "plot_feedback", indexes = {
    @Index(name = "idx_plot_feedback_plot_id", columnList = "plot_id"),
    @Index(name = "idx_plot_feedback_user_id", columnList = "user_id"),
    @Index(name = "idx_plot_feedback_type", columnList = "feedback_type")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlotFeedback {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * The plot this feedback is about
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "plot_id", nullable = false)
    private Plot plot;

    /**
     * The user who submitted this feedback (null for anonymous)
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    /**
     * Type of feedback: OUTDATED, REPORTED, PRICE_SUGGESTION
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "feedback_type", nullable = false, length = 50)
    private FeedbackType feedbackType;

    /**
     * Suggested price (for OUTDATED or PRICE_SUGGESTION types)
     */
    @Column(name = "suggested_price", precision = 19, scale = 2)
    private BigDecimal suggestedPrice;

    /**
     * Suggested price unit (for OUTDATED or PRICE_SUGGESTION types)
     */
    @Column(name = "suggested_price_unit", length = 50)
    private String suggestedPriceUnit;

    /**
     * Optional comment/reason for the feedback
     */
    @Column(name = "comment", length = 500)
    private String comment;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /**
     * Feedback types
     */
    public enum FeedbackType {
        OUTDATED,        // Plot price is outdated
        REPORTED,        // Plot should be removed
        PRICE_SUGGESTION // Suggest a new price
    }
}

