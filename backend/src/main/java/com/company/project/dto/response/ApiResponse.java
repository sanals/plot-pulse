package com.company.project.dto.response;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

import org.springframework.http.HttpStatus;

import com.company.project.util.AppConstants;

import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Generic API Response Wrapper
 * 
 * Standardized response format for all API endpoints.
 * Contains status information, HTTP code, message, and the actual data payload.
 * 
 * @param <T> Type of data payload
 */
@Data
@NoArgsConstructor
public class ApiResponse<T> {
    private String status;
    private int code;
    private String message;
    private T data;

    // Store timestamp as a string to avoid serialization issues
    private String timestamp;

    public ApiResponse(String status, int code, String message, T data) {
        this.status = status;
        this.code = code;
        this.message = message;
        this.data = data;
        this.timestamp = DateTimeFormatter.ofPattern(AppConstants.DEFAULT_DATETIME_FORMAT).format(LocalDateTime.now());
    }

    /**
     * Create a success response with data
     * 
     * @param <T>  Type of data
     * @param data The data to return
     * @return ApiResponse with success status
     */
    public static <T> ApiResponse<T> success(T data) {
        return new ApiResponse<>("SUCCESS", HttpStatus.OK.value(), "Operation successful", data);
    }

    /**
     * Create a success response with data and custom message
     * 
     * @param <T>     Type of data
     * @param data    The data to return
     * @param message Custom success message
     * @return ApiResponse with success status
     */
    public static <T> ApiResponse<T> success(T data, String message) {
        return new ApiResponse<>("SUCCESS", HttpStatus.OK.value(), message, data);
    }

    /**
     * Create an error response
     * 
     * @param <T>     Type of data
     * @param code    HTTP status code
     * @param message Error message
     * @return ApiResponse with error status
     */
    public static <T> ApiResponse<T> error(int code, String message) {
        return new ApiResponse<>("ERROR", code, message, null);
    }
}