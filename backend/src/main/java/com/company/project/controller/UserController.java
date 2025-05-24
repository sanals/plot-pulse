package com.company.project.controller;

import com.company.project.dto.request.CreateUserRequest;
import com.company.project.dto.response.ApiResponse;
import com.company.project.entity.User;
import com.company.project.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * User Management Controller
 * 
 * Provides endpoints for managing user accounts.
 * Some operations require admin privileges.
 */
@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    /**
     * Create new user account
     * 
     * @param request User creation request data
     * @return Created user details
     */
    @PostMapping("/create")
    public ResponseEntity<ApiResponse<User>> createUser(@Valid @RequestBody CreateUserRequest request) {
        User user = userService.createUser(request);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(new ApiResponse<>("SUCCESS", HttpStatus.CREATED.value(), 
                "User created successfully", user));
    }

    /**
     * Get all users
     * 
     * @return List of all users
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<List<User>>> getAllUsers() {
        List<User> users = userService.getAllUsers();
        return ResponseEntity.ok(new ApiResponse<>("SUCCESS", HttpStatus.OK.value(), 
            "Users retrieved successfully", users));
    }
} 