package com.company.project.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.security.access.expression.method.DefaultMethodSecurityExpressionHandler;
import org.springframework.security.access.expression.method.MethodSecurityExpressionHandler;
import org.springframework.security.access.hierarchicalroles.RoleHierarchy;
import org.springframework.security.access.hierarchicalroles.RoleHierarchyImpl;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import com.company.project.security.AuthEntryPointJwt;
import com.company.project.security.JwtAuthenticationFilter;

import lombok.RequiredArgsConstructor;

/**
 * Spring Security Configuration
 * 
 * Configures security settings for the application, including:
 * - JWT authentication
 * - Authorization rules
 * - Password encoding
 * - CSRF protection
 * - Session management
 * - Method-level security
 * 
 * This implementation uses stateless JWT authentication with role-based
 * authorization.
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final UserDetailsService userDetailsService;
    private final JwtAuthenticationFilter jwtAuthFilter;
    private final AuthEntryPointJwt unauthorizedHandler;
    private final CorsProperties corsProperties;

    /**
     * Configures authentication provider with user details service and password
     * encoder
     * 
     * @return Configured authentication provider
     */
    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    /**
     * Creates authentication manager for handling authentication requests
     * 
     * @param authConfig Authentication configuration
     * @return Authentication manager
     */
    @Bean
    @Primary
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authConfig) throws Exception {
        return authConfig.getAuthenticationManager();
    }

    /**
     * Configures password encoder for secure password storage
     * 
     * BCrypt is used for password hashing with default strength
     * 
     * @return Password encoder
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /**
     * Configures role hierarchy for the application
     * 
     * This establishes that SUPER_ADMIN inherits all permissions of ADMIN
     * Users with SUPER_ADMIN role will automatically have all permissions granted
     * to ADMIN role
     * 
     * @return Role hierarchy implementation
     */
    @Bean
    public RoleHierarchy roleHierarchy() {
        // Use the static fromHierarchy method for defining role hierarchy
        // SUPER_ADMIN has all privileges, ADMIN has admin privileges, USER has minimal privileges
        return RoleHierarchyImpl.fromHierarchy("ROLE_SUPER_ADMIN > ROLE_ADMIN > ROLE_USER");
    }

    /**
     * Configures method security expression handler with role hierarchy
     * 
     * This is required to make role hierarchy work with @PreAuthorize annotations
     * 
     * @return Method security expression handler with role hierarchy
     */
    @Bean
    public MethodSecurityExpressionHandler methodSecurityExpressionHandler() {
        DefaultMethodSecurityExpressionHandler expressionHandler = new DefaultMethodSecurityExpressionHandler();
        expressionHandler.setRoleHierarchy(roleHierarchy());
        return expressionHandler;
    }

    /**
     * Configures CORS settings for cross-origin requests
     * Uses values from application.yaml through CorsProperties
     * 
     * @return CORS configuration source
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // Apply configuration from application.yaml using CorsProperties
        configuration.setAllowedOrigins(corsProperties.getAllowedOrigins());
        configuration.setAllowedMethods(corsProperties.getAllowedMethods());
        configuration.setAllowedHeaders(corsProperties.getAllowedHeaders());
        configuration.setAllowCredentials(true); // Enable credentials for authentication
        configuration.setMaxAge(corsProperties.getMaxAge());

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    /**
     * Configures security filter chain with authorization rules
     * 
     * Defines:
     * - Which endpoints are public vs protected
     * - How JWT authentication is applied
     * - Exception handling for unauthorized access
     * - Session management (stateless)
     * 
     * @param http HttpSecurity to configure
     * @return Configured security filter chain
     */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http.csrf(csrf -> csrf.disable())
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .exceptionHandling(exception -> exception.authenticationEntryPoint(unauthorizedHandler))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // Public endpoints that don't require authentication
                        .requestMatchers("/auth/**", "/users/create", "/health/**", "/plots/**").permitAll()
                        // Also allow with explicit API prefix patterns (in case context path changes)
                        .requestMatchers("/api/auth/**", "/api/users/create", "/api/health/**", "/api/plots/**").permitAll()
                        // All other endpoints require authentication
                        .anyRequest().authenticated());

        // Use the custom authentication provider
        http.authenticationProvider(authenticationProvider());

        // Add JWT filter before the standard authentication filter
        http.addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}