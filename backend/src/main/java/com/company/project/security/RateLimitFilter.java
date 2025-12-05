package com.company.project.security;

import com.company.project.config.RateLimitProperties;
import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import io.github.bucket4j.ConsumptionProbe;

/**
 * Rate limiting filter using Bucket4j
 * 
 * Implements token bucket algorithm for rate limiting:
 * - Different limits for different endpoint patterns
 * - Per-IP address tracking
 * - Returns 429 Too Many Requests when limit exceeded
 */
@Slf4j
@Component
@Order(1) // Execute before authentication filter
@RequiredArgsConstructor
public class RateLimitFilter extends OncePerRequestFilter {

    private final RateLimitProperties rateLimitProperties;
    
    // Cache of buckets per IP address and endpoint pattern
    private final Map<String, Bucket> bucketCache = new ConcurrentHashMap<>();
    
    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request, @NonNull HttpServletResponse response, 
                                    @NonNull FilterChain filterChain) throws ServletException, IOException {
        
        // Skip rate limiting if disabled
        if (!rateLimitProperties.isEnabled()) {
            filterChain.doFilter(request, response);
            return;
        }
        
        String path = request.getRequestURI();
        String clientIp = getClientIpAddress(request);
        String endpointKey = getEndpointKey(path);
        
        // Get or create bucket for this IP + endpoint pattern
        String bucketKey = clientIp + ":" + endpointKey;
        Bucket bucket = bucketCache.computeIfAbsent(bucketKey, k -> createBucket(endpointKey));
        
        // Get endpoint limit for header calculations
        RateLimitProperties.EndpointLimit limit = getEndpointLimit(endpointKey);
        
        // Try to consume a token and get consumption probe
        ConsumptionProbe probe = bucket.tryConsumeAndReturnRemaining(1);
        
        if (probe.isConsumed()) {
            // Request allowed, add rate limit headers
            addRateLimitHeaders(response, probe, limit);
            filterChain.doFilter(request, response);
        } else {
            // Rate limit exceeded
            log.warn("Rate limit exceeded for IP: {} on endpoint: {}", clientIp, path);
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType("application/json");
            
            // Add rate limit headers even when limit is exceeded
            addRateLimitHeaders(response, probe, limit);
            response.setHeader("Retry-After", String.valueOf(probe.getNanosToWaitForRefill() / 1_000_000_000));
            
            response.getWriter().write(
                String.format(
                    "{\"error\":\"Too Many Requests\",\"message\":\"Rate limit exceeded. Please try again later.\",\"retryAfter\":%d}",
                    probe.getNanosToWaitForRefill() / 1_000_000_000
                )
            );
        }
    }
    
    /**
     * Determine which endpoint pattern this request matches
     */
    private String getEndpointKey(String path) {
        if (path.startsWith("/api/v1/auth") || path.startsWith("/auth")) {
            return "auth";
        } else if (path.startsWith("/api/v1/geocoding") || path.startsWith("/geocoding")) {
            return "geocoding";
        } else if (path.startsWith("/api/v1/health") || path.startsWith("/health")) {
            return "health";
        } else if (path.startsWith("/api/v1/plots") || path.startsWith("/plots")) {
            return "plots";
        } else {
            return "authenticated";
        }
    }
    
    /**
     * Create a bucket with appropriate rate limit based on endpoint pattern
     */
    private Bucket createBucket(String endpointKey) {
        RateLimitProperties.EndpointLimit limit;
        
        switch (endpointKey) {
            case "auth":
                limit = rateLimitProperties.getAuth();
                break;
            case "geocoding":
                limit = rateLimitProperties.getGeocoding();
                break;
            case "health":
                limit = rateLimitProperties.getHealth();
                break;
            case "plots":
                limit = rateLimitProperties.getPlots();
                break;
            default:
                limit = rateLimitProperties.getAuthenticated();
        }
        
        Refill refill = Refill.intervally(limit.getRequests(), Duration.ofSeconds(limit.getWindowSeconds()));
        Bandwidth bandwidth = Bandwidth.classic(limit.getRequests(), refill);
        
        return Bucket.builder()
                .addLimit(bandwidth)
                .build();
    }
    
    /**
     * Get endpoint limit configuration based on endpoint pattern
     */
    private RateLimitProperties.EndpointLimit getEndpointLimit(String endpointKey) {
        switch (endpointKey) {
            case "auth":
                return rateLimitProperties.getAuth();
            case "geocoding":
                return rateLimitProperties.getGeocoding();
            case "health":
                return rateLimitProperties.getHealth();
            case "plots":
                return rateLimitProperties.getPlots();
            default:
                return rateLimitProperties.getAuthenticated();
        }
    }
    
    /**
     * Add rate limit headers to response
     * Includes X-RateLimit-Remaining, X-RateLimit-Reset, and X-RateLimit-Limit
     */
    private void addRateLimitHeaders(HttpServletResponse response, ConsumptionProbe probe, 
                                    RateLimitProperties.EndpointLimit limit) {
        // Remaining tokens available
        long remaining = probe.getRemainingTokens();
        response.setHeader("X-RateLimit-Remaining", String.valueOf(remaining));
        
        // Total limit for this endpoint
        response.setHeader("X-RateLimit-Limit", String.valueOf(limit.getRequests()));
        
        // Reset time (when the bucket will be fully refilled)
        // Calculate reset time as current time + time to wait for refill
        long nanosToWait = probe.getNanosToWaitForRefill();
        if (nanosToWait > 0) {
            // If we need to wait, reset time is current time + wait time
            Instant resetTime = Instant.now().plusNanos(nanosToWait);
            response.setHeader("X-RateLimit-Reset", String.valueOf(resetTime.getEpochSecond()));
        } else {
            // If no wait needed, reset time is current time + window duration
            Instant resetTime = Instant.now().plusSeconds(limit.getWindowSeconds());
            response.setHeader("X-RateLimit-Reset", String.valueOf(resetTime.getEpochSecond()));
        }
    }
    
    /**
     * Extract client IP address from request
     * Handles proxies and load balancers
     */
    private String getClientIpAddress(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("X-Real-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("Proxy-Client-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("WL-Proxy-Client-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        
        // Handle multiple IPs in X-Forwarded-For header
        if (ip != null && ip.contains(",")) {
            ip = ip.split(",")[0].trim();
        }
        
        return ip != null ? ip : "unknown";
    }
}

