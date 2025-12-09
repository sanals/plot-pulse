package com.company.project.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
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
    
    @NotNull(message = "Name cannot be null")
    @Size(max = 150, message = "Name cannot exceed 150 characters")
    private String name;

    @NotNull(message = "Price unit cannot be null")
    @Size(max = 50, message = "Price unit cannot exceed 50 characters")
    private String priceUnit;
    
    private Boolean isForSale;
    
    @Size(max = 500, message = "Description cannot exceed 500 characters")
    private String description;
    
    @NotNull(message = "Latitude cannot be null")
    @DecimalMin(value = "-90.0", message = "Latitude must be between -90 and 90 degrees")
    @DecimalMax(value = "90.0", message = "Latitude must be between -90 and 90 degrees")
    private Double latitude;
    
    @NotNull(message = "Longitude cannot be null")
    @DecimalMin(value = "-180.0", message = "Longitude must be between -180 and 180 degrees")
    @DecimalMax(value = "180.0", message = "Longitude must be between -180 and 180 degrees")
    private Double longitude;
    
    private LocalDateTime createdAt;
    
    private LocalDateTime updatedAt;
    
    private Long userId;
} 