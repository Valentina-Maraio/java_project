package com.company.sentinel.application;

import java.time.Instant;
import java.util.Map;

public record IntegrityEvidence(
        String resourceType,
        String resourceId,
        String canonicalization,
        String hashAlgorithm,
        String hash,
        Instant generatedAt,
        long processingMillis,
        Map<String, Object> citation
) {
}