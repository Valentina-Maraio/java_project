package com.company.sentinel.adapter.in.rest;

import com.company.sentinel.adapter.in.rest.dto.DiagnosticReportDto;
import com.company.sentinel.domain.model.DiagnosticReport;
import com.company.sentinel.domain.model.Observation;
import com.company.sentinel.domain.ports.out.LabResultRepositoryPort;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/fhir/DiagnosticReport")
public class DiagnosticReportController {

    private final LabResultRepositoryPort repository;

    public DiagnosticReportController(LabResultRepositoryPort repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<DiagnosticReportDto> listAll() {
        Map<String, List<Observation>> byPatient = repository.findAll().stream()
                .collect(Collectors.groupingBy(Observation::getSubjectReference));

        return byPatient.entrySet().stream()
                .map(e -> new DiagnosticReport(e.getKey(), e.getValue()))
                .map(DiagnosticReportDto::from)
                .toList();
    }
}
