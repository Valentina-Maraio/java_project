package com.company.sentinel.domain.model;

import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

public class DiagnosticReport {

    private final String id;
    private final String resourceType = "DiagnosticReport";
    private final String status;
    private final String subjectReference;
    private final Instant issued;
    private final List<Observation> results;

    public DiagnosticReport(String subjectReference, List<Observation> results) {
        this.id = UUID.randomUUID().toString();
        this.status = "final";
        this.subjectReference = subjectReference;
        this.issued = Instant.now();
        this.results = Collections.unmodifiableList(results);
    }

    public String getId() { return id; }
    public String getResourceType() { return resourceType; }
    public String getStatus() { return status; }
    public String getSubjectReference() { return subjectReference; }
    public Instant getIssued() { return issued; }
    public List<Observation> getResults() { return results; }

    public boolean hasCriticalResult() {
        return results.stream().anyMatch(Observation::isCritical);
    }
}
