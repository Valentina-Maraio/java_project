package com.company.sentinel.application;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.MapperFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.databind.json.JsonMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.HexFormat;
import java.util.Map;

@Service
public class IntegrityEvidenceService {

    private static final String SHA_256 = "SHA-256";
    private static final String CANONICALIZATION = "JSON_SORTED_KEYS_AND_PROPERTIES";

    private final ObjectMapper canonicalMapper;
    private final String citationStore;

    public IntegrityEvidenceService(
            @Value("${sentinel.integrity.citation-store:local-audit-log}") String citationStore
    ) {
        this.canonicalMapper = JsonMapper.builder()
            .findAndAddModules()
            .enable(MapperFeature.SORT_PROPERTIES_ALPHABETICALLY)
            .enable(SerializationFeature.ORDER_MAP_ENTRIES_BY_KEYS)
            .build();
        this.citationStore = citationStore;
    }

    public IntegrityEvidence hashResource(String resourceType, String resourceId, Object payload) {
        long startedAt = System.nanoTime();
        String canonicalJson = toCanonicalJson(payload);
        String hash = sha256Hex(canonicalJson);
        long processingMillis = (System.nanoTime() - startedAt) / 1_000_000L;

        Map<String, Object> citation = Map.of(
                "store", citationStore,
                "fhirMapping", "Provenance.target + Provenance.entity.what.identifier",
                "canonicalization", CANONICALIZATION,
                "contentType", "application/fhir+json"
        );

        return new IntegrityEvidence(
                resourceType,
                resourceId,
                CANONICALIZATION,
                SHA_256,
                hash,
                Instant.now(),
                processingMillis,
                citation
        );
    }

    private String toCanonicalJson(Object payload) {
        try {
            return canonicalMapper.writeValueAsString(payload);
        } catch (JsonProcessingException e) {
            throw new IllegalArgumentException("Unable to canonicalize payload", e);
        }
    }

    private String sha256Hex(String canonicalJson) {
        try {
            MessageDigest digest = MessageDigest.getInstance(SHA_256);
            byte[] bytes = digest.digest(canonicalJson.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(bytes);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 is not available", e);
        }
    }
}