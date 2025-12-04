package com.company.project.exception;

/**
 * Exception thrown when attempting to assign a restricted role through public registration.
 * Admin and Super Admin roles can only be assigned manually at the database level.
 */
public class InvalidRoleException extends RuntimeException {
    public InvalidRoleException(String message) {
        super(message);
    }
}

