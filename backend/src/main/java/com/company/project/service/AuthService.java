package com.company.project.service;

import com.company.project.dto.request.LoginRequest;
import com.company.project.dto.request.PasswordChangeRequest;
import com.company.project.dto.request.TokenRefreshRequest;
import com.company.project.dto.response.AuthResponse;
import com.company.project.dto.response.TokenRefreshResponse;

public interface AuthService {
    AuthResponse login(LoginRequest request);
    TokenRefreshResponse refreshToken(TokenRefreshRequest request);
    void logout(String username);
    void changePassword(String username, PasswordChangeRequest request);
    void sendPasswordResetEmail(String email);
    void resetPassword(String token, String newPassword);
} 