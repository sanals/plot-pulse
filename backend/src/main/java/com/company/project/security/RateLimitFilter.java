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
import jakarta.annotation.PreDestroy;

import java.io.IOException;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicLong;
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
    // Limited to prevent memory leaks from unbounded growth
    private static final int MAX_CACHE_SIZE = 10000; // Maximum number of buckets to cache
    private final Map<String, Bucket> bucketCache = new ConcurrentHashMap<>();
    
    // Track last access time for each bucket to enable cleanup
    private final Map<String, Long> bucketAccessTime = new ConcurrentHashMap<>();
    
    // Cleanup scheduler to remove old buckets periodically
    private final ScheduledExecutorService cleanupScheduler = Executors.newSingleThreadScheduledExecutor(r -> {
        Thread t = new Thread(r, "rate-limit-cleanup");
        t.setDaemon(true);
        return t;
    });
    
    // Track cache size to prevent unbounded growth
    private final AtomicLong cacheSize = new AtomicLong(0);
    
    // Initialize cleanup task
    {
        // Clean up buckets that haven't been accessed in 1 hour
        cleanupScheduler.scheduleAtFixedRate(this::cleanupOldBuckets, 5, 5, TimeUnit.MINUTES);
    }
    
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
        
        // Check cache size limit to prevent memory leaks
        if (cacheSize.get() >= MAX_CACHE_SIZE && !bucketCache.containsKey(bucketKey)) {
            // Cache is full, try to clean up old entries first
            cleanupOldBuckets();
            
            // If still full after cleanup, log warning and use a default bucket
            if (cacheSize.get() >= MAX_CACHE_SIZE) {
                log.warn("Rate limit cache is full ({} entries). Using default bucket for IP: {}", 
                        cacheSize.get(), clientIp);
                // Create a temporary bucket without caching it
                Bucket bucket = createBucket(endpointKey);
                RateLimitProperties.EndpointLimit limit = getEndpointLimit(endpointKey);
                ConsumptionProbe probe = bucket.tryConsumeAndReturnRemaining(1);
                
                if (probe.isConsumed()) {
                    addRateLimitHeaders(response, probe, limit);
                    filterChain.doFilter(request, response);
                } else {
                    log.warn("Rate limit exceeded for IP: {} on endpoint: {}", clientIp, path);
                    response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
                    response.setContentType("application/json");
                    addRateLimitHeaders(response, probe, limit);
                    response.setHeader("Retry-After", String.valueOf(probe.getNanosToWaitForRefill() / 1_000_000_000));
                    response.getWriter().write(
                        String.format(
                            "{\"error\":\"Too Many Requests\",\"message\":\"Rate limit exceeded. Please try again later.\",\"retryAfter\":%d}",
                            probe.getNanosToWaitForRefill() / 1_000_000_000
                        )
                    );
                }
                return;
            }
        }
        
        Bucket bucket = bucketCache.computeIfAbsent(bucketKey, k -> {
            cacheSize.incrementAndGet();
            return createBucket(endpointKey);
        });
        
        // Update access time
        bucketAccessTime.put(bucketKey, System.currentTimeMillis());
        
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
    
    /**
     * Clean up old buckets that haven't been accessed recently
     * This prevents memory leaks from unbounded cache growth
     */
    private void cleanupOldBuckets() {
        long currentTime = System.currentTimeMillis();
        long expireTime = currentTime - TimeUnit.HOURS.toMillis(1); // Remove buckets not accessed in 1 hour
        
        int removed = 0;
        for (Map.Entry<String, Long> entry : bucketAccessTime.entrySet()) {
            if (entry.getValue() < expireTime) {
                String key = entry.getKey();
                bucketCache.remove(key);
                bucketAccessTime.remove(key);
                cacheSize.decrementAndGet();
                removed++;
            }
        }
        
        if (removed > 0) {
            log.debug("Cleaned up {} old rate limit buckets. Cache size: {}", removed, cacheSize.get());
        }
    }
    
    /**
     * Cleanup resources on shutdown
     */
    @PreDestroy
    public void cleanup() {
        log.info("Shutting down rate limit cleanup scheduler");
        cleanupScheduler.shutdown();
        try {
            if (!cleanupScheduler.awaitTermination(5, TimeUnit.SECONDS)) {
                cleanupScheduler.shutdownNow();
            }
        } catch (InterruptedException e) {
            cleanupScheduler.shutdownNow();
            Thread.currentThread().interrupt();
        }
    }
}

