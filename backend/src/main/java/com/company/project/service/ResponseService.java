package com.company.project.service;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import com.company.project.dto.response.ApiResponse;

/**
 * Service for standardizing API responses across the application
 */
@Service
public class ResponseService {

    /**
     * Standardize single item responses
     * 
     * @param <T>     Type of data
     * @param data    Data to be returned
     * @param message Success message
     * @return Standardized API response with single item
     */
    public <T> ApiResponse<T> createSingleResponse(T data, String message) {
        return new ApiResponse<>("SUCCESS", HttpStatus.OK.value(), message, data);
    }

    /**
     * Standardize created item responses with 201 status
     * 
     * @param <T>     Type of data
     * @param data    Data to be returned
     * @param message Success message
     * @return Standardized API response with created status
     */
    public <T> ApiResponse<T> createCreatedResponse(T data, String message) {
        return new ApiResponse<>("SUCCESS", HttpStatus.CREATED.value(), message, data);
    }

    /**
     * Standardize list responses by wrapping them in a Page
     * 
     * @param <T>      Type of list items
     * @param data     List of items
     * @param pageable Pagination information
     * @param message  Success message
     * @return Standardized API response with paged data
     */
    public <T> ApiResponse<Page<T>> createPageResponse(List<T> data, Pageable pageable, String message) {
        Page<T> page = new PageImpl<>(data, pageable, data.size());
        return new ApiResponse<>("SUCCESS", HttpStatus.OK.value(), message, page);
    }

    /**
     * Standardize existing page responses
     * 
     * @param <T>     Type of page items
     * @param page    Page of items
     * @param message Success message
     * @return Standardized API response with paged data
     */
    public <T> ApiResponse<Page<T>> createPageResponse(Page<T> page, String message) {
        return new ApiResponse<>("SUCCESS", HttpStatus.OK.value(), message, page);
    }

    /**
     * Standardize empty success responses
     * 
     * @param message Success message
     * @return Standardized API response with no data
     */
    public ApiResponse<Void> createEmptyResponse(String message) {
        return new ApiResponse<>("SUCCESS", HttpStatus.OK.value(), message, null);
    }

    /**
     * Generic success response with default message
     * 
     * @param <T>  Type of data
     * @param data Data to be returned
     * @return Standardized API response with success status
     */
    public <T> ApiResponse<T> success(T data) {
        return new ApiResponse<>("SUCCESS", HttpStatus.OK.value(), "Operation successful", data);
    }
}