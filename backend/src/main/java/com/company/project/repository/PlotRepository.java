package com.company.project.repository;

import com.company.project.entity.Plot;
import org.locationtech.jts.geom.Point;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

/**
 * Repository for the Plot entity with spatial query methods
 */
@Repository
public interface PlotRepository extends JpaRepository<Plot, Long> {
    
    /**
     * Find all plots within a specified distance of a point
     *
     * @param longitude The longitude coordinate
     * @param latitude The latitude coordinate
     * @param distanceInMeters The distance in meters
     * @return List of plots within the specified distance
     */
    @Query(value = "SELECT * FROM plots WHERE ST_Distance_Sphere(location, ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)) <= :distanceInMeters", nativeQuery = true)
    List<Plot> findPlotsWithinDistance(@Param("longitude") double longitude, @Param("latitude") double latitude, @Param("distanceInMeters") double distanceInMeters);
    
    /**
     * Find the nearest plot to a point within a specified distance
     *
     * @param point The geographic point (location)
     * @param distanceInMeters The maximum distance in meters
     * @return Optional containing the nearest plot, if one exists within the distance
     */
    @Query(value = "SELECT * FROM plots WHERE ST_Distance_Sphere(location, ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)) <= :distanceInMeters " +
            "ORDER BY ST_Distance_Sphere(location, ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)) LIMIT 1", nativeQuery = true)
    Optional<Plot> findNearestPlot(@Param("latitude") double latitude, @Param("longitude") double longitude, 
                                  @Param("distanceInMeters") double distanceInMeters);
    
    /**
     * Find all plots within a bounding box
     *
     * @param minLat Minimum latitude
     * @param minLng Minimum longitude
     * @param maxLat Maximum latitude
     * @param maxLng Maximum longitude
     * @param pageable Pagination information
     * @return Page of plots within the bounding box
     */
    @Query(value = "SELECT p FROM Plot p WHERE p.latitude BETWEEN :minLat AND :maxLat AND p.longitude BETWEEN :minLng AND :maxLng")
    Page<Plot> findPlotsWithinBoundingBox(
            @Param("minLat") double minLat,
            @Param("minLng") double minLng,
            @Param("maxLat") double maxLat,
            @Param("maxLng") double maxLng,
            Pageable pageable);
    
    /**
     * Find plots by user ID
     *
     * @param userId The user ID
     * @param pageable Pagination information
     * @return Page of plots owned by the user
     */
    Page<Plot> findByUserId(Long userId, Pageable pageable);
    
    /**
     * Find plots with optional filters
     *
     * @param pageable Pagination information
     * @param minPrice Minimum price filter (optional)
     * @param maxPrice Maximum price filter (optional)
     * @param isForSale Sale status filter (optional)
     * @return Page of plots matching the criteria
     */
    @Query("SELECT p FROM Plot p WHERE " +
           "(:minPrice IS NULL OR p.price >= :minPrice) AND " +
           "(:maxPrice IS NULL OR p.price <= :maxPrice) AND " +
           "(:isForSale IS NULL OR p.isForSale = :isForSale)")
    Page<Plot> findPlotsWithFilters(
            Pageable pageable,
            @Param("minPrice") BigDecimal minPrice,
            @Param("maxPrice") BigDecimal maxPrice,
            @Param("isForSale") Boolean isForSale);
    
    /**
     * Check if any plots exist within a specified distance of a location
     *
     * @param latitude The latitude coordinate
     * @param longitude The longitude coordinate
     * @param distanceInMeters The distance in meters
     * @return True if any plots exist within the distance, false otherwise
     */
    @Query(value = "SELECT COUNT(*) > 0 FROM plots WHERE ST_DWithin(ST_Transform(location, 3857), ST_Transform(ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326), 3857), :distanceInMeters)", nativeQuery = true)
    boolean existsPlotsWithinDistance(@Param("latitude") double latitude, @Param("longitude") double longitude, 
                                     @Param("distanceInMeters") double distanceInMeters);
    
    /**
     * Check if any plots exist within a specified distance of a location, excluding a specific plot ID
     *
     * @param latitude The latitude coordinate
     * @param longitude The longitude coordinate
     * @param distanceInMeters The distance in meters
     * @param excludeId Plot ID to exclude from the check
     * @return True if any plots exist within the distance, false otherwise
     */
    @Query(value = "SELECT COUNT(*) > 0 FROM plots WHERE id != :excludeId AND ST_DWithin(ST_Transform(location, 3857), ST_Transform(ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326), 3857), :distanceInMeters)", nativeQuery = true)
    boolean existsPlotsWithinDistanceExcluding(@Param("latitude") double latitude, @Param("longitude") double longitude, 
                                              @Param("distanceInMeters") double distanceInMeters, @Param("excludeId") Long excludeId);
} 