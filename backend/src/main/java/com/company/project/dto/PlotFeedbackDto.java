package com.company.project.dto;

import com.company.project.entity.PlotFeedback;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * DTO for PlotFeedback
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlotFeedbackDto {
    private Long id;
    private Long plotId;
    private Long userId;
    private PlotFeedback.FeedbackType feedbackType;
    private BigDecimal suggestedPrice;
    private String suggestedPriceUnit;
    private String comment;
    private LocalDateTime createdAt;
}

