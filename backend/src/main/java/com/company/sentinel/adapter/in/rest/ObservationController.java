package com.company.sentinel.adapter.in.rest;

import com.company.sentinel.adapter.in.rest.dto.ObservationDto;
import com.company.sentinel.application.DataMaskingService;
import com.company.sentinel.domain.ports.out.LabResultRepositoryPort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/fhir/Observation")
public class ObservationController {

    private final LabResultRepositoryPort repository;
    private final DataMaskingService dataMaskingService;

    public ObservationController(LabResultRepositoryPort repository,
                                  DataMaskingService dataMaskingService) {
        this.repository = repository;
        this.dataMaskingService = dataMaskingService;
    }

    @GetMapping
    public List<ObservationDto> listAll(
            @RequestHeader(value = "X-Mask-PII", defaultValue = "false") boolean maskPii) {

        return repository.findAll().stream()
                .map(obs -> maskPii ? dataMaskingService.mask(obs) : obs)
                .map(ObservationDto::from)
                .toList();
    }

    @GetMapping("/{id}")
    public ResponseEntity<ObservationDto> getById(
            @PathVariable String id,
            @RequestHeader(value = "X-Mask-PII", defaultValue = "false") boolean maskPii) {

        return repository.findById(id)
                .map(obs -> maskPii ? dataMaskingService.mask(obs) : obs)
                .map(ObservationDto::from)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/subject/{patientId}")
    public List<ObservationDto> bySubject(
            @PathVariable String patientId,
            @RequestHeader(value = "X-Mask-PII", defaultValue = "false") boolean maskPii) {

        String ref = "Patient/" + patientId;
        return repository.findBySubjectReference(ref).stream()
                .map(obs -> maskPii ? dataMaskingService.mask(obs) : obs)
                .map(ObservationDto::from)
                .toList();
    }
}
