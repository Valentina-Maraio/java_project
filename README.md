# Project Sentinel — Diagnostic Middleware

> **Company Digital Excellence & Interoperability** — A high-performance middleware that bridges diagnostic laboratory instruments with clinical dashboards using HL7 FHIR R4.

---
The project is not online yet, so you can see how it looks like ![HERE](https://youtu.be/nE0HGuDr_IU)
---

## Overview

Project Sentinel ingests raw lab data from a simulated Company cobas analyzer, transforms it into FHIR R4 Observation resources, validates results against clinical thresholds, and streams validated data in real-time to a React dashboard — all within a single `docker-compose up` command.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Hexagonal (Ports & Adapters)  — Java 21 / Spring Boot 3│
│                                                         │
│  IngestionAdapter (@Scheduled)                          │
│       │                                                 │
│       ▼  LabResultInPort (use-case)                     │
│  LabResultService  ──► ValidationService                │
│       │                    (LL/HH thresholds)           │
│       ├──► LabResultRepositoryAdapter (JPA + Envers)    │
│       └──► NotificationAdapter (STOMP WebSocket)        │
│                                                         │
│  REST: /fhir/Observation  /fhir/DiagnosticReport        │
│        /api/audit/{id}/revisions                        │
└────────────────────────┬────────────────────────────────┘
                         │ WebSocket /topic/results
┌────────────────────────▼────────────────────────────────┐
│  React 18 + TypeScript  — Vite / Tailwind CSS           │
│                                                         │
│  ResultsTable  ─ live rows, critical pulse #E64141      │
│  TrendChart    ─ Recharts Patient Trend Line            │
│  PrivacyToggle ─ GDPR PII masking header toggle         │
│  AlertBanner   ─ critical result global context alert   │
└─────────────────────────────────────────────────────────┘
```

---

## Quick Start

### Prerequisites
- Docker ≥ 24 and Docker Compose v2
- (For local dev) Java 21 + Maven 3.9, Node 20+

### Run the full stack

```bash
docker-compose up --build
```

| Service  | URL |
|----------|-----|
| Dashboard | http://localhost:3000 |
| Backend API | http://localhost:8080 |
| PostgreSQL | localhost:5432 |

---

## Key Features

### HL7 FHIR R4 Compliance
All API responses use FHIR-Lite Observation and DiagnosticReport resources with LOINC codes (e.g., `2339-0` for Glucose).

### Critical Result Detection
```
Glucose < 50 mg/dL  →  interpretation: LL (Critical Low)   🔴
Glucose > 400 mg/dL →  interpretation: HH (Critical High)  🔴
```
Critical rows pulse red (`#E64141`) in real-time on the dashboard.

### Chain of Custody (FDA/HIPAA)
Every Observation write is tracked by **Hibernate Envers**. Retrieve the full audit trail:
```
GET /api/audit/{observationId}/revisions
GET /api/audit/{observationId}/revisions/{rev}
```

### Real-Time Streaming
Spring WebSocket (STOMP) pushes validated observations to the frontend immediately — no polling delay.

### PII Masking (GDPR)
Toggle `X-Mask-PII: true` header (or use the UI switch) to replace patient identifiers with `Patient/REDACTED` in all API responses.

### Security
- OAuth2 JWT resource server (Spring Security)
- Stateless, CORS-restricted to frontend origin
- TLS 1.3 configuration included (see `application.yml` comments)

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/fhir/Observation` | All observations (supports `X-Mask-PII` header) |
| `GET` | `/fhir/Observation/{id}` | Single observation by ID |
| `GET` | `/fhir/Observation/subject/{patientId}` | Observations by patient |
| `GET` | `/fhir/DiagnosticReport` | Reports grouped by patient |
| `GET` | `/api/audit/{id}/revisions` | Envers revision list for an observation |
| `GET` | `/api/audit/{id}/revisions/{rev}` | Observation state at a given revision |
| `WS`  | `/ws` (STOMP) → `/topic/results` | Real-time observation stream |

---

## Project Structure

```
java_project/
├── backend/                    # Spring Boot 3 / Java 21
│   ├── src/main/java/com/company/sentinel/
│   │   ├── domain/
│   │   │   ├── model/          # Observation, DiagnosticReport, enums
│   │   │   └── ports/          # in/ and out/ port interfaces
│   │   ├── application/        # LabResultService, DataMaskingService
│   │   ├── adapter/
│   │   │   ├── in/
│   │   │   │   ├── rest/       # Controllers, DTOs, GlobalExceptionHandler
│   │   │   │   └── scheduling/ # IngestionAdapter (@Scheduled)
│   │   │   └── out/
│   │   │       ├── persistence/ # ObservationEntity (@Audited), JPA repo
│   │   │       └── messaging/   # NotificationAdapter (STOMP)
│   │   └── config/             # SecurityConfig, WebSocketConfig
│   └── src/main/resources/application.yml
├── frontend/                   # React 18 + TypeScript + Tailwind
│   └── src/
│       ├── components/         # ResultsTable, TrendChart, PrivacyToggle, AlertBanner
│       ├── context/            # AlertContext (global critical state)
│       ├── hooks/              # useWebSocket
│       └── types/              # fhir.ts (FHIR-Lite TypeScript types)
├── docker-compose.yml
└── specs.md
```

---

## Company Digital Excellence Alignment

| Company Goal | How Sentinel Addresses It |
|---|---|
| **Interoperability** | Native FHIR R4 JSON payloads, LOINC codes, STOMP streaming |
| **Digital Excellence** | Hexagonal architecture enables plug-and-play instrument adapters |
| **Compliance (FDA/HIPAA)** | Envers chain-of-custody audit on every data write |
| **Privacy (GDPR)** | Server-side PII masking utility, client-side toggle |
| **Security** | OAuth2 JWT, stateless, TLS 1.3-ready |
