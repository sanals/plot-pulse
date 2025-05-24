package com.company.project.service;

import com.company.project.dto.request.CreateUserRequest;
import com.company.project.entity.User;
import java.util.List;

public interface UserService {
    User createUser(CreateUserRequest request);
    User updateUser(User user);
    List<User> getAllUsers();
    User getUserById(Long id);
    void deleteUser(Long id);
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);
} 