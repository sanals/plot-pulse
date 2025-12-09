package com.company.project.util;

import com.company.project.entity.User;
import com.company.project.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.Optional;

/**
 * Utility service for security-related operations
 */
@Component
@RequiredArgsConstructor
public class SecurityUtils {

    private final UserRepository userRepository;

    /**
     * Gets the current authenticated user from the security context
     * Loads the User entity from the database if needed
     * 
     * @return Optional containing the User if authenticated, empty otherwise
     */
    public Optional<User> getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        if (authentication == null || !authentication.isAuthenticated()) {
            return Optional.empty();
        }
        
        Object principal = authentication.getPrincipal();
        
        // If principal is already a User entity, return it
        if (principal instanceof User) {
            return Optional.of((User) principal);
        }
        
        // If principal is UserDetails (from JWT), load User from database by username
        String username = authentication.getName();
        if (username != null) {
            return userRepository.findByUsername(username);
        }
        
        return Optional.empty();
    }

    /**
     * Gets the current authenticated user ID from the security context
     * 
     * @return Optional containing the user ID if authenticated, empty otherwise
     */
    public Optional<Long> getCurrentUserId() {
        return getCurrentUser().map(User::getId);
    }

    /**
     * Gets the current authenticated username from the security context
     * 
     * @return Optional containing the username if authenticated, empty otherwise
     */
    public Optional<String> getCurrentUsername() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        if (authentication == null || !authentication.isAuthenticated()) {
            return Optional.empty();
        }
        
        return Optional.of(authentication.getName());
    }

    /**
     * Checks if a user is currently authenticated
     * 
     * @return true if user is authenticated, false otherwise
     */
    public boolean isAuthenticated() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication != null && authentication.isAuthenticated();
    }
}

