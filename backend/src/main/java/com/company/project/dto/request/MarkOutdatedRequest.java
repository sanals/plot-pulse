package com.company.project.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Request DTO for marking a plot as outdated
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MarkOutdatedRequest {
    
    @NotNull(message = "Plot ID is required")
    private Long plotId;
    
    /**
     * Optional suggested price (if user knows the current price)
     */
    private BigDecimal suggestedPrice;
    
    /**
     * Optional price unit for suggested price
     */
    private String suggestedPriceUnit;
    
    /**
     * Optional comment explaining why it's outdated
     */
    private String comment;
}

