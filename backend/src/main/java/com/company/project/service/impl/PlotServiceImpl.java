package com.company.project.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Primary;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.company.project.dto.PlotDto;
import com.company.project.dto.PlotMapper;
import com.company.project.entity.Plot;
import com.company.project.repository.PlotRepository;
import com.company.project.service.PlotService;
import com.company.project.exception.DuplicateLocationException;
import com.company.project.exception.PlotNotFoundException;

import java.math.BigDecimal;

/**
 * Database-backed implementation of the PlotService
 * Uses PlotRepository for persistence and PlotMapper for DTO conversion
 */
@Service
@Primary
@RequiredArgsConstructor
@Slf4j
@Transactional
public class PlotServiceImpl implements PlotService {

    private final PlotRepository plotRepository;
    private final PlotMapper plotMapper;

    @Override
    @Transactional(readOnly = true)
    public Page<PlotDto> getAllPlots(Pageable pageable) {
        log.debug("Fetching all plots with pagination: page={}, size={}", pageable.getPageNumber(), pageable.getPageSize());
        Page<Plot> plotPage = plotRepository.findAll(pageable);
        log.debug("Found {} plots", plotPage.getTotalElements());
        return plotPage.map(plotMapper::toDto);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<PlotDto> getAllPlotsWithFilters(Pageable pageable, BigDecimal minPrice, BigDecimal maxPrice, Boolean isForSale) {
        log.debug("Fetching plots with filters: page={}, size={}, minPrice={}, maxPrice={}, isForSale={}", 
                pageable.getPageNumber(), pageable.getPageSize(), minPrice, maxPrice, isForSale);
        
        Page<Plot> plotPage = plotRepository.findPlotsWithFilters(pageable, minPrice, maxPrice, isForSale);
        log.debug("Found {} plots with filters", plotPage.getTotalElements());
        
        return plotPage.map(plotMapper::toDto);
    }

    @Override
    @Transactional(readOnly = true)
    public PlotDto getPlotById(Long id) {
        log.debug("Fetching plot with ID: {}", id);
        Plot plot = plotRepository.findById(id)
                .orElseThrow(() -> new PlotNotFoundException(id));
        return plotMapper.toDto(plot);
    }

    @Override
    public PlotDto createPlot(PlotDto plotDto) {
        log.debug("Creating new plot: lat={}, lng={}, price={}", 
                plotDto.getLatitude(), plotDto.getLongitude(), plotDto.getPrice());
        
        // Check for duplicate locations within 10 meters
        double minDistance = 10.0; // meters
        if (plotRepository.existsPlotsWithinDistance(plotDto.getLatitude(), plotDto.getLongitude(), minDistance)) {
            log.warn("Attempted to create plot at duplicate location: lat={}, lng={}", 
                    plotDto.getLatitude(), plotDto.getLongitude());
            throw new DuplicateLocationException(plotDto.getLatitude(), plotDto.getLongitude(), minDistance);
        }
        
        Plot plot = plotMapper.toEntity(plotDto);
        Plot savedPlot = plotRepository.save(plot);
        
        log.info("Successfully created plot with ID: {}", savedPlot.getId());
        return plotMapper.toDto(savedPlot);
    }

    @Override
    public PlotDto updatePlot(Long id, PlotDto plotDto) {
        log.debug("Updating plot with ID: {}", id);
        
        Plot existingPlot = plotRepository.findById(id)
                .orElseThrow(() -> new PlotNotFoundException(id));
        
        // Check for duplicate locations within 10 meters (excluding current plot)
        if (plotDto.getLatitude() != null && plotDto.getLongitude() != null) {
            double minDistance = 10.0; // meters
            if (plotRepository.existsPlotsWithinDistanceExcluding(plotDto.getLatitude(), plotDto.getLongitude(), minDistance, id)) {
                log.warn("Attempted to update plot {} to duplicate location: lat={}, lng={}", 
                        id, plotDto.getLatitude(), plotDto.getLongitude());
                throw new DuplicateLocationException(plotDto.getLatitude(), plotDto.getLongitude(), minDistance);
            }
        }
        
        Plot updatedPlot = plotMapper.updateEntityFromDto(existingPlot, plotDto);
        Plot savedPlot = plotRepository.save(updatedPlot);
        
        log.info("Successfully updated plot with ID: {}", savedPlot.getId());
        return plotMapper.toDto(savedPlot);
    }

    @Override
    public void deletePlot(Long id) {
        log.debug("Deleting plot with ID: {}", id);
        
        if (!plotRepository.existsById(id)) {
            throw new PlotNotFoundException(id);
        }
        
        plotRepository.deleteById(id);
        log.info("Successfully deleted plot with ID: {}", id);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<PlotDto> getPlotsInBounds(Double minLat, Double maxLat, Double minLng, Double maxLng, Pageable pageable) {
        log.debug("Fetching plots within bounds: minLat={}, maxLat={}, minLng={}, maxLng={}", 
                minLat, maxLat, minLng, maxLng);
        
        Page<Plot> plotPage = plotRepository.findPlotsWithinBoundingBox(minLat, minLng, maxLat, maxLng, pageable);
        log.debug("Found {} plots within bounds", plotPage.getTotalElements());
        
        return plotPage.map(plotMapper::toDto);
    }

    @Override
    @Transactional(readOnly = true)
    public PlotDto getNearestPlot(Double latitude, Double longitude, Double radius) {
        log.debug("Finding nearest plot to lat={}, lng={} within radius={} meters", 
                latitude, longitude, radius);
        
        return plotRepository.findNearestPlot(latitude, longitude, radius)
                .map(plotMapper::toDto)
                .orElse(null);
    }
} 