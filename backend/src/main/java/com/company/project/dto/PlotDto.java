package com.company.project.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Data Transfer Object for Plot information
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlotDto {

    private Long id;
    
    @NotNull(message = "Price cannot be null")
    @PositiveOrZero(message = "Price must be zero or positive")
    private BigDecimal price;
    
    private Boolean isForSale;
    
    private String description;
    
    @NotNull(message = "Latitude cannot be null")
    private Double latitude;
    
    @NotNull(message = "Longitude cannot be null")
    private Double longitude;
    
    private LocalDateTime createdAt;
    
    private LocalDateTime updatedAt;
    
    private Long userId;
} 