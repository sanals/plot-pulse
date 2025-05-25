package com.company.project.controller;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
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
     * Get all plots with pagination
     */
    @GetMapping
    public ResponseEntity<List<PlotDto>> getAllPlots(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<PlotDto> plotPage = plotService.getAllPlots(pageable);
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
     */
    @PostMapping
    public ResponseEntity<PlotDto> createPlot(@RequestBody PlotDto plotDto) {
        PlotDto createdPlot = plotService.createPlot(plotDto);
        return ResponseEntity.ok(createdPlot);
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
     */
    @PostMapping("/nearest")
    public ResponseEntity<PlotDto> getNearestPlot(@RequestBody NearestPlotRequestDto request) {
        PlotDto nearestPlot = plotService.getNearestPlot(
                request.getLatitude(), 
                request.getLongitude(), 
                request.getRadius());
        
        return ResponseEntity.ok(nearestPlot);
    }

    /**
     * Update an existing plot
     */
    @PutMapping("/{id}")
    public ResponseEntity<PlotDto> updatePlot(@PathVariable Long id, @RequestBody PlotDto plotDto) {
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