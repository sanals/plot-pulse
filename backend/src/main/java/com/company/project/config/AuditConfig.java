package com.company.project.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.domain.AuditorAware;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Optional;

/**
 * JPA Auditing Configuration
 * 
 * Enables automatic auditing of JPA entities. This configuration allows
 * the application to automatically track when entities are created or modified
 * and by which user.
 * 
 * Works with @CreatedBy, @LastModifiedBy, @CreatedDate, and @LastModifiedDate annotations
 * in entity classes to automatically set these fields.
 */
@Configuration
@EnableJpaAuditing(auditorAwareRef = "auditorProvider")
public class AuditConfig {

    /**
     * Provides the current auditor (user) for JPA auditing
     * 
     * Gets the authenticated user from the Security Context.
     * If no user is authenticated, uses "system" as the default auditor.
     * 
     * @return The name of the current user or "system" if none
     */
    @Bean
    public AuditorAware<String> auditorProvider() {
        return () -> {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || !authentication.isAuthenticated()) {
                return Optional.of("system");
            }
            return Optional.of(authentication.getName());
        };
    }
} 