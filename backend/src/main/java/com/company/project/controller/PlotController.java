package com.company.project.controller;

import java.math.BigDecimal;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.company.project.dto.NearestPlotRequestDto;
import com.company.project.dto.PlotDto;
import com.company.project.service.PlotService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/**
 * Controller for plot-related operations
 */
@RestController
@RequestMapping("/plots")
@RequiredArgsConstructor
public class PlotController {

    private final PlotService plotService;

    /**
     * Get all plots with pagination and filtering
     * 
     * @param page Page number (default: 0)
     * @param size Page size (default: 10)
     * @param minPrice Minimum price filter (optional)
     * @param maxPrice Maximum price filter (optional)
     * @param isForSale Sale status filter (optional)
     * @return List of plots matching the criteria
     */
    @GetMapping
    public ResponseEntity<List<PlotDto>> getAllPlots(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false) Boolean isForSale) {
        
        Pageable pageable = PageRequest.of(page, size);
        
        // If no filters are provided, use the basic method, otherwise use filtering
        Page<PlotDto> plotPage;
        if (minPrice == null && maxPrice == null && isForSale == null) {
            plotPage = plotService.getAllPlots(pageable);
        } else {
            plotPage = plotService.getAllPlotsWithFilters(pageable, minPrice, maxPrice, isForSale);
        }
        
        return ResponseEntity.ok(plotPage.getContent());
    }

    /**
     * Get a specific plot by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<PlotDto> getPlotById(@PathVariable Long id) {
        PlotDto plot = plotService.getPlotById(id);
        return ResponseEntity.ok(plot);
    }

    /**
     * Create a new plot
     * 
     * @param plotDto Plot data to create
     * @return Created plot with generated ID
     */
    @PostMapping
    public ResponseEntity<PlotDto> createPlot(@Valid @RequestBody PlotDto plotDto) {
        PlotDto createdPlot = plotService.createPlot(plotDto);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdPlot);
    }

    /**
     * Find plots within a bounding box
     */
    @GetMapping("/bounds")
    public ResponseEntity<List<PlotDto>> getPlotsInBounds(
            @RequestParam Double minLat,
            @RequestParam Double maxLat,
            @RequestParam Double minLng,
            @RequestParam Double maxLng,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        Pageable pageable = PageRequest.of(page, size);
        Page<PlotDto> plotPage = plotService.getPlotsInBounds(minLat, maxLat, minLng, maxLng, pageable);
        return ResponseEntity.ok(plotPage.getContent());
    }

    /**
     * Find the nearest plot to a location
     * 
     * @param lat Latitude coordinate
     * @param lon Longitude coordinate  
     * @param radius Search radius in meters (optional, default: 1000)
     * @return Nearest plot or 404 if none found
     */
    @GetMapping("/nearest")
    public ResponseEntity<PlotDto> getNearestPlot(
            @RequestParam Double lat,
            @RequestParam Double lon,
            @RequestParam(defaultValue = "1000") Double radius) {
        
        PlotDto nearestPlot = plotService.getNearestPlot(lat, lon, radius);
        
        if (nearestPlot == null) {
            return ResponseEntity.notFound().build();
        }
        
        return ResponseEntity.ok(nearestPlot);
    }

    /**
     * Update an existing plot
     * 
     * @param id Plot ID to update
     * @param plotDto Updated plot data
     * @return Updated plot
     */
    @PutMapping("/{id}")
    public ResponseEntity<PlotDto> updatePlot(@PathVariable Long id, @Valid @RequestBody PlotDto plotDto) {
        PlotDto updatedPlot = plotService.updatePlot(id, plotDto);
        return ResponseEntity.ok(updatedPlot);
    }

    /**
     * Delete a plot
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePlot(@PathVariable Long id) {
        plotService.deletePlot(id);
        return ResponseEntity.noContent().build();
    }
} 