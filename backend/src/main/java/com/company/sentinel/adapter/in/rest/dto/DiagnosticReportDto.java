package com.company.sentinel.adapter.in.rest.dto;

import com.company.sentinel.domain.model.DiagnosticReport;

import java.time.Instant;
import java.util.List;
import java.util.Map;

public record DiagnosticReportDto(
        String resourceType,
        String id,
        String status,
        Map<String, String> subject,
        Instant issued,
        List<ObservationDto> result,
        boolean hasCriticalResult
) {
    public static DiagnosticReportDto from(DiagnosticReport report) {
        List<ObservationDto> results = report.getResults()
                .stream()
                .map(ObservationDto::from)
                .toList();

        return new DiagnosticReportDto(
                report.getResourceType(),
                report.getId(),
                report.getStatus(),
                Map.of("reference", report.getSubjectReference()),
                report.getIssued(),
                results,
                report.hasCriticalResult()
        );
    }
}
