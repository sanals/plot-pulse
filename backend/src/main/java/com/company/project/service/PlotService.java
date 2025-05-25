package com.company.project.service;

import java.math.BigDecimal;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.company.project.dto.PlotDto;

/**
 * Service interface for plot-related operations
 */
public interface PlotService {

    /**
     * Get all plots with pagination
     */
    Page<PlotDto> getAllPlots(Pageable pageable);
    
    /**
     * Get all plots with pagination and filtering
     * 
     * @param pageable Pagination information
     * @param minPrice Minimum price filter (optional)
     * @param maxPrice Maximum price filter (optional)
     * @param isForSale Sale status filter (optional)
     * @return Page of plots matching the criteria
     */
    Page<PlotDto> getAllPlotsWithFilters(Pageable pageable, BigDecimal minPrice, BigDecimal maxPrice, Boolean isForSale);
    
    /**
     * Get a specific plot by ID
     */
    PlotDto getPlotById(Long id);
    
    /**
     * Create a new plot
     */
    PlotDto createPlot(PlotDto plotDto);
    
    /**
     * Update an existing plot
     */
    PlotDto updatePlot(Long id, PlotDto plotDto);
    
    /**
     * Delete a plot
     */
    void deletePlot(Long id);
    
    /**
     * Find plots within a bounding box
     */
    Page<PlotDto> getPlotsInBounds(Double minLat, Double maxLat, Double minLng, Double maxLng, Pageable pageable);
    
    /**
     * Find the nearest plot to a location
     */
    PlotDto getNearestPlot(Double latitude, Double longitude, Double radius);
} 