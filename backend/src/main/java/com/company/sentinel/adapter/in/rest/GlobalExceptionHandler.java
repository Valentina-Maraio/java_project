package com.company.sentinel.adapter.in.rest;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGeneric(Exception ex) {
        return buildOutcome(HttpStatus.INTERNAL_SERVER_ERROR, "exception", ex.getMessage());
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleBadRequest(IllegalArgumentException ex) {
        return buildOutcome(HttpStatus.BAD_REQUEST, "invalid", ex.getMessage());
    }

    private ResponseEntity<Map<String, Object>> buildOutcome(HttpStatus status,
                                                              String code,
                                                              String details) {
        Map<String, Object> outcome = Map.of(
                "resourceType", "OperationOutcome",
                "timestamp", Instant.now().toString(),
                "issue", List.of(Map.of(
                        "severity", "error",
                        "code", code,
                        "details", Map.of("text", details)
                ))
        );
        return ResponseEntity.status(status).body(outcome);
    }
}
