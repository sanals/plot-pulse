package com.company.project.service.impl;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Random;
import java.util.stream.Collectors;

import org.springframework.context.annotation.Primary;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.company.project.dto.PlotDto;
import com.company.project.service.PlotService;

import lombok.extern.slf4j.Slf4j;

/**
 * Default implementation of the PlotService
 * Uses mock data since we don't have a real database yet
 */
@Service
@Primary
@Slf4j
public class PlotServiceImpl implements PlotService {

    private final List<PlotDto> mockPlots = new ArrayList<>();
    private final Random random = new Random();
    
    // Initialize with mock data
    public PlotServiceImpl() {
        initializeMockData();
    }
    
    private void initializeMockData() {
        // London area
        double centerLat = 51.505;
        double centerLng = -0.09;
        
        // Generate 30 random plots around London
        for (int i = 0; i < 30; i++) {
            long id = i + 1;
            BigDecimal price = new BigDecimal(random.nextInt(900000) + 100000);
            boolean isForSale = random.nextBoolean();
            
            // Random offset from center (within ~2km)
            double latOffset = (random.nextDouble() - 0.5) * 0.04;
            double lngOffset = (random.nextDouble() - 0.5) * 0.06;
            
            mockPlots.add(PlotDto.builder()
                    .id(id)
                    .price(price)
                    .isForSale(isForSale)
                    .description("Mock plot #" + id + " in London area" + (isForSale ? " (For Sale)" : ""))
                    .latitude(centerLat + latOffset)
                    .longitude(centerLng + lngOffset)
                    .createdAt(LocalDateTime.now().minusDays(random.nextInt(30)))
                    .updatedAt(LocalDateTime.now().minusDays(random.nextInt(7)))
                    .build());
        }
    }

    @Override
    public Page<PlotDto> getAllPlots(Pageable pageable) {
        int start = (int) pageable.getOffset();
        int end = Math.min((start + pageable.getPageSize()), mockPlots.size());
        
        if (start >= mockPlots.size()) {
            return new PageImpl<>(new ArrayList<>(), pageable, mockPlots.size());
        }
        
        List<PlotDto> pageContent = mockPlots.subList(start, end);
        return new PageImpl<>(pageContent, pageable, mockPlots.size());
    }

    @Override
    public PlotDto getPlotById(Long id) {
        return mockPlots.stream()
                .filter(plot -> plot.getId().equals(id))
                .findFirst()
                .orElseThrow(() -> new NoSuchElementException("Plot not found with ID: " + id));
    }

    @Override
    public PlotDto createPlot(PlotDto plotDto) {
        // Generate a new ID for the plot
        long newId = mockPlots.stream()
                .mapToLong(PlotDto::getId)
                .max()
                .orElse(0) + 1;
        
        // Create a new plot with the generated ID and current timestamps
        PlotDto newPlot = PlotDto.builder()
                .id(newId)
                .price(plotDto.getPrice())
                .isForSale(plotDto.getIsForSale())
                .description(plotDto.getDescription())
                .latitude(plotDto.getLatitude())
                .longitude(plotDto.getLongitude())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
        
        mockPlots.add(newPlot);
        return newPlot;
    }

    @Override
    public PlotDto updatePlot(Long id, PlotDto plotDto) {
        PlotDto existingPlot = getPlotById(id);
        int index = mockPlots.indexOf(existingPlot);
        
        // Update the existing plot with new values
        PlotDto updatedPlot = PlotDto.builder()
                .id(id)
                .price(plotDto.getPrice())
                .isForSale(plotDto.getIsForSale())
                .description(plotDto.getDescription())
                .latitude(plotDto.getLatitude())
                .longitude(plotDto.getLongitude())
                .createdAt(existingPlot.getCreatedAt())
                .updatedAt(LocalDateTime.now())
                .build();
        
        mockPlots.set(index, updatedPlot);
        return updatedPlot;
    }

    @Override
    public void deletePlot(Long id) {
        PlotDto plotToDelete = getPlotById(id);
        mockPlots.remove(plotToDelete);
    }

    @Override
    public Page<PlotDto> getPlotsInBounds(Double minLat, Double maxLat, Double minLng, Double maxLng, Pageable pageable) {
        List<PlotDto> filteredPlots = mockPlots.stream()
                .filter(plot -> 
                    plot.getLatitude() >= minLat && 
                    plot.getLatitude() <= maxLat && 
                    plot.getLongitude() >= minLng && 
                    plot.getLongitude() <= maxLng)
                .collect(Collectors.toList());
        
        int start = (int) pageable.getOffset();
        int end = Math.min((start + pageable.getPageSize()), filteredPlots.size());
        
        if (start >= filteredPlots.size()) {
            return new PageImpl<>(new ArrayList<>(), pageable, filteredPlots.size());
        }
        
        List<PlotDto> pageContent = filteredPlots.subList(start, end);
        return new PageImpl<>(pageContent, pageable, filteredPlots.size());
    }

    @Override
    public PlotDto getNearestPlot(Double latitude, Double longitude, Double radius) {
        return mockPlots.stream()
                .filter(plot -> calculateDistance(latitude, longitude, plot.getLatitude(), plot.getLongitude()) <= radius)
                .min((p1, p2) -> {
                    double d1 = calculateDistance(latitude, longitude, p1.getLatitude(), p1.getLongitude());
                    double d2 = calculateDistance(latitude, longitude, p2.getLatitude(), p2.getLongitude());
                    return Double.compare(d1, d2);
                })
                .orElse(null);
    }
    
    // Haversine formula for calculating distances between coordinates
    private double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
        final double R = 6371000; // Radius of the earth in meters
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c; // Distance in meters
    }
} 