package com.company.sentinel.adapter.in.rest.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.company.sentinel.domain.model.Observation;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ObservationDto(
        String resourceType,
        String id,
        String status,
        Map<String, Object> code,
        Map<String, String> subject,
        Map<String, Object> valueQuantity,
        List<Map<String, Object>> interpretation,
        Instant effectiveDateTime,
        boolean critical,
        boolean piiMasked
) {
    public static ObservationDto from(Observation obs) {
        Map<String, Object> codingEntry = Map.of(
                "system", obs.getCode().system(),
                "code", obs.getCode().code(),
                "display", obs.getCode().display()
        );
        Map<String, Object> codeBlock = Map.of("coding", List.of(codingEntry));

        Map<String, String> subject = Map.of(
                "reference", obs.isPiiMasked() ? "Patient/REDACTED" : obs.getSubjectReference()
        );

        Map<String, Object> valueQty = Map.of(
                "value", obs.getValueQuantity().value(),
                "unit", obs.getValueQuantity().unit()
        );

        Map<String, Object> interpCoding = Map.of(
                "code", obs.getInterpretation().name(),
                "display", obs.getInterpretation().getDisplay()
        );
        List<Map<String, Object>> interpretation = List.of(
                Map.of("coding", List.of(interpCoding))
        );

        return new ObservationDto(
                obs.getResourceType(),
                obs.getId(),
                obs.getStatus(),
                codeBlock,
                subject,
                valueQty,
                interpretation,
                obs.getEffectiveDateTime(),
                obs.isCritical(),
                obs.isPiiMasked()
        );
    }
}
