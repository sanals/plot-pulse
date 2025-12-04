package com.company.project.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import com.company.project.dto.response.ApiResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.validation.FieldError;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * Global exception handler for the application
 */
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<String>> handleException(Exception ex) {
        ApiResponse<String> response = new ApiResponse<>(
                "ERROR",
                HttpStatus.INTERNAL_SERVER_ERROR.value(),
                "An unexpected error occurred",
                ex.getMessage());

        return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ApiResponse<String>> handleBadCredentialsException(BadCredentialsException ex) {
        ApiResponse<String> response = new ApiResponse<>(
                "ERROR",
                HttpStatus.UNAUTHORIZED.value(),
                "Invalid credentials",
                null);

        return new ResponseEntity<>(response, HttpStatus.UNAUTHORIZED);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationExceptions(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach((error) -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });
        
        log.warn("Validation error: {}", errors);
        ErrorResponse error = ErrorResponse.builder()
                .status("ERROR")
                .code(400)
                .message("Validation failed")
                .data(errors)
                .timestamp(LocalDateTime.now().toString())
                .build();
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

    @ExceptionHandler(UserAlreadyExistsException.class)
    public ResponseEntity<ApiResponse<String>> handleUserAlreadyExistsException(UserAlreadyExistsException ex) {
        ApiResponse<String> response = new ApiResponse<>(
                "ERROR",
                HttpStatus.CONFLICT.value(),
                ex.getMessage(),
                null);

        return new ResponseEntity<>(response, HttpStatus.CONFLICT);
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiResponse<String>> handleResourceNotFoundException(ResourceNotFoundException ex) {
        ApiResponse<String> response = new ApiResponse<>(
                "ERROR",
                HttpStatus.NOT_FOUND.value(),
                ex.getMessage(),
                null);

        return new ResponseEntity<>(response, HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(PlotNotFoundException.class)
    public ResponseEntity<ErrorResponse> handlePlotNotFound(PlotNotFoundException ex) {
        log.warn("Plot not found: {}", ex.getMessage());
        ErrorResponse error = ErrorResponse.builder()
                .status("ERROR")
                .code(404)
                .message(ex.getMessage())
                .timestamp(LocalDateTime.now().toString())
                .build();
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
    }

    @ExceptionHandler(DuplicateLocationException.class)
    public ResponseEntity<ErrorResponse> handleDuplicateLocation(DuplicateLocationException ex) {
        log.warn("Duplicate location error: {}", ex.getMessage());
        ErrorResponse error = ErrorResponse.builder()
                .status("ERROR")
                .code(409)
                .message(ex.getMessage())
                .timestamp(LocalDateTime.now().toString())
                .build();
        return ResponseEntity.status(HttpStatus.CONFLICT).body(error);
    }

    @ExceptionHandler(InvalidCoordinateException.class)
    public ResponseEntity<ErrorResponse> handleInvalidCoordinate(InvalidCoordinateException ex) {
        log.warn("Invalid coordinate error: {}", ex.getMessage());
        ErrorResponse error = ErrorResponse.builder()
                .status("ERROR")
                .code(400)
                .message(ex.getMessage())
                .timestamp(LocalDateTime.now().toString())
                .build();
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

    @ExceptionHandler(InvalidRoleException.class)
    public ResponseEntity<ApiResponse<String>> handleInvalidRoleException(InvalidRoleException ex) {
        log.warn("Invalid role assignment attempt: {}", ex.getMessage());
        ApiResponse<String> response = new ApiResponse<>(
                "ERROR",
                HttpStatus.FORBIDDEN.value(),
                ex.getMessage(),
                null);

        return new ResponseEntity<>(response, HttpStatus.FORBIDDEN);
    }
}