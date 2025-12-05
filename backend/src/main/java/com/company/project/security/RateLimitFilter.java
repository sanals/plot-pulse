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
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

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
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, 
                                    FilterChain filterChain) throws ServletException, IOException {
        
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
        
        // Try to consume a token
        if (bucket.tryConsume(1)) {
            // Request allowed, continue
            filterChain.doFilter(request, response);
        } else {
            // Rate limit exceeded
            log.warn("Rate limit exceeded for IP: {} on endpoint: {}", clientIp, path);
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType("application/json");
            response.setHeader("Retry-After", String.valueOf(getRetryAfterSeconds(endpointKey)));
            response.getWriter().write(
                String.format(
                    "{\"error\":\"Too Many Requests\",\"message\":\"Rate limit exceeded. Please try again later.\",\"retryAfter\":%d}",
                    getRetryAfterSeconds(endpointKey)
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
     * Get retry-after seconds based on endpoint pattern
     */
    private int getRetryAfterSeconds(String endpointKey) {
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
        
        return limit.getWindowSeconds();
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

