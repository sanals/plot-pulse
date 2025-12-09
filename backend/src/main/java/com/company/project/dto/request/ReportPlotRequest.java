package com.company.project.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for reporting a plot for removal
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReportPlotRequest {
    
    @NotNull(message = "Plot ID is required")
    private Long plotId;
    
    /**
     * Optional reason for reporting
     */
    private String reason;
}

