package com.company.project.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class CreateUserRequest {
    @NotBlank(message = "Username is required")
    @Pattern(regexp = "^\\S+$", message = "Username cannot contain spaces")
    private String username;

    @NotBlank(message = "Name is required")
    private String name;

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    @NotBlank(message = "Password is required")
    @Pattern(regexp = "^(?=.*[A-Za-z])(?=.*\\d)[A-Za-z\\d]{8,}$", 
            message = "Password must be at least 8 characters long and contain both letters and numbers")
    private String password;

    // Role is optional for public registration, defaults to ADMIN if not provided
    private String role;
} 