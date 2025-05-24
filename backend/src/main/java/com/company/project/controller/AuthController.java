package com.company.project.controller;

import com.company.project.dto.request.LoginRequest;
import com.company.project.dto.request.PasswordChangeRequest;
import com.company.project.dto.request.TokenRefreshRequest;
import com.company.project.dto.response.ApiResponse;
import com.company.project.dto.response.AuthResponse;
import com.company.project.dto.response.TokenRefreshResponse;
import com.company.project.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

/**
 * Authentication Controller
 * 
 * Handles all authentication-related endpoints including login, logout,
 * token refresh, and password management.
 */
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    /**
     * User login endpoint
     * 
     * @param request Login credentials
     * @return JWT token and user information
     */
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse authResponse = authService.login(request);
        return ResponseEntity.ok(
            new ApiResponse<>("SUCCESS", HttpStatus.OK.value(), "Login successful", authResponse)
        );
    }

    /**
     * Refresh token endpoint
     * 
     * @param request Contains the refresh token
     * @return New JWT token
     */
    @PostMapping("/refresh-token")
    public ResponseEntity<ApiResponse<TokenRefreshResponse>> refreshToken(@Valid @RequestBody TokenRefreshRequest request) {
        TokenRefreshResponse refreshResponse = authService.refreshToken(request);
        return ResponseEntity.ok(
            new ApiResponse<>("SUCCESS", HttpStatus.OK.value(), "Token refreshed successfully", refreshResponse)
        );
    }

    /**
     * User logout endpoint
     * 
     * @param principal Current authenticated user
     * @return Success message
     */
    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(Principal principal) {
        if (principal != null) {
            authService.logout(principal.getName());
        }
        return ResponseEntity.ok(
            new ApiResponse<>("SUCCESS", HttpStatus.OK.value(), "Logged out successfully", null)
        );
    }

    /**
     * Change password endpoint
     * 
     * @param request Contains current and new password
     * @param authentication Current authenticated user
     * @return Success message
     */
    @PostMapping("/change-password")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @Valid @RequestBody PasswordChangeRequest request,
            Authentication authentication) {
        authService.changePassword(authentication.getName(), request);
        return ResponseEntity.ok(
            new ApiResponse<>("SUCCESS", HttpStatus.OK.value(), "Password changed successfully", null)
        );
    }

    /**
     * Forgot password endpoint
     * 
     * @param email User's email address
     * @return Success message
     */
    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<Void>> forgotPassword(@RequestParam String email) {
        authService.sendPasswordResetEmail(email);
        return ResponseEntity.ok(
            new ApiResponse<>("SUCCESS", HttpStatus.OK.value(), 
                "Password reset email sent successfully", null)
        );
    }

    /**
     * Reset password endpoint
     * 
     * @param token Password reset token from email
     * @param newPassword New password
     * @return Success message
     */
    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<Void>> resetPassword(
            @RequestParam String token,
            @RequestParam String newPassword) {
        authService.resetPassword(token, newPassword);
        return ResponseEntity.ok(
            new ApiResponse<>("SUCCESS", HttpStatus.OK.value(), "Password reset successfully", null)
        );
    }
} 