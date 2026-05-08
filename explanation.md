# Project Sentinel — Developer Guide

A complete walkthrough of the Sentinel application for junior developers. Read this from top to bottom before touching any code.

---

## Table of Contents

1. [What is Sentinel?](#1-what-is-sentinel)
2. [How the Pieces Connect](#2-how-the-pieces-connect)
3. [Backend (Spring Boot)](#3-backend-spring-boot)
   - [3.1 Hexagonal Architecture](#31-hexagonal-architecture)
   - [3.2 Domain Model](#32-domain-model)
   - [3.3 Application Services](#33-application-services)
   - [3.4 REST Endpoints](#34-rest-endpoints)
   - [3.5 Real-Time Streaming (WebSocket)](#35-real-time-streaming-websocket)
   - [3.6 Data Ingestion (Scheduler)](#36-data-ingestion-scheduler)
   - [3.7 Security](#37-security)
   - [3.8 Audit Trail](#38-audit-trail)
   - [3.9 Configuration Reference](#39-configuration-reference)
4. [Frontend (React + TypeScript)](#4-frontend-react--typescript)
   - [4.1 Tech Stack](#41-tech-stack)
   - [4.2 Data Flow](#42-data-flow)
   - [4.3 Hooks](#43-hooks)
   - [4.4 Alert Notifications (Context)](#44-alert-notifications-context)
   - [4.5 Component Map](#45-component-map)
   - [4.6 PII Masking Toggle](#46-pii-masking-toggle)
   - [4.7 Development Proxy](#47-development-proxy)
5. [Docker Setup](#5-docker-setup)
   - [5.1 docker-compose.yml](#51-docker-composeyml)
   - [5.2 Backend Dockerfile](#52-backend-dockerfile)
   - [5.3 Frontend Dockerfile](#53-frontend-dockerfile)
   - [5.4 nginx.conf](#54-nginxconf)
   - [5.5 Environment Variables](#55-environment-variables)
6. [Cloud Deployment (render.yaml)](#6-cloud-deployment-renderyaml)
7. [Running Locally](#7-running-locally)
8. [Glossary](#8-glossary)

---

## 1. What is Sentinel?

Sentinel is a **real-time clinical laboratory monitoring platform**. It has two jobs:

1. **Ingest lab results** — it simulates readings from cobas laboratory instruments (glucose measurements), validates them against clinical thresholds, and stores them in a database.
2. **Display those results live** — a web dashboard shows healthcare professionals each patient's observations, flags critical values in real time, and lets operators toggle patient privacy (PII masking).

The data format used throughout is **HL7 FHIR R4** (an international standard for exchanging healthcare data). If you see terms like `Observation`, `DiagnosticReport`, or LOINC codes, those come from FHIR.

### Tech Stack at a Glance

| Layer | Technology |
|---|---|
| Backend language | Java 21 |
| Backend framework | Spring Boot 3.2 |
| Database | PostgreSQL 16 |
| Audit trail | Hibernate Envers |
| Real-time messaging | WebSocket + STOMP protocol |
| Authentication | OAuth2 with JWT tokens |
| Frontend language | TypeScript 5 |
| Frontend framework | React 18 |
| Data fetching | TanStack React Query |
| Charts | Recharts |
| Styling | Tailwind CSS |
| Build tool | Vite |
| Containerisation | Docker + Docker Compose |
| Production proxy | nginx |
| Cloud platform | Render.com |

---

## 2. How the Pieces Connect

Here is the full end-to-end data flow, from simulated instrument to browser:

```
┌───────────────────────────────────────────────────────────────────────┐
│                        BACKEND  (port 8080)                           │
│                                                                       │
│  ┌────────────────┐   ┌───────────────────┐    ┌───────────────────┐  │
│  │IngestionAdapter│   │  LabResultService │    │NotificationAdapter│  │
│  │ @Scheduled     │──▶│  (validates &     │──▶ │  (WebSocket push) │  │
│  │ every 5 s      │   │   persists)       │    │  /topic/results   │  │
│  └────────────────┘   └────────┬──────────┘    └──────┬────────────┘  │
│                                │ saves                │ broadcasts    │
│                         ┌──────▼───────┐              │               │
│                         │  PostgreSQL  │              │               │
│                         │  (+ _aud     │              │               │
│                         │   audit tbl) │              │               │
│                         └──────────────┘              │               │
└───────────────────────────────────────────────────────┼───────────────┘
                                                        │ STOMP WS
               REST /fhir/** and /api/**                │
                        ▲                               ▼
┌───────────────────────┼───────────────────────────────┼────────────────┐
│                   FRONTEND  (port 3000)                                │
│                                                                        │
│  ┌───────────────────────┐          ┌───────────────────────────────┐  │
│  │  React Query poll     │          │  useWebSocket (STOMP client)  │  │
│  │  GET /fhir/Observation|          │subscribes /topic/results      │  |
│  │  every 10 s           │          └──────────────┬────────────────┘  │
│  └───────────────────────┘                         │                   │
│           │                                        │                   │
│           └─────────────────┬──────────────────────┘                   │
│                             ▼                                          │
│                    useObservations hook                                │
│                    (merges + deduplicates)                             │
│                             │                                          │
│                    ┌────────▼─────────┐                                │
│                    │   AlertContext   │ (critical notification hub)    │
│                    └────────┬─────────┘                                │
│                             │                                          │
│                       Dashboard UI                                     │
│           (charts, results table, patient panel)                       │
└────────────────────────────────────────────────────────────────────────┘
```

**Key insight:** The frontend gets data in two ways simultaneously — polling via REST every 10 seconds as a safety net, and receiving live pushes via WebSocket the moment a new observation is processed. Duplicates are filtered out by observation ID.

---

## 3. Backend (Spring Boot)

The backend lives in `backend/src/main/java/com/company/sentinel/`.

### 3.1 Hexagonal Architecture

The backend follows **Hexagonal Architecture** (also called Ports & Adapters). This sounds complex but the rule is simple: **the core business logic never depends on infrastructure** (HTTP, database, WebSocket). Only infrastructure depends on the core.

There are three layers:

```
backend/src/main/java/com/company/sentinel/
│
├── domain/                   ← CORE (no Spring annotations here)
│   ├── model/                   Pure Java classes: what a lab result IS
│   └── ports/
│       └── in/                  Interfaces: what the app CAN DO
│           └── LabResultInPort
│
├── application/              ← BUSINESS LOGIC
│   ├── LabResultService         Implements LabResultInPort
│   └── DataMaskingService       GDPR masking logic
│
├── adapter/                  ← INFRASTRUCTURE (pluggable)
│   └── in/
│       ├── rest/                HTTP REST controllers
│       └── scheduling/          @Scheduled ingestion trigger
│
└── config/                   ← CONFIGURATION
    ├── SecurityConfig           OAuth2 + CORS
    └── WebSocketConfig          STOMP endpoint
```

**Why does this matter?** You can swap the database, change the REST framework, or replace the WebSocket library without ever touching `LabResultService` or any domain model. The application layer only talks to interfaces (ports), never to concrete implementations.

### 3.2 Domain Model

These are the core data structures. They live in `domain/model/` and are plain Java — no Spring, no JPA annotations.

#### `Observation`

Represents a single lab measurement for a patient. This is a FHIR `Observation` resource.

| Field | Type | Example | Description |
|---|---|---|---|
| `id` | String (UUID) | `"a1b2c3..."` | Unique identifier |
| `resourceType` | String | `"Observation"` | Always `"Observation"` (FHIR) |
| `status` | String | `"final"` | Always `"final"` |
| `code` | ObservationCode | glucose LOINC | What was measured |
| `subjectReference` | String | `"Patient/101"` | Which patient |
| `valueQuantity` | ValueQuantity | `{95.0, "mg/dL"}` | The measured value |
| `interpretation` | InterpretationCode | `N` | Clinical meaning |
| `effectiveDateTime` | Instant | `2026-05-04T10:30:00Z` | When measured |
| `piiMasked` | boolean | `false` | Whether patient ID is hidden |

**Key methods:**
- `isCritical()` — returns `true` if interpretation is `LL` or `HH`
- `maskPii()` — marks the observation so the patient reference becomes `Patient/REDACTED`

#### `InterpretationCode` — Glucose Thresholds

This enum defines the clinical meaning of a glucose value:

| Code | Display | Glucose Range | Critical? |
|---|---|---|---|
| `LL` | Critical Low | < 50 mg/dL | **Yes** — triggers alert |
| `L` | Low | 50 – 69 mg/dL | No |
| `N` | Normal | 70 – 200 mg/dL | No |
| `H` | High | 201 – 400 mg/dL | No |
| `HH` | Critical High | > 400 mg/dL | **Yes** — triggers alert |

Only `LL` and `HH` results trigger the alert banner and push notifications in the dashboard.

#### `ValueQuantity`

An immutable Java record holding the numeric value and its unit:

```java
record ValueQuantity(double value, String unit)
// Example: new ValueQuantity(95.0, "mg/dL")
```

#### `ObservationCode`

An immutable Java record holding the LOINC code for the type of test:

```java
record ObservationCode(String system, String code, String display)
// Factory: ObservationCode.glucose() → LOINC "2339-0" (Glucose)
```

#### `DiagnosticReport`

Groups multiple `Observation` objects for a single patient into a summary report.

| Field | Description |
|---|---|
| `id` | UUID |
| `subjectReference` | Patient reference |
| `issued` | Report creation timestamp |
| `results` | Immutable list of `Observation` objects |

**Key method:** `hasCriticalResult()` — returns `true` if any observation in `results` is critical.

### 3.3 Application Services

#### `LabResultService`

This is the heart of the application. When a new observation arrives, it:

1. **Validates** — determines the `InterpretationCode` by comparing the glucose value against the thresholds in the table above
2. **Persists** — saves the validated observation to PostgreSQL via `LabResultRepositoryPort`
3. **Notifies** — broadcasts the observation over WebSocket via `NotificationPort`

The method is `@Transactional`, meaning if any step fails, the whole operation is rolled back.

```
LabResultService.processLabResult(observation)
    │
    ├── 1. if value < 50   → set LL
    ├──    if value < 70   → set L
    ├──    if value ≤ 200  → set N
    ├──    if value ≤ 400  → set H
    ├──    else            → set HH
    │
    ├── 2. labResultRepositoryPort.save(observation)
    │
    └── 3. notificationPort.notifyObservation(observation)
```

#### `DataMaskingService`

Implements GDPR privacy compliance. When a client requests masked data, this service:

- Creates a copy of the `Observation`
- Replaces `subjectReference` (e.g. `"Patient/101"`) with `"Patient/REDACTED"`
- Sets the `piiMasked = true` flag

This is triggered by the `X-Mask-PII: true` HTTP header on REST requests.

### 3.4 REST Endpoints

All controllers live in `adapter/in/rest/`. Errors are handled globally by `GlobalExceptionHandler`, which returns FHIR `OperationOutcome` JSON for both 400 and 500 errors.

#### `/fhir/Observation`

| Method | Path | Description | Auth Required |
|---|---|---|---|
| `GET` | `/fhir/Observation` | List all observations | No |
| `GET` | `/fhir/Observation/{id}` | Get one observation by ID | No |
| `GET` | `/fhir/Observation/subject/{patientId}` | Get all observations for a patient | No |

**Optional request header:** `X-Mask-PII: true` — when present, patient references are replaced with `Patient/REDACTED` in the response.

**Response format:** `ObservationDto` (mirrors the `Observation` domain object in JSON)

#### `/fhir/DiagnosticReport`

| Method | Path | Description | Auth Required |
|---|---|---|---|
| `GET` | `/fhir/DiagnosticReport` | List all reports (one per patient) | No |

Groups all observations by patient and includes a `hasCriticalResult` flag per report.

#### `/api/audit`

Used for chain-of-custody — shows the full history of changes to any observation (powered by Hibernate Envers).

| Method | Path | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/audit/{id}/revisions` | List all revision numbers for an observation | No |
| `GET` | `/api/audit/{id}/revisions/{rev}` | Get the exact state of an observation at revision `rev` | No |

### 3.5 Real-Time Streaming (WebSocket)

WebSocket allows the server to **push data to the browser** without the browser having to ask. Sentinel uses the **STOMP** protocol on top of WebSocket (STOMP adds message routing, like topics).

**Configuration** (`WebSocketConfig`):

| Setting | Value |
|---|---|
| WebSocket endpoint | `/ws` (with SockJS fallback) |
| Message broker prefix | `/topic` |
| App destination prefix | `/app` |

**Flow:**

```
LabResultService.processLabResult()
        ↓
NotificationAdapter.notifyObservation(observation)
        ↓
SimpMessagingTemplate.convertAndSend("/topic/results", observationDto)
        ↓
All connected browser clients receive the observation instantly
```

Frontend clients subscribe to `/topic/results`. Every time the backend processes a new lab result, it appears on screen without a page refresh.

### 3.6 Data Ingestion (Scheduler)

`IngestionAdapter` (in `adapter/in/scheduling/`) uses Spring's `@Scheduled` annotation to simulate a cobas instrument sending readings every 5 seconds (configurable via `INGESTION_INTERVAL_MS`).

On each tick it:
1. Generates a random glucose value for a simulated patient
2. Creates an `Observation` domain object
3. Calls `LabResultInPort.processLabResult()` to kick off the full validation + persistence + notification pipeline

This is the entry point that drives all data in the system during development and demos.

### 3.7 Security

Security is configured in `SecurityConfig`. The app is a **stateless OAuth2 Resource Server** — it validates Bearer JWT tokens on protected routes but does not issue tokens itself (a separate identity provider like Keycloak would do that).

**Session policy:** Stateless — no server-side sessions, no cookies.  
**CSRF:** Disabled (not needed for stateless APIs).

**Route access rules:**

| Route pattern | Access |
|---|---|
| `/ws/**` | Public (WebSocket must be open before auth) |
| `/actuator/health/**` | Public (Docker health checks) |
| `GET /fhir/**` | Public (read lab data) |
| `GET /api/audit/**` | Public (read audit trail) |
| `OPTIONS /**` | Public (CORS preflight requests) |
| Everything else | Requires valid JWT Bearer token |

**CORS:** Configured via the `CORS_ALLOWED_ORIGINS` environment variable (defaults to `http://localhost:*`). Allowed methods: GET, POST, PUT, DELETE, OPTIONS. Credentials are enabled.

### 3.8 Audit Trail

Sentinel uses **Hibernate Envers** to automatically record every change (create, update, delete) made to observation records. This satisfies FDA and HIPAA chain-of-custody requirements.

How it works:
- For every `@Audited` entity, Envers creates a parallel `_aud` table in PostgreSQL (e.g. `observation_aud`)
- Each row in `_aud` has a revision number, revision timestamp, and the entity state at that moment
- When an observation is deleted, its last state is still preserved (`store_data_on_delete: true`)
- The `AuditController` exposes this history via the `/api/audit/{id}/revisions` endpoints

### 3.9 Configuration Reference

All sensitive values come from environment variables. The `application.yml` defines defaults for local development.

| Environment Variable | Default | Description |
|---|---|---|
| `SERVER_PORT` | `8080` | Port the backend listens on |
| `DB_HOST` | — | PostgreSQL hostname |
| `DB_PORT` | — | PostgreSQL port |
| `DB_NAME` | — | Database name |
| `DB_USER` | — | Database username |
| `DB_PASSWORD` | — | Database password |
| `JWT_ISSUER_URI` | `http://localhost:8180/realms/sentinel` | OAuth2 token issuer URL |
| `INGESTION_INTERVAL_MS` | `5000` | How often (ms) the scheduler generates new lab results |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:*` | Allowed origins for CORS |

---

## 4. Frontend (React + TypeScript)

The frontend lives in `frontend/src/`.

### 4.1 Tech Stack

| Library | Version | Purpose |
|---|---|---|
| React | 18 | UI framework |
| TypeScript | 5 | Type safety |
| TanStack React Query | 5 | Data fetching, caching, polling |
| Recharts | 2 | Charts and data visualisation |
| `@stomp/stompjs` | 7 | STOMP WebSocket client |
| `sockjs-client` | 1.6 | WebSocket transport with fallback |
| Tailwind CSS | 3.4 | Utility-first styling |
| Vite | 5 | Development server + production bundler |

### 4.2 Data Flow

The dashboard receives data from two sources simultaneously:

```
                ┌───────────────────────────────────┐
                │         useObservations()         │
                │                                   │
  React Query ──▶  GET /fhir/Observation (10s poll) │
                │            +                      │
  WebSocket   ──▶  /topic/results (live push)       │
                │                                   │
                │  merge by ID (deduplication)      │
                └──────────────┬────────────────────┘
                               │
                    ┌──────────▼──────────┐
                    │    AlertContext     │
                    │  addCritical(obs)   │ ← called for LL/HH only
                    └──────────┬──────────┘
                               │
                        Components re-render
                     (charts, table, notifications)
```

- **Polling** is the safety net: if WebSocket drops, data still refreshes every 10 seconds.
- **WebSocket** gives instant updates: a critical alert appears on screen the moment the backend processes it.
- **Deduplication** prevents showing the same observation twice when both sources deliver it.

### 4.3 Hooks

#### `useObservations` (`hooks/useObservations.ts`)

The primary data hook used by the dashboard. Options:

```typescript
useObservations({ maskPii: boolean, onCritical?: (obs: Observation) => void })
```

- Fetches from `GET /fhir/Observation`
  - Adds `X-Mask-PII: true` header when `maskPii` is `true`
  - React Query: refetch every 10 s, stale time 10 s
- Also receives live observations from WebSocket (via `useWebSocket`)
- Merges both streams, deduplicating by `observation.id`
- Calls `onCritical(obs)` for any observation where `isCritical === true` that hasn't been seen before
- Returns: `{ observations: Observation[], isLoading: boolean }`

#### `useWebSocket` (`hooks/useWebSocket.ts`)

Manages the STOMP connection lifecycle:

- Connects to the `/ws` endpoint using SockJS
- Subscribes to `/topic/results`
- Reconnects automatically after a 5-second delay on disconnect
- Calls a callback with each incoming `Observation` message
- Disconnects cleanly when the component unmounts

### 4.4 Alert Notifications (Context)

`AlertContext` (`context/AlertContext.tsx`) is a React context that acts as a global notification hub for critical results.

**State it manages:**

| Property | Type | Description |
|---|---|---|
| `notifications` | `CriticalNotification[]` | Up to 50 recent critical alerts |
| `unreadCount` | `number` | How many unread notifications |
| `criticalCount` | `number` | Total notifications ever received |
| `lastCritical` | `Observation \| null` | The most recent critical observation |

**Actions:**

| Function | Description |
|---|---|
| `addCritical(obs)` | Adds a new critical notification (called by `useObservations`) |
| `dismissNotification(id)` | Removes one notification |
| `markAllRead()` | Marks all notifications as read (clears badge) |

Wrap the app in `<AlertProvider>` (already done in `App.tsx`) and use `useAlert()` in any component to access this state.

### 4.5 Component Map

#### Layout Components

| Component | File | Purpose |
|---|---|---|
| `App` | `App.tsx` | Root component. Wraps everything in `AlertProvider` and `QueryClientProvider`. Renders the Dashboard. |
| `Dashboard` | `App.tsx` | Main layout. Manages `selectedPatient`, `maskPii`, and `notificationsOpen` state. Assembles all child components in a grid. |
| `PatientMenu` | `components/PatientMenu.tsx` | Left sidebar. Lists all patients with critical result count badges. Clicking a patient filters the dashboard. |
| `PrivacyToggle` | `components/PrivacyToggle.tsx` | Toggle switch in the header. When on, all patient references become `Patient/REDACTED` across the entire dashboard. |

#### Data Display Components

| Component | File | Purpose |
|---|---|---|
| `ResultsTable` | `components/ResultsTable.tsx` | Paginated table of observations (6 per page). Highlights critical rows in red. Respects PII masking. |
| `PatientDetailPanel` | `components/PatientDetailPanel.tsx` | Right sidebar. Shows stats for the selected patient: total results, critical count, latest value, and recent critical events. |
| `AlertBanner` | `components/AlertBanner.tsx` | Inline banner showing the last critical result. Shows a `+N` badge if multiple alerts are queued. |
| `NotificationsDialog` | `components/NotificationsDialog.tsx` | Modal dialog listing all critical notifications with timestamps and dismiss buttons. |

#### Chart Components

All charts use [Recharts](https://recharts.org/). They receive `observations: Observation[]` as a prop and derive their own aggregated data.

| Component | Chart Type | What it shows |
|---|---|---|
| `TrendChart` | Line chart | Glucose values over time with clinical threshold reference lines (50 mg/dL critical low, 400 mg/dL critical high) |
| `PatientTrendMovingAverageChart` | Dual line chart | Raw values + a 5-point moving average overlay for trend smoothing |
| `GlucoseHistogramChart` | Bar chart | Distribution of values across 5 clinical bins: <70, 70–139, 140–199, 200–399, 400+ |
| `PatientValueHourScatterChart` | Scatter chart | Value vs. hour of day; normal points in blue, critical points in red |
| `CriticalEventsChart` | Line chart | Count of critical events per hour of day |
| `InterpretationBreakdownChart` | Donut pie chart | Proportion of results by interpretation code (LL, L, N, H, HH), colour-coded |
| `PatientVolatilityChart` | Bar chart | Value range (max − min) in 4-hour windows, showing how stable readings are |
| `PatientHourlyDistributionChart` | Composed chart | Count (bars) + average value (line) per hour of day on dual Y-axes |
| `PatientComparisonChart` | Bar chart | Average glucose for the top 8 patients, sorted descending |

### 4.6 PII Masking Toggle

The `PrivacyToggle` component in the header drives a `maskPii` boolean in `Dashboard` state. When toggled:

1. `useObservations({ maskPii: true })` sends `X-Mask-PII: true` in the request header
2. The backend `DataMaskingService` replaces all `subjectReference` values with `"Patient/REDACTED"` before returning the response
3. All components that display patient references automatically show the masked value

This is a **backend-side** masking — the browser never receives real patient IDs when the toggle is on.

### 4.7 Development Proxy

During development (`npm run dev`), Vite proxies API calls from the dev server (`localhost:3000`) to the backend (`localhost:8080`) so there are no CORS issues:

| Path | Proxied to | Notes |
|---|---|---|
| `/fhir/*` | `http://localhost:8080` | REST API |
| `/api/*` | `http://localhost:8080` | REST API |
| `/ws` | `http://localhost:8080/ws` | WebSocket with upgrade headers |

This proxy only runs in development. In production, nginx handles the same routing (see Section 5.4).

---

## 5. Docker Setup

Three Docker containers make up the stack. They start in a specific order enforced by health checks.

### 5.1 docker-compose.yml

**Startup order:** `db` must be healthy → then `backend` starts → once `backend` is healthy → then `frontend` starts.

```
db (PostgreSQL 16)
  └─ healthcheck: pg_isready
        ↓ (healthy)
backend (Spring Boot on port 8080)
  └─ healthcheck: curl /actuator/health
        ↓ (healthy)
frontend (nginx on port 3000)
```

**Services summary:**

| Service | Image/Build | Host Port | Container Port | Purpose |
|---|---|---|---|---|
| `db` | `postgres:16-alpine` | 5432 | 5432 | PostgreSQL database |
| `backend` | `./backend/Dockerfile` | 8080 | 8080 | Spring Boot API |
| `frontend` | `./frontend/Dockerfile` | 3000 | 80 | React app via nginx |

**Volume:** `pg_data` is a named Docker volume that persists database files between container restarts. Without it, all data would be lost every time `docker-compose down` is run.

### 5.2 Backend Dockerfile

Uses a **multi-stage build** to keep the final image small:

```
Stage 1 (build): eclipse-temurin:21-jdk-alpine
  - Installs Maven
  - Copies pom.xml + src/
  - Runs mvn package -DskipTests → produces target/*.jar

Stage 2 (runtime): eclipse-temurin:21-jre-alpine
  - Installs curl (for health checks)
  - Creates unprivileged user 'sentinel' (security best practice)
  - Copies only the JAR from Stage 1
  - EXPOSE 8080
  - Runs: java -jar app.jar
```

The final image contains only the JRE and the JAR — no Maven, no source code, no JDK. This significantly reduces image size and attack surface.

### 5.3 Frontend Dockerfile

Also a **multi-stage build**:

```
Stage 1 (build): node:20-alpine
  - Copies package.json + package-lock.json
  - Runs npm ci (reproducible install from lockfile)
  - Copies all source files
  - Runs npm run build → produces dist/

Stage 2 (runtime): nginx:1.25-alpine
  - Copies dist/ to /usr/share/nginx/html
  - Copies nginx.conf template
  - EXPOSE 80
  - Runs nginx in foreground
```

The final image contains only nginx and the compiled static HTML/JS/CSS — no Node.js, no TypeScript, no source code.

### 5.4 nginx.conf

nginx serves the React app and acts as a **reverse proxy** — it forwards API and WebSocket requests to the backend so the browser only ever talks to port 80 (3000 on host).

```
Browser → nginx:80
  │
  ├── /fhir/*  → proxy to backend:8080/fhir/*
  ├── /api/*   → proxy to backend:8080/api/*
  ├── /ws      → proxy to backend:8080/ws  (with WebSocket upgrade headers)
  └── /*       → serve /usr/share/nginx/html/index.html  (React SPA fallback)
```

The **SPA fallback** (`try_files $uri $uri/ /index.html`) is critical for React apps. Without it, refreshing a page at a URL like `/patients/101` would return a 404 because nginx looks for a file at that path and finds nothing. With the fallback, React Router handles the URL client-side.

The **WebSocket upgrade** block sets the required HTTP headers (`Upgrade: websocket`, `Connection: upgrade`) to promote the HTTP connection to a persistent WebSocket connection.

### 5.5 Environment Variables

Create a `.env` file in the project root before running `docker-compose up`. Here are all the variables used:

| Variable | Example Value | Used By | Description |
|---|---|---|---|
| `POSTGRES_DB` | `sentinel` | `db` service | Database name for PostgreSQL init |
| `POSTGRES_USER` | `sentinel_user` | `db` service | Superuser for PostgreSQL init |
| `POSTGRES_PASSWORD` | `secret` | `db` service | Password for PostgreSQL init |
| `DB_HOST` | `db` | `backend` | Hostname of the database (use service name in compose) |
| `DB_PORT` | `5432` | `backend` | Database port |
| `DB_NAME` | `sentinel` | `backend` | Database name |
| `DB_USER` | `sentinel_user` | `backend` | Database username |
| `DB_PASSWORD` | `secret` | `backend` | Database password |
| `SERVER_PORT` | `8080` | `backend` | Backend HTTP port |
| `INGESTION_INTERVAL_MS` | `5000` | `backend` | Scheduler interval in milliseconds |
| `JWT_ISSUER_URI` | `http://keycloak:8180/realms/sentinel` | `backend` | OAuth2 JWT issuer URI |
| `SPRING_SECURITY_OAUTH2_RESOURCESERVER_JWT_ISSUER_URI` | same as above | `backend` | Spring property override |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:3000` | `backend` | Allowed CORS origins |
| `BACKEND_URL` | `backend:8080` | `frontend` | Used by nginx to proxy API calls |

---

## 6. Cloud Deployment (render.yaml)

`render.yaml` is a **Render.com Infrastructure-as-Code** file. Committing this file to the repository lets Render provision and configure the entire stack automatically.

**What it defines:**

| Resource | Type | Details |
|---|---|---|
| `sentinel-backend` | Web service (Docker) | Builds from `backend/Dockerfile`, health check at `/actuator/health`, auto-deploys on commits to `backend/**` |
| `sentinel-frontend` | Web service (Docker) | Builds from `frontend/Dockerfile`, auto-deploys on commits to `frontend/**` |
| `sentinel-db` | PostgreSQL database | Free tier managed database |

**Smart wiring:**
- Database credentials (`DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`) are automatically injected into the backend from the managed database — no manual copy-paste.
- `BACKEND_URL` is automatically set to the backend's internal `hostport` — nginx can reach the backend without you configuring anything.
- `CORS_ALLOWED_ORIGINS` and `JWT_ISSUER_URI` are marked `sync: false`, meaning you set them manually in the Render dashboard (they are environment-specific secrets).

**Build filters** mean that pushing a change to `backend/` only rebuilds the backend service, not the frontend, and vice versa. This saves time and unnecessary deployments.

---

## 7. Running Locally

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running
- A `.env` file in the project root (see Section 5.5 for all required variables)

### Steps

```bash
# Clone the repository
git clone https://github.com/Valentina-Maraio/java_project.git
cd java_project

# Create your .env file (fill in values from Section 5.5)
cp .env.example .env   # if an example exists, otherwise create it manually

# Build and start all services
docker-compose up --build

# Or run in the background
docker-compose up -d --build
```

### Access Points

| URL | What you see |
|---|---|
| `http://localhost:3000` | React dashboard |
| `http://localhost:8080/fhir/Observation` | Raw JSON list of observations |
| `http://localhost:8080/actuator/health` | Backend health status |
| `localhost:5432` | PostgreSQL (connect with your DB client) |

### Stopping

```bash
docker-compose down          # stops containers, keeps data
docker-compose down -v       # stops containers AND deletes database volume
```

### Running Backend and Frontend Without Docker

If you want faster iteration during development:

**Backend:**
```bash
cd backend
# Set environment variables manually or via your IDE
./mvnw spring-boot:run
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev   # starts Vite dev server on http://localhost:3000
              # the proxy in vite.config.ts forwards API calls to localhost:8080
```

---

## 8. Glossary

| Term | Definition |
|---|---|
| **FHIR** | Fast Healthcare Interoperability Resources — an international standard (HL7) for representing and exchanging healthcare data as JSON or XML |
| **HL7** | Health Level Seven International — the standards organisation that publishes FHIR |
| **LOINC** | Logical Observation Identifiers Names and Codes — a universal code system for identifying lab tests and clinical observations. `2339-0` is the LOINC code for glucose |
| **STOMP** | Simple Text Oriented Messaging Protocol — a lightweight messaging protocol that runs on top of WebSocket. It adds the concept of "topics" so clients can subscribe to specific message channels |
| **SockJS** | A JavaScript library that provides a WebSocket-like API but falls back to HTTP long-polling if the browser or network doesn't support WebSocket |
| **Hexagonal Architecture** | A software design pattern where the core business logic is isolated from infrastructure (databases, HTTP, messaging). Everything connects to the core through defined interfaces (ports) |
| **Port (architecture)** | An interface that defines what the application can do (inbound port, e.g. `LabResultInPort`) or what it needs from infrastructure (outbound port, e.g. `LabResultRepositoryPort`) |
| **Adapter (architecture)** | A concrete class that implements a port. For example, `IngestionAdapter` drives the inbound `LabResultInPort`; `NotificationAdapter` implements the outbound `NotificationPort` |
| **PII** | Personally Identifiable Information — any data that can identify a real person. In this app, patient IDs are PII and can be masked under GDPR |
| **GDPR** | General Data Protection Regulation — EU law governing how personal data must be handled and protected |
| **Hibernate Envers** | A Hibernate extension that automatically tracks every change to database entities in audit tables, creating a full revision history |
| **OAuth2 / JWT** | OAuth2 is an authorisation framework; JWT (JSON Web Token) is a compact, self-contained token format. Together they allow the backend to verify that a request comes from a trusted, authenticated user without maintaining server-side sessions |
| **cobas** | A brand of laboratory analysers made by Roche. In Sentinel the instrument data is simulated, but the format follows what a real cobas integration would produce |
| **CORS** | Cross-Origin Resource Sharing — a browser security mechanism that restricts which domains can make API calls to the backend. The backend must explicitly allow the frontend's origin |
| **Multi-stage Docker build** | A Dockerfile technique using multiple `FROM` stages. The first stage compiles the code; the second stage copies only the compiled output into a clean, minimal runtime image |
| **React Query (TanStack Query)** | A library for fetching, caching, and synchronising server state in React applications. Used here for polling the REST API every 10 seconds |
| **Recharts** | A composable charting library for React built on D3. Used for all 9 charts in the Sentinel dashboard |
