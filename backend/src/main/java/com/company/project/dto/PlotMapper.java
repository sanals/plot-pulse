package com.company.project.dto;

import com.company.project.entity.Plot;
import com.company.project.entity.User;
import com.company.project.util.GeometryUtil;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Mapper for converting between Plot entities and DTOs
 */
@Component
public class PlotMapper {
    
    /**
     * Convert a Plot entity to a PlotDto
     *
     * @param plot The Plot entity
     * @return The PlotDto
     */
    public PlotDto toDto(Plot plot) {
        if (plot == null) {
            return null;
        }
        
        return PlotDto.builder()
                .id(plot.getId())
                .price(plot.getPrice())
                .isForSale(plot.getIsForSale())
                .description(plot.getDescription())
                .latitude(plot.getLatitude())
                .longitude(plot.getLongitude())
                .createdAt(plot.getCreatedAt())
                .updatedAt(plot.getUpdatedAt())
                .userId(plot.getUser() != null ? plot.getUser().getId() : null)
                .build();
    }
    
    /**
     * Convert a list of Plot entities to a list of PlotDtos
     *
     * @param plots The list of Plot entities
     * @return The list of PlotDtos
     */
    public List<PlotDto> toDtoList(List<Plot> plots) {
        return plots.stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }
    
    /**
     * Convert a PlotDto to a Plot entity
     *
     * @param plotDto The PlotDto
     * @return The Plot entity
     */
    public Plot toEntity(PlotDto plotDto) {
        if (plotDto == null) {
            return null;
        }
        
        Plot plot = new Plot();
        plot.setId(plotDto.getId());
        plot.setPrice(plotDto.getPrice());
        plot.setIsForSale(plotDto.getIsForSale());
        plot.setDescription(plotDto.getDescription());
        
        // Create a Point geometry from latitude and longitude
        plot.setLocation(GeometryUtil.createPoint(plotDto.getLatitude(), plotDto.getLongitude()));
        plot.setLatitude(plotDto.getLatitude());
        plot.setLongitude(plotDto.getLongitude());
        
        // Set user if userId is provided
        if (plotDto.getUserId() != null) {
            User user = new User();
            user.setId(plotDto.getUserId());
            plot.setUser(user);
        }
        
        return plot;
    }
    
    /**
     * Update a Plot entity with data from a PlotDto
     *
     * @param plot The Plot entity to update
     * @param plotDto The PlotDto with updated data
     * @return The updated Plot entity
     */
    public Plot updateEntityFromDto(Plot plot, PlotDto plotDto) {
        if (plot == null || plotDto == null) {
            return plot;
        }
        
        if (plotDto.getPrice() != null) {
            plot.setPrice(plotDto.getPrice());
        }
        
        if (plotDto.getIsForSale() != null) {
            plot.setIsForSale(plotDto.getIsForSale());
        }
        
        if (plotDto.getDescription() != null) {
            plot.setDescription(plotDto.getDescription());
        }
        
        // Update location if both latitude and longitude are provided
        if (plotDto.getLatitude() != null && plotDto.getLongitude() != null) {
            plot.setLocation(GeometryUtil.createPoint(plotDto.getLatitude(), plotDto.getLongitude()));
            plot.setLatitude(plotDto.getLatitude());
            plot.setLongitude(plotDto.getLongitude());
        }
        
        return plot;
    }
} 