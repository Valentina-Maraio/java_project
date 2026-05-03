package com.company.sentinel.adapter.in.rest;

import org.hibernate.envers.AuditReader;
import org.hibernate.envers.AuditReaderFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.persistence.EntityManager;
import java.util.List;

@RestController
@RequestMapping("/api/audit")
public class AuditController {

    private final EntityManager entityManager;

    public AuditController(EntityManager entityManager) {
        this.entityManager = entityManager;
    }

    @GetMapping("/{id}/revisions")
    public ResponseEntity<List<Number>> getRevisions(@PathVariable String id) {
        AuditReader reader = AuditReaderFactory.get(entityManager);
        List<Number> revisions = reader.getRevisions(
                com.company.sentinel.adapter.out.persistence.ObservationEntity.class, id);

        if (revisions.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(revisions);
    }

    @GetMapping("/{id}/revisions/{rev}")
    public ResponseEntity<Object> getAtRevision(
            @PathVariable String id,
            @PathVariable Number rev) {

        AuditReader reader = AuditReaderFactory.get(entityManager);
        Object snapshot = reader.find(
                com.company.sentinel.adapter.out.persistence.ObservationEntity.class, id, rev);

        if (snapshot == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(snapshot);
    }
}
