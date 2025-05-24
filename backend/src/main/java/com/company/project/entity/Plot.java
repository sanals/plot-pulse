package com.company.project.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.locationtech.jts.geom.Point;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Entity representing a plot with geospatial data
 */
@Entity
@Table(name = "plots")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Plot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull
    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal price;

    @NotNull
    @Column(name = "is_for_sale", nullable = false)
    private Boolean isForSale;

    @Size(max = 500)
    @Column(length = 500)
    private String description;

    /**
     * The geographic location of the plot stored as a Point geometry
     * Uses SRID 4326 (WGS84) for coordinate system consistency
     */
    @NotNull
    @Column(nullable = false, columnDefinition = "geometry(Point, 4326)")
    private Point location;

    /**
     * Latitude extracted from the location Point for convenience
     */
    @Column(name = "latitude", nullable = false)
    private Double latitude;

    /**
     * Longitude extracted from the location Point for convenience
     */
    @Column(name = "longitude", nullable = false)
    private Double longitude;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    /**
     * Reference to the user who created this plot entry
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    /**
     * Pre-persist hook to extract latitude and longitude from Point
     */
    @PrePersist
    @PreUpdate
    public void updateCoordinates() {
        if (location != null) {
            this.latitude = location.getX();
            this.longitude = location.getY();
        }
    }
} 