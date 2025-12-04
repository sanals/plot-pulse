package com.company.project.config;

import jakarta.annotation.PostConstruct;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;

/**
 * Database Environment Configuration
 * 
 * Logs database connection information at startup to help debug connection issues.
 * This runs after EnvironmentPostProcessor, so it can verify what was set.
 */
@Configuration
public class DatabaseEnvironmentConfig {

    private final Environment environment;

    public DatabaseEnvironmentConfig(Environment environment) {
        this.environment = environment;
    }

    @PostConstruct
    public void logDatabaseConfig() {
        System.out.println("═══════════════════════════════════════════════════════");
        System.out.println("🔍 Database Environment Configuration Check");
        System.out.println("═══════════════════════════════════════════════════════");
        
        // Check DATABASE_URL
        String databaseUrl = environment.getProperty("DATABASE_URL");
        System.out.println("DATABASE_URL: " + (databaseUrl != null ? "SET (" + databaseUrl.length() + " chars)" : "NOT SET"));
        
        // Check individual PG variables
        String pghost = environment.getProperty("PGHOST");
        String pgport = environment.getProperty("PGPORT");
        String pgdatabase = environment.getProperty("PGDATABASE");
        String pguser = environment.getProperty("PGUSER");
        String pgpassword = environment.getProperty("PGPASSWORD");
        
        System.out.println("PGHOST: " + (pghost != null ? pghost : "NOT SET"));
        System.out.println("PGPORT: " + (pgport != null ? pgport : "NOT SET"));
        System.out.println("PGDATABASE: " + (pgdatabase != null ? pgdatabase : "NOT SET"));
        System.out.println("PGUSER: " + (pguser != null ? pguser : "NOT SET"));
        System.out.println("PGPASSWORD: " + (pgpassword != null ? "SET (" + pgpassword.length() + " chars)" : "NOT SET"));
        
        // Check what Spring Boot will use
        String springUrl = environment.getProperty("spring.datasource.url");
        String springUsername = environment.getProperty("spring.datasource.username");
        String springPassword = environment.getProperty("spring.datasource.password");
        
        System.out.println("───────────────────────────────────────────────────────");
        System.out.println("Spring Boot Datasource Configuration:");
        System.out.println("spring.datasource.url: " + (springUrl != null ? springUrl.replaceAll("password=[^&]*", "password=***") : "NOT SET"));
        System.out.println("spring.datasource.username: " + (springUsername != null ? springUsername : "NOT SET"));
        System.out.println("spring.datasource.password: " + (springPassword != null ? "SET (" + springPassword.length() + " chars)" : "NOT SET"));
        System.out.println("═══════════════════════════════════════════════════════");
        
        // Warn if using defaults
        if (pghost == null || "localhost".equals(pghost)) {
            System.err.println("⚠️  WARNING: PGHOST is not set or is localhost. Database connection will likely fail!");
            System.err.println("   Make sure your PostgreSQL service is connected in Railway.");
        }
    }
}

