package com.company.sentinel.domain.model;

import java.time.Instant;
import java.util.UUID;

public class Observation {

    private final String id;
    private final String resourceType = "Observation";
    private final String status;
    private final ObservationCode code;
    private final String subjectReference;   // e.g. "Patient/123"
    private final ValueQuantity valueQuantity;
    private InterpretationCode interpretation;
    private final Instant effectiveDateTime;
    private boolean piiMasked = false;

    public Observation(String subjectReference, ObservationCode code, ValueQuantity valueQuantity) {
        this.id = UUID.randomUUID().toString();
        this.status = "final";
        this.code = code;
        this.subjectReference = subjectReference;
        this.valueQuantity = valueQuantity;
        this.effectiveDateTime = Instant.now();
        this.interpretation = InterpretationCode.N;
    }

    public Observation(String id, String subjectReference, ObservationCode code,
                       ValueQuantity valueQuantity, InterpretationCode interpretation,
                       Instant effectiveDateTime) {
        this.id = id;
        this.status = "final";
        this.subjectReference = subjectReference;
        this.code = code;
        this.valueQuantity = valueQuantity;
        this.interpretation = interpretation;
        this.effectiveDateTime = effectiveDateTime;
    }

    public String getId() { return id; }
    public String getResourceType() { return resourceType; }
    public String getStatus() { return status; }
    public ObservationCode getCode() { return code; }
    public String getSubjectReference() { return subjectReference; }
    public ValueQuantity getValueQuantity() { return valueQuantity; }
    public InterpretationCode getInterpretation() { return interpretation; }
    public Instant getEffectiveDateTime() { return effectiveDateTime; }
    public boolean isPiiMasked() { return piiMasked; }

    public void setInterpretation(InterpretationCode interpretation) {
        this.interpretation = interpretation;
    }

    public void maskPii() {
        this.piiMasked = true;
    }

    public boolean isCritical() {
        return interpretation == InterpretationCode.LL || interpretation == InterpretationCode.HH;
    }
}
