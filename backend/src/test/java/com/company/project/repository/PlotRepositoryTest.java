package com.company.project.repository;

import com.company.project.entity.Plot;
import com.company.project.util.GeometryUtil;
import org.junit.jupiter.api.Test;
import org.locationtech.jts.geom.Point;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import org.springframework.test.context.TestPropertySource;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Tests for the PlotRepository with PostGIS spatial queries
 * This test requires a PostgreSQL database with PostGIS extension
 */
@DataJpaTest

@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@TestPropertySource(properties = {
    "spring.datasource.url=jdbc:postgresql://localhost:5432/plotpulse",
    "spring.jpa.database-platform=org.hibernate.dialect.PostgreSQLDialect"
})
public class PlotRepositoryTest {

    @Autowired
    private PlotRepository plotRepository;
    
    @Test
    public void shouldSavePlotWithLocation() {
        // Given
        Plot plot = new Plot();
        plot.setPrice(new BigDecimal("100000.00"));
        plot.setIsForSale(true);
        plot.setDescription("Test plot with location");
        
        // Create a point at Central Park, NY
        double latitude = 40.785091;
        double longitude = -73.968285;
        plot.setLocation(GeometryUtil.createPoint(latitude, longitude));
        plot.setLatitude(latitude);
        plot.setLongitude(longitude);
        
        // When
        Plot savedPlot = plotRepository.save(plot);
        
        // Then
        assertThat(savedPlot).isNotNull();
        assertThat(savedPlot.getId()).isNotNull();
        assertThat(savedPlot.getLocation() != null).isTrue();
        assertThat(savedPlot.getLatitude()).isEqualTo(latitude);
        assertThat(savedPlot.getLongitude()).isEqualTo(longitude);
    }
    
    @Test
    public void shouldFindPlotsWithinDistance() {
        // Given
        setupTestPlots();
        
        // Central Park, NY
        double latitude = 40.785091;
        double longitude = -73.968285;
        double distanceInMeters = 5000; // 5km radius
        
        // When
        List<Plot> plots = plotRepository.findPlotsWithinDistance(longitude, latitude, distanceInMeters);
        
        // Then
        assertThat(plots).isNotEmpty();
        
        // All plots should be within the specified distance
        for (Plot plot : plots) {
            double distance = GeometryUtil.calculateDistanceInMeters(
                latitude, longitude, plot.getLatitude(), plot.getLongitude());
            assertThat(distance).isLessThanOrEqualTo(distanceInMeters);
        }
    }
    
    @Test
    public void shouldFindNearestPlot() {
        // Given
        setupTestPlots();
        
        // Times Square, NY
        double latitude = 40.758896;
        double longitude = -73.985130;
        double radiusInMeters = 10000; // 10km
        
        // When
        Optional<Plot> nearestPlotOpt = plotRepository.findNearestPlot(latitude, longitude, radiusInMeters);
        
        // Then
        assertThat(nearestPlotOpt).isPresent();
        
        Plot nearestPlot = nearestPlotOpt.get();
        double distanceToNearest = GeometryUtil.calculateDistanceInMeters(
            latitude, longitude, nearestPlot.getLatitude(), nearestPlot.getLongitude());
            
        // Check that no other plot is closer
        List<Plot> allPlots = plotRepository.findAll();
        for (Plot plot : allPlots) {
            if (!plot.getId().equals(nearestPlot.getId())) {
                double distanceToPlot = GeometryUtil.calculateDistanceInMeters(
                    latitude, longitude, plot.getLatitude(), plot.getLongitude());
                assertThat(distanceToNearest).isLessThanOrEqualTo(distanceToPlot);
            }
        }
    }
    
    /**
     * Helper method to set up test plots with various locations
     */
    private void setupTestPlots() {
        // Clear any existing data
        plotRepository.deleteAll();
        
        // Create several plots at different locations in NYC
        
        // Central Park
        createTestPlot(40.785091, -73.968285, new BigDecimal("1000000.00"), "Central Park plot");
        
        // Times Square
        createTestPlot(40.758896, -73.985130, new BigDecimal("2000000.00"), "Times Square plot");
        
        // Brooklyn
        createTestPlot(40.650002, -73.949997, new BigDecimal("800000.00"), "Brooklyn plot");
        
        // Queens
        createTestPlot(40.742054, -73.769417, new BigDecimal("750000.00"), "Queens plot");
    }
    
    private Plot createTestPlot(double latitude, double longitude, BigDecimal price, String description) {
        Plot plot = new Plot();
        plot.setPrice(price);
        plot.setIsForSale(true);
        plot.setDescription(description);
        plot.setLocation(GeometryUtil.createPoint(latitude, longitude));
        plot.setLatitude(latitude);
        plot.setLongitude(longitude);
        
        return plotRepository.save(plot);
    }
} 