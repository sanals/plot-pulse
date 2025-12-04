package com.company.project.controller;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.company.project.dto.response.ApiResponse;
import com.company.project.util.AppConstants;

import lombok.RequiredArgsConstructor;

/**
 * Health Check Controller
 * 
 * Provides endpoints to check the health and status of the application.
 * These endpoints can be used by monitoring tools or load balancers to verify
 * that the application is running properly.
 */
@RestController
@RequestMapping("/health")
@RequiredArgsConstructor
public class HealthController {

    @Value("${spring.application.name}")
    private String applicationName;

        private final String activeProfile = "default";

    /**
     * Simple health check endpoint
     * Returns a 200 OK response if the application is running
     * Accessible at: /api/v1/health
     * 
     * @return Success response
     */
    @GetMapping
    public ResponseEntity<ApiResponse<String>> healthCheck() {
        return ResponseEntity.ok(
                new ApiResponse<>("SUCCESS", HttpStatus.OK.value(), "Application is running", "OK"));
    }

    /**
     * Detailed health information endpoint
     * Returns more detailed information about the application status
     * Accessible at: /api/v1/health/info
     * 
     * @return Detailed health information
     */
    @GetMapping("/info")
    public ResponseEntity<ApiResponse<Map<String, Object>>> healthInfo() {
        Map<String, Object> healthData = new HashMap<>();
        healthData.put("application", applicationName);
        healthData.put("profile", activeProfile);
        healthData.put("status", "UP");

        // Format timestamp as a simple string to avoid serialization issues
        String formattedTimestamp = DateTimeFormatter.ofPattern(AppConstants.DEFAULT_DATETIME_FORMAT)
                .format(LocalDateTime.now());
        healthData.put("timestamp", formattedTimestamp);

        return ResponseEntity.ok(
                new ApiResponse<>("SUCCESS", HttpStatus.OK.value(), "Health information", healthData));
    }
}