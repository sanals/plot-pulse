package com.company.project.service.impl;

import com.company.project.dto.request.CreateUserRequest;
import com.company.project.entity.User;
import com.company.project.exception.InvalidRoleException;
import com.company.project.exception.ResourceNotFoundException;
import com.company.project.exception.UserAlreadyExistsException;
import com.company.project.repository.UserRepository;
import com.company.project.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public User createUser(CreateUserRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new UserAlreadyExistsException("Username already exists");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new UserAlreadyExistsException("Email already exists");
        }

        // Prevent assignment of ADMIN or SUPER_ADMIN roles through public registration
        // These roles can only be assigned manually at the database level
        String requestedRole = request.getRole();
        if (requestedRole != null && !requestedRole.trim().isEmpty()) {
            String roleUpper = requestedRole.toUpperCase().trim();
            if ("ADMIN".equals(roleUpper) || "SUPER_ADMIN".equals(roleUpper)) {
                throw new InvalidRoleException(
                    "Cannot assign " + roleUpper + " role through registration. " +
                    "Admin roles can only be assigned manually at the database level."
                );
            }
        }

        User user = new User();
        user.setUsername(request.getUsername());
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        // Always set to USER role for public registration (least privilege)
        // Ignore any role provided in the request to prevent privilege escalation
        user.setRole(User.Role.USER);
        user.setStatus(User.Status.ACTIVE);

        return userRepository.save(user);
    }

    @Override
    public User updateUser(User user) {
        return userRepository.save(user);
    }

    @Override
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    @Override
    public User getUserById(Long id) {
        return userRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    @Override
    @Transactional
    public void deleteUser(Long id) {
        if (!userRepository.existsById(id)) {
            throw new ResourceNotFoundException("User not found");
        }
        userRepository.deleteById(id);
    }

    @Override
    public boolean existsByUsername(String username) {
        return userRepository.existsByUsername(username);
    }

    @Override
    public boolean existsByEmail(String email) {
        return userRepository.existsByEmail(email);
    }
} 