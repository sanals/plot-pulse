package com.company.project.config;

import org.springframework.boot.context.event.ApplicationEnvironmentPreparedEvent;
import org.springframework.context.ApplicationListener;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;
import org.springframework.lang.NonNull;
import org.springframework.util.StringUtils;

import java.net.URI;
import java.util.HashMap;
import java.util.Map;

/**
 * Database Configuration
 * 
 * Handles Railway's DATABASE_URL format conversion to Spring Boot JDBC format.
 * Railway provides: postgresql://user:password@host:port/database
 * Spring Boot expects: jdbc:postgresql://host:port/database with separate username/password
 * 
 * This listener parses DATABASE_URL and sets individual properties that Spring Boot can use.
 * Registered via META-INF/spring.factories to ensure it runs early in the application lifecycle.
 */
public class DatabaseConfig implements ApplicationListener<ApplicationEnvironmentPreparedEvent> {

    @Override
    public void onApplicationEvent(@NonNull ApplicationEnvironmentPreparedEvent event) {
        ConfigurableEnvironment environment = event.getEnvironment();
        String databaseUrl = environment.getProperty("DATABASE_URL");
        
        // If DATABASE_URL is provided (Railway format) and not already in JDBC format, parse it
        if (databaseUrl != null && StringUtils.hasText(databaseUrl) && !databaseUrl.startsWith("jdbc:")) {
            try {
                // Railway format: postgresql://user:password@host:port/database
                URI uri = new URI(databaseUrl);
                
                String scheme = uri.getScheme();
                if ("postgresql".equals(scheme) || "postgres".equals(scheme)) {
                    String host = uri.getHost();
                    int port = uri.getPort() > 0 ? uri.getPort() : 5432;
                    String path = uri.getPath();
                    String database = path != null && path.length() > 1 ? path.substring(1) : "plotpulse";
                    
                    // Extract username and password from userInfo
                    String userInfo = uri.getUserInfo();
                    String username = "postgres";
                    String password = "";
                    
                    if (userInfo != null && userInfo.contains(":")) {
                        String[] parts = userInfo.split(":", 2);
                        username = parts[0];
                        password = parts.length > 1 ? parts[1] : "";
                    } else if (userInfo != null) {
                        username = userInfo;
                    }
                    
                    // Build JDBC URL
                    String jdbcUrl = String.format("jdbc:postgresql://%s:%d/%s?sslmode=require", host, port, database);
                    
                    // Set properties that Spring Boot will use
                    Map<String, Object> properties = new HashMap<>();
                    properties.put("spring.datasource.url", jdbcUrl);
                    properties.put("spring.datasource.username", username);
                    properties.put("spring.datasource.password", password);
                    
                    // Also set individual PG variables if not already set
                    if (!environment.containsProperty("PGHOST")) {
                        properties.put("PGHOST", host);
                    }
                    if (!environment.containsProperty("PGPORT")) {
                        properties.put("PGPORT", String.valueOf(port));
                    }
                    if (!environment.containsProperty("PGDATABASE")) {
                        properties.put("PGDATABASE", database);
                    }
                    if (!environment.containsProperty("PGUSER")) {
                        properties.put("PGUSER", username);
                    }
                    if (!environment.containsProperty("PGPASSWORD")) {
                        properties.put("PGPASSWORD", password);
                    }
                    
                    environment.getPropertySources().addFirst(
                        new MapPropertySource("railwayDatabaseUrl", properties)
                    );
                }
            } catch (Exception e) {
                // If parsing fails, fall back to default configuration
                // Spring Boot will use individual PGHOST, PGPORT, etc. variables
                System.err.println("Warning: Failed to parse DATABASE_URL: " + e.getMessage());
            }
        }
    }
}

