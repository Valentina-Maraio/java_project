package com.company.sentinel.adapter.in.rest;

import com.company.sentinel.adapter.in.rest.dto.DiagnosticReportDto;
import com.company.sentinel.adapter.in.rest.dto.ObservationDto;
import com.company.sentinel.application.IntegrityEvidence;
import com.company.sentinel.application.IntegrityEvidenceService;
import com.company.sentinel.domain.model.DiagnosticReport;
import com.company.sentinel.domain.model.Observation;
import com.company.sentinel.domain.ports.out.LabResultRepositoryPort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/integrity")
public class IntegrityController {

    private final LabResultRepositoryPort repository;
    private final IntegrityEvidenceService integrityEvidenceService;

    public IntegrityController(
            LabResultRepositoryPort repository,
            IntegrityEvidenceService integrityEvidenceService
    ) {
        this.repository = repository;
        this.integrityEvidenceService = integrityEvidenceService;
    }

    @GetMapping("/observation/{id}")
    public ResponseEntity<IntegrityEvidence> observationEvidence(@PathVariable String id) {
        return repository.findById(id)
                .map(obs -> integrityEvidenceService.hashResource(
                        obs.getResourceType(),
                        obs.getId(),
                        ObservationDto.from(obs)
                ))
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/diagnostic-report/subject/{patientId}")
    public ResponseEntity<IntegrityEvidence> diagnosticReportEvidence(@PathVariable String patientId) {
        List<Observation> observations = repository.findBySubjectReference("Patient/" + patientId);
        if (observations.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        DiagnosticReport report = toDiagnosticReport("Patient/" + patientId, observations);
        IntegrityEvidence evidence = integrityEvidenceService.hashResource(
                report.getResourceType(),
                report.getId(),
                DiagnosticReportDto.from(report)
        );
        return ResponseEntity.ok(evidence);
    }

    @PostMapping("/hash")
    public IntegrityEvidence hashRawResource(
            @RequestBody Map<String, Object> resource,
            @RequestParam(defaultValue = "Unknown") String resourceType,
            @RequestParam(defaultValue = "ad-hoc") String resourceId
    ) {
        return integrityEvidenceService.hashResource(resourceType, resourceId, resource);
    }

    private DiagnosticReport toDiagnosticReport(String subjectReference, List<Observation> observations) {
        Instant issued = observations.stream()
                .map(Observation::getEffectiveDateTime)
                .max(Comparator.naturalOrder())
                .orElse(Instant.now());
        return new DiagnosticReport(subjectReference, observations, issued);
    }
}