package com.company.project.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Rate limiting configuration properties
 * Configurable via application.yml
 */
@Data
@Component
@ConfigurationProperties(prefix = "rate-limit")
public class RateLimitProperties {
    
    /**
     * Rate limit for authentication endpoints (login, register, etc.)
     * Format: requests per time window
     */
    private EndpointLimit auth = new EndpointLimit(10, 60); // 10 requests per 60 seconds
    
    /**
     * Rate limit for public plot endpoints (GET requests)
     */
    private EndpointLimit plots = new EndpointLimit(100, 60); // 100 requests per 60 seconds
    
    /**
     * Rate limit for geocoding endpoints
     */
    private EndpointLimit geocoding = new EndpointLimit(30, 60); // 30 requests per 60 seconds
    
    /**
     * Rate limit for authenticated endpoints
     */
    private EndpointLimit authenticated = new EndpointLimit(200, 60); // 200 requests per 60 seconds
    
    /**
     * Rate limit for health check endpoints (more lenient)
     */
    private EndpointLimit health = new EndpointLimit(1000, 60); // 1000 requests per 60 seconds
    
    /**
     * Enable or disable rate limiting globally
     */
    private boolean enabled = true;
    
    /**
     * Endpoint-specific rate limit configuration
     */
    @Data
    public static class EndpointLimit {
        /**
         * Number of requests allowed
         */
        private int requests;
        
        /**
         * Time window in seconds
         */
        private int windowSeconds;
        
        public EndpointLimit() {
        }
        
        public EndpointLimit(int requests, int windowSeconds) {
            this.requests = requests;
            this.windowSeconds = windowSeconds;
        }
    }
}


