package com.company.project.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Data Transfer Object for nearest plot search request
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NearestPlotRequestDto {

    @NotNull(message = "Latitude cannot be null")
    private Double latitude;
    
    @NotNull(message = "Longitude cannot be null")
    private Double longitude;
    
    @NotNull(message = "Radius cannot be null")
    @Positive(message = "Radius must be positive")
    private Double radius;
} 