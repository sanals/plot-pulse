package com.company.project.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;

/**
 * Geocoding controller that proxies Nominatim API requests
 * This allows us to set proper User-Agent headers which browsers cannot do
 */
@RestController
@RequestMapping("/geocoding")
public class GeocodingController {

    private static final String NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org";
    private static final String USER_AGENT = "PlotPulse/1.0 (https://plotpulse.syrez.co.in)";
    private final HttpClient httpClient;

    public GeocodingController() {
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
    }

    /**
     * Search for locations using Nominatim geocoding
     * 
     * @param q Search query
     * @param limit Maximum number of results (default: 5)
     * @return JSON response from Nominatim
     */
    @GetMapping("/search")
    public ResponseEntity<String> search(
            @RequestParam String q,
            @RequestParam(defaultValue = "5") int limit) {
        
        try {
            String encodedQuery = URLEncoder.encode(q, StandardCharsets.UTF_8);
            String url = String.format(
                "%s/search?format=json&q=%s&limit=%d&addressdetails=1",
                NOMINATIM_BASE_URL,
                encodedQuery,
                limit
            );

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("User-Agent", USER_AGENT)
                    .header("Accept", "application/json")
                    .timeout(Duration.ofSeconds(10))
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                return ResponseEntity.ok()
                        .header("Content-Type", "application/json")
                        .body(response.body());
            } else {
                return ResponseEntity.status(response.statusCode())
                        .body(response.body());
            }
        } catch (IOException | InterruptedException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("{\"error\": \"Geocoding service unavailable\"}");
        }
    }
}

