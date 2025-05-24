package com.company.project.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * Token Refresh Request DTO
 * 
 * Contains refresh token for requesting a new access token
 */
@Data
public class TokenRefreshRequest {
    @NotBlank(message = "Refresh token is required")
    private String refreshToken;
} 