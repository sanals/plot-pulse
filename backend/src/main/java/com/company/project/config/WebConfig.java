package com.company.project.config;

import java.util.List;

import org.springframework.context.annotation.Configuration;
import org.springframework.http.converter.HttpMessageConverter;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.lang.NonNull;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;

import lombok.RequiredArgsConstructor;

/**
 * Web Configuration
 * 
 * Configures web-related settings including:
 * - JSON serialization/deserialization
 * - Static resource handling
 * - CORS is now handled in SecurityConfig for centralized configuration
 */
@Configuration
@RequiredArgsConstructor
public class WebConfig implements WebMvcConfigurer {

    /**
     * Configure message converters for proper JSON handling
     * 
     * @param converters List of HTTP message converters
     */
    @Override
    public void configureMessageConverters(@NonNull List<HttpMessageConverter<?>> converters) {
        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
        objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

        MappingJackson2HttpMessageConverter converter = new MappingJackson2HttpMessageConverter();
        converter.setObjectMapper(objectMapper);
        converters.add(converter);
    }

    /**
     * Configure static resource handling for uploaded files
     * 
     * @param registry Resource handler registry
     */
    @Override
    public void addResourceHandlers(@NonNull ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/images/**")
                .addResourceLocations("file:./uploads/images/");
    }

    /**
     * CORS configuration has been moved to SecurityConfig
     * 
     * This method is intentionally left empty as SecurityConfig handles CORS
     * to avoid conflicts between multiple CORS configurations
     */
    @Override
    public void addCorsMappings(@NonNull CorsRegistry registry) {
        // CORS is handled in SecurityConfig - do not configure here to avoid conflicts
    }
}