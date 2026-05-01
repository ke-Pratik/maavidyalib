package com.studycenter.exception;

/**
 * Thrown when a student with the same regNo already exists.
 */
public class StudentAlreadyExistsException extends RuntimeException {

    public StudentAlreadyExistsException(String message) {
        super(message);
    }
}