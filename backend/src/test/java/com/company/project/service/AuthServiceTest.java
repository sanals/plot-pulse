package com.company.project.service;

import com.company.project.dto.request.LoginRequest;
import com.company.project.dto.response.AuthResponse;
import com.company.project.entity.RefreshToken;
import com.company.project.entity.User;
import com.company.project.repository.PasswordResetTokenRepository;
import com.company.project.repository.UserRepository;
import com.company.project.security.JwtService;
import com.company.project.service.impl.AuthServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

class AuthServiceTest {

    @Mock
    private AuthenticationManager authenticationManager;
    
    @Mock
    private JwtService jwtService;

    @Mock
    private RefreshTokenService refreshTokenService;
    
    @Mock
    private UserRepository userRepository;
    
    @Mock
    private PasswordEncoder passwordEncoder;
    
    @Mock
    private EmailService emailService;
    
    @Mock
    private PasswordResetTokenRepository passwordResetTokenRepository;
    
    @Mock
    private Authentication authentication;
    
    private AuthServiceImpl authService;
    
    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        
        authService = new AuthServiceImpl(
            authenticationManager, 
            jwtService, 
            refreshTokenService,
            userRepository,
            passwordEncoder,
            emailService,
            passwordResetTokenRepository
        );
    }
    
    @Test
    void loginShouldReturnAuthResponse() {
        // Arrange
        LoginRequest request = new LoginRequest();
        request.setUsername("admin");
        request.setPassword("password");
        
        User user = new User();
        user.setUsername("admin");
        user.setRole(User.Role.ADMIN);
        
        // Create a mock refresh token
        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setToken("refresh-token-123");
        
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
            .thenReturn(authentication);
        when(authentication.getPrincipal()).thenReturn(user);
        when(jwtService.generateToken(user)).thenReturn("jwt-token");
        when(refreshTokenService.createRefreshToken(anyString())).thenReturn(refreshToken);
        when(userRepository.save(any(User.class))).thenReturn(user);
        
        // Act
        AuthResponse response = authService.login(request);
        
        // Assert
        assertNotNull(response);
        assertEquals("jwt-token", response.getToken());
        assertEquals("refresh-token-123", response.getRefreshToken());
        assertEquals("admin", response.getUsername());
        assertEquals("ADMIN", response.getRole());
        verify(userRepository).save(user);
    }
} 