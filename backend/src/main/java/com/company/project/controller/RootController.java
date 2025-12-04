package com.company.project.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import com.company.project.dto.response.ApiResponse;

/**
 * Root Controller
 * 
 * Provides a simple endpoint at the root path for Railway health checks
 * Since context path is /api/v1, this will be accessible at /api/v1/
 */
@RestController
public class RootController {

    /**
     * Root health check endpoint for Railway
     * Returns a simple 200 OK response
     * Accessible at: /api/v1/
     * 
     * @return Success response
     */
    @GetMapping("/")
    public ResponseEntity<ApiResponse<String>> root() {
        return ResponseEntity.ok(
                new ApiResponse<>("SUCCESS", HttpStatus.OK.value(), "PlotPulse API is running", "OK"));
    }
}

