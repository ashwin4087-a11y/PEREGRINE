# PEREGRINE — Disaster-Resilient Broadcast Network
### Decision-Support Simulation, Redundancy Analysis & Fair Recovery Planner
*IEEE Broadcast Technology Society (BTS) Hackathon 2026*

---

## 1. Executive Summary & Purpose

When severe disasters strike coastal regions (such as cyclones, storm surges, or earthquake-triggered floods), terrestrial telecommunications infrastructure suffers rapid, correlated collapse. Power grids fail, cellular towers lose diesel generator fuel or fibre backhaul, and communities enter periods of total communication silence.

**PEREGRINE** is a deterministic decision-support simulator and algorithmic recovery planner designed for emergency broadcast coordinators. Rather than relying on naive assumptions of channel independence or unvalidated averages, PEREGRINE:
1. **Models Physical Upstream Dependencies**: Traces common-cause infrastructure vulnerabilities (power grids, fibre routes, satellite uplinks, terrain barriers) that simultaneously sever multiple nominal communication channels.
2. **Exposes the "Redundancy Illusion"**: Quantifies how nominal diversity (e.g., three channels on paper) collapses under correlated failures into zero-redundancy single points of failure ($N-1 = 0$).
3. **Calculates Community Silence Clocks**: Tracks cumulative time-to-first-warning and prolonged blackout hours ($S_{72}$) across 8 distinct coastal and inland settlements (19,900 total population).
4. **Enforces Algorithmic Fairness**: Solves the fundamental ethical tension between *Reach Maximisation* (spending resources on dense population centres to boost headline averages) and *Fairness-Floor Equity* (guaranteeing minimum survival alerts to small, isolated settlements such as Thoni and Hill Camp).
5. **Provides Verifiable Cryptographic Alert Integrity**: Uses standard W3C Web Crypto (ECDSA P-256 with SHA-256) to verify alert origin authenticity and detect in-flight tampering or unauthorized modifications during multi-channel distribution.

---

## 2. System Architecture & Feature-Oriented Project Structure

PEREGRINE follows a clean, decoupled frontend/backend architecture with strict separation of concerns across presentation, simulation, metrics, planning, integrity, and test suites:

```text
PEREGRINE/
├── frontend/                            # React 19 + TypeScript + Vite + Tailwind CSS Application
│   ├── public/assets/brand/             # Official PEREGRINE vector branding (lockups & symbol)
│   ├── src/
│   │   ├── app/                         # App shell, router, header with API status badge, demo tour
│   │   ├── pages/                       # Route views (Overview, Silence Clock, Redundancy, Decision Engine)
│   │   ├── components/                  # Modular UI (network map, silence grid, optimizer workbench)
│   │   ├── services/
│   │   │   └── api.ts                   # Typed API client connecting to backend with local fallback
│   │   ├── model/                       # Simulation engine client definitions & fallback models
│   │   ├── metrics/                     # Mathematical calculation functions
│   │   ├── planner/                     # Dual-objective recovery optimizer
│   │   ├── integrity/                   # ECDSA alert signing & reproducible experiment runner
│   │   ├── experiments/                 # Sensitivity benchmarks & parameter sweeps
│   │   └── styles/                      # Design tokens and master stylesheet
│   ├── test/                            # Frontend test suites (338 automated assertions)
│   ├── package.json                     # Frontend scripts & dependencies
│   ├── tsconfig.json                    # Frontend TypeScript configuration
│   ├── vite.config.ts                   # Vite configuration with /api reverse proxy
│   └── .env.example                     # Frontend environment template
│
├── backend/                             # Node.js + Express + TypeScript Deterministic API Server
│   ├── src/
│   │   ├── server.ts                    # HTTP server entry point (port 3001)
│   │   ├── app.ts                       # Express application factory & middleware pipeline
│   │   ├── routes/                      # Route declarations (/health, /scenarios, /simulations, etc.)
│   │   ├── controllers/                 # Validated HTTP request handlers & standardized responses
│   │   ├── services/                    # Application coordination services
│   │   ├── engine/                      # Authoritative network simulation (S30 & S72 models)
│   │   ├── metrics/                     # Authoritative calculations (reach, silence, redundancy, N-1)
│   │   ├── planner/                     # Authoritative recovery interventions & Pareto frontier
│   │   ├── integrity/                   # Cryptographic signing, verification, and tamper detection
│   │   ├── experiments/                 # Deterministic seeded experiments & ±30% sensitivity sweeps
│   │   ├── middleware/                  # Centralized error handler and CORS protection
│   │   ├── config/                      # Infrastructure parameters and server configuration
│   │   └── types/                       # Shared API data transfer objects & contracts
│   ├── test/                            # Backend test suites (66 automated assertions)
│   ├── package.json                     # Backend scripts & dependencies
│   ├── tsconfig.json                    # Backend TypeScript configuration
│   └── .env.example                     # Backend environment template
│
├── tests/                               # Full-stack architectural acceptance tests (54 assertions)
│   └── full-stack.test.ts               # End-to-end structure & live HTTP client/server verification
│
├── docs/                                # Technical Documentation & Hackathon Materials
│   ├── DEMO_SCRIPT.md                   # 3-Minute demonstration script & canonical Q&A
│   ├── IMPLEMENTATION_STATUS.md         # Full feature audit status matrix & evidence
│   ├── PEREGRINE_PROJECT_BIBLE.md       # Definitive Project Bible & specifications (v2.1)
│   ├── PITCH_DECK_REVISION_PLAN.md      # Evidence-based slide revision plan
│   └── REFACTOR_PLAN.md                 # Dependency-ordered refactoring roadmap
│
├── scripts/                             # Orchestration & Process Management
│   └── dev.js                           # Concurrent development runner (Frontend + Backend)
│
├── package.json                         # Root workspace scripts coordinating all components
├── tsconfig.json                        # Root TypeScript configuration
├── README.md                            # Comprehensive system documentation
└── .gitignore                           # Repository ignore configuration
```

### Architectural Separation of Responsibilities

- **Frontend Application (`frontend/`)**:
  Pure React 19 UI with responsive desktop/mobile shells, interactive timeline grids, settlement dependency inspectors, live topology graphs, dual-objective optimizer workbench, and cryptographic audit panels. Consumes computed results through the typed client (`frontend/src/services/api.ts`). If the backend is running, it communicates over HTTP; if the backend is offline, it transparently falls back to the in-memory engine, displaying an unambiguous connection status badge (`API CONNECTED` vs `LOCAL ENGINE`).
- **Backend API Server (`backend/`)**:
  Node.js + Express + TypeScript HTTP service exposing validated REST endpoints under `/api`. Houses the authoritative simulation engine (`backend/src/engine/`), metrics calculations (`backend/src/metrics/`), recovery planner (`backend/src/planner/`), cryptographic integrity (`backend/src/integrity/`), and reproducible experiments (`backend/src/experiments/`). Does not use fake or hardcoded mock data; all responses are computed dynamically from the authoritative mathematical model.
- **Root Orchestration & Tests (`scripts/`, `tests/`)**:
  Root workspace scripts coordinate building, type-checking, and testing both workspaces simultaneously. `tests/full-stack.test.ts` validates the file tree and boots the server on an ephemeral port to verify end-to-end HTTP communication.

---

## 3. API Endpoints

The backend exposes structured, validated HTTP REST endpoints returning consistent JSON envelopes (`{ success, data, error, timestamp }`):

| Method | Endpoint | Description | Status Codes |
|---|---|---|---|
| `GET` | `/api/health` | Service health status, system uptime, memory usage, and version | `200` |
| `GET` | `/api/scenarios` | Lists all 3 canonical disaster scenarios (Healthy, Cyclone, Gateway Loss) | `200` |
| `GET` | `/api/scenarios/:id` | Returns failure state and description for a specific scenario preset | `200`, `404` |
| `GET` | `/api/scenarios/components` | Enumerates all 7 critical failure infrastructure components | `200` |
| `POST` | `/api/simulations/run` | Executes authoritative S30 alert-decay and S72 outage simulations | `200`, `400` |
| `POST` | `/api/redundancy/analyze` | Evaluates Nominal vs Available vs N-1 Guaranteed channels and CCF nodes | `200`, `400` |
| `POST` | `/api/planner/recommend` | Evaluates Reach-Maximiser (Plan A) vs Fairness-Floor (Plan B) and Pareto frontier | `200`, `400` |
| `POST` | `/api/experiments/run` | Generates seeded deterministic audit records and runs sensitivity sweeps | `200`, `400` |

---

## 4. Installation & Development

### Prerequisites
- Node.js >= 20.x
- npm

### Quick Start
```bash
# 1. Install all dependencies across root, frontend, and backend
npm run install:all

# 2. Start full-stack development environment concurrently
# (Backend on :3001, Frontend on :3000 with automatic /api proxy)
npm run dev

# 3. Run all automated tests (458 assertions across backend, frontend, and full-stack)
npm test

# 4. Run type checker across both workspaces
npm run lint

# 5. Build production bundles for both frontend and backend
npm run build
```

### Granular Workspace Commands
```bash
# Frontend only
npm run dev:frontend      # Start Vite on port 3000
npm run test:frontend     # Execute 338 frontend assertions
npm run build:frontend    # Compile production Vite bundle

# Backend only
npm run dev:backend       # Start Express with hot reload on port 3001
npm run test:backend      # Execute 66 backend unit & API assertions
npm run build:backend     # Compile TypeScript to backend/dist/

# Full-Stack Integration
npm run test:fullstack    # Run end-to-end HTTP architecture integration test
```

---

## 5. Environment Configuration

### Backend (`backend/.env`)
```bash
PORT=3001
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

### Frontend (`frontend/.env`)
```bash
VITE_API_URL=http://localhost:3001
```

If `VITE_API_URL` is omitted, the frontend Vite development server automatically proxies all `/api` requests to `http://localhost:3001`. If the backend server is unreachable, the frontend seamlessly executes simulations locally, preventing application crashes.

---

## 6. Simulation Methodology & Mathematical Formulations

### 4.1 S30 Alert Window (30 Minutes)
Evaluates urgent early-warning dissemination during rapid-onset hazards:
- **Decay Formula**:
  $$\text{Effective Reach}_i = \left(1 - \prod_{c \in C_i} (1 - r_c)\right) \times \max\left(0, \frac{W - t_{\text{arrival}, i}}{W}\right)$$
  Where $W = 30\text{ min}$, $r_c$ is channel reach, and $t_{\text{arrival}, i}$ is the earliest message arrival time across operational channels in village $i$.
- **Population-Weighted Resilience Score**:
  $$\text{Score} = \frac{\sum_i \text{Pop}_i \times \text{Effective Reach}_i}{\sum_i \text{Pop}_i} \times 100\%$$

### 4.2 Shelter Mesh Graph Routing
Rather than assigning static hop counts, PEREGRINE builds a Euclidean graph of nodes based on Cartesian coordinates $(x, y)$:
- Links exist if and only if $\text{dist}(u, v) \le 190\text{ units}$ and both nodes possess active mesh hardware.
- Marina hosts the primary satellite gateway.
- Breadth-First Search (BFS) computes exact shortest-path hop counts:
  - Marina: 0 hops ($t = 0.3\text{ min}$)
  - Kovalam: 1 hop ($t = 0.8\text{ min}$)
  - Pazhaya: 1 hop ($t = 0.8\text{ min}$)
  - Karai: 1 hop ($t = 0.8\text{ min}$)
  - Uppalam: 2 hops via Karai ($t = 1.3\text{ min}$, direct distance $199.2 > 190$)
  - Sagar: 3 hops via Karai $\to$ Uppalam ($t = 1.8\text{ min}$)
- If intermediate node Karai fails, Uppalam and Sagar dynamically lose mesh connectivity.

### 4.3 S72 Outage Timeline (72 Hours)
Models prolonged infrastructure recovery and diesel generator lifespans:
- $h \in [0, 48)$: Grid power severed. Fixed FM transmitter is unpowered unless backup generation is running ($h < 25$) or mobile broadcast unit is deployed ($h \ge 24$).
- $h \in [48, 72)$: Grid power returns under standard cyclone recovery. Fixed FM transmitter resumes broadcast.
- **Permanent Power Failure**: If unrecoverable substation failure occurs, grid power remains down for all 72 hours, resulting in $0.00\%$ reach unless mobile/generator interventions are active.

---

## 7. Centralised Model Assumptions

All assumptions are centralised in `src/model/config.ts` and explicitly distinguished:
- **ASSUMED**: Modelled scenario planning parameters (uncited simulation values, inspectable and testable).
- **IMPLEMENTED**: Pure algorithmic implementations within the PEREGRINE engine (Euclidean BFS mesh routing, dual-objective recovery planning, ECDSA signature verification).
- **MEASURED**: Reserved strictly for empirically grounded external benchmarks with citations (none claimed without real-world telemetry).

| Parameter | Value | Status | Description |
|---|---|---|---|
| Cell Reach | 0.85 | ASSUMED | Fictional planning benchmark for mobile phone alert reach |
| Cell Arrival Time | 0.2 min | ASSUMED | 12-second Cell Broadcast delivery model |
| FM Radio Share | 0.55 | ASSUMED | Population percentage with accessible FM receiver |
| FM Existing Listeners | 0.25 | ASSUMED | Percentage actively listening prior to alert |
| Mesh Range | 190 units | IMPLEMENTED | Line-of-sight packet radio transmission distance (algorithmic Euclidean BFS) |
| Mesh Base Arrival | 0.3 min | IMPLEMENTED | Gateway packet ingestion and broadcast latency |
| Mesh Hop Latency | 0.5 min | IMPLEMENTED | Store-and-forward retransmission per mesh hop |
| S30 Siren Reach | 0.80 | ASSUMED | Acoustic vehicle siren outdoor reach in 30m window |
| S72 Siren Reach | 0.50 | ASSUMED | Siren vehicle patrol reach across extended outage |
| Siren Base Latency | 8.0 min | ASSUMED | Vehicle dispatch and crew muster delay |
| Community Kit Reach | 0.70 | ASSUMED | Direct satellite/solar warning kit for Thoni/Hill Camp |
| Community Kit Arrival | 2.0 min | ASSUMED | Autonomous receiver activation delay |
| Relay Node S72 Reach | 0.40 | ASSUMED | Battery-buffered mesh repeater coverage |
| Generator Runtime | 25 hours | ASSUMED | Fuel tank autonomy for fixed FM transmitter |
| Mobile Unit Arrival | 24 hours | ASSUMED | Cross-terrain transit and deployment delay |
| Grid Restoration | Hour 48 | ASSUMED | Utility restoration timeline for regional East Grid |

### Critical Notice on Siren Patrol Assumption
Modelled continuous siren availability reflects continuous alert readiness under scenario assumptions; it does **not** prove indoor audibility across every dwelling. Modelled silence indicates the absence of a verifiable broadcast link in simulation, never physical proof that residents did not hear an outdoor warning.

---

## 8. Algorithmic Planner Results (Verified Test Vectors)

### Scenario: S72 Cyclone Outage at Budget 50 Units

| Objective | Selected Interventions | Total Cost | Overall Reach | Lowest Village Outcome |
|---|---|---:|---:|---|
| **Plan A: Reach Maximiser** | Backup Generators (20u) + Mobile Broadcast Unit (30u) | 50u | **31.8%** | **Thoni at 0.0%** (and Hill Camp at 0.0%) |
| **Plan B: Fairness-Constrained** | Mobile Unit (30u) + Siren Thoni (10u) + Siren Hill Camp (10u) | 50u | **25.0%** | **Kovalam at 22.9%** (Thoni raised to 50.0%) |

#### Key Algorithmic Insights:
1. **The Equity Trade-off**: Plan A concentrates budget on the 6 large coastal settlements (18,400 population), boosting overall average reach to 31.8% but completely abandoning Thoni (900 residents) and Hill Camp (600 residents) to 72 hours of total silence.
2. **Fairness Cost & Max-Min Frontier**: Plan B lifts the weakest communities from 0.0% to 50.0% (and lowest overall village Kovalam to 22.9%), at an aggregate reach cost of **6.8 percentage points** (25.0% vs 31.8%). Our Pareto sweep demonstrates that 22.9% is the highest achievable minimum village reach at budget 50.
3. **Optimizer Benchmarking vs Baselines & Global Optimum**:
   - **Cheapest-First**: 19.4% overall reach.
   - **Highest-Population-First**: 28.7% overall reach.
   - **Exhaustive Evaluation ($2^8 = 256$ subsets)**: Theoretical global maximum is exactly 31.8%.
   - **Plan A Optimality Gap**: **0.0% gap** (Plan A achieves 100% of theoretical global optimum).
4. **Headline Conclusion Robustness (±30% Stress-Testing)**:
   In our 16-trial sensitivity analysis across ±30% variation in siren reach, community kit reach, radio share, and generator runtime:
   - In **100% of trials (16/16)**, Plan A abandons Thoni & Hill Camp to 0.0%.
   - The fairness trade-off cost consistently spans **+4.2% to +8.9% percentage points** (mean: 6.8%).
5. **Infeasible Floor Detection**: At budget 50, the 35% fairness floor is **infeasible** because Kovalam only reaches 22.9% (shortfall: 12.1%). PEREGRINE honestly reports `floorMet: false` and logs the exact shortfall.

### Scenario: S30 Gateway Loss Demonstration
- **Cyclone Baseline (Gateway Operational)**: S30 Overall Reach = **54.0%** (Shelter Mesh functional across 6 villages).
- **Gateway Loss (Single-Point Failure)**: S30 Overall Reach = **0.00%** (Complete network collapse).
- **Redundant Gateway Intervention**: Deploying a secondary satellite uplink at Karai (40u) restores mesh ingestion and lifts reach immediately back to **54.0%**.

---

## 9. Guided Demo Mode (3-Minute Walkthrough)

PEREGRINE includes a built-in **Demo Tour** accessible via the header button or keyboard (`Space` / `ArrowRight`):
1. **Step 1: Healthy Network**: Baseline state with all links operating (~84.4% reach, 0 blackout hours).
2. **Step 2: Cyclone Landfall**: Severe correlated failure cut (54.0% reach on mesh).
3. **Step 3: Gateway Loss**: Single-point failure collapses reach from 54.0% to 0.00%.
4. **Step 4: Silence Clock**: 72-hour blackout duration exposing 1,500 residents abandoned at Thoni and Hill Camp.
5. **Step 5: Redundancy Illusion**: East Power cut exposing nominal diversity vs $N-1 = 0$ guaranteed protection.
6. **Step 6: Plan A vs Plan B**: Budget 50 Pareto frontier, max-min equity, and optimizer benchmark.

---

## 10. Automated Test Suite

Run the full verification suite:
```bash
npm test
```
The unified test suite executes **458 rigorous automated assertions** with zero failures across three distinct layers:
- **Backend Verification (66 assertions)**: Validates canonical disaster scenarios, authoritative S30 alert decay and S72 timeline simulation, N-1 guaranteed redundancy calculations, dual-objective recovery planning, deterministic seeded experiments, and all Express REST API endpoints (`/api/health`, `/api/scenarios`, `/api/simulations/run`, `/api/redundancy/analyze`, `/api/planner/recommend`, `/api/experiments/run`).
- **Frontend Verification (338 assertions)**: Validates UI models, 72-hour Silence Clock grids, Redundancy Illusion calculations, multi-hop BFS graph traversal, ECDSA alert verification, and the frontend API client with transparent offline local engine fallback.
- **Full-Stack Acceptance Tests (54 assertions)**: Inspects repository architecture, spins up a live backend server instance on an ephemeral port, and verifies real frontend-to-backend HTTP communication.
- **Price-of-Fairness Frontier**: Monotonic non-increasing overall reach as floor rises, strict budget compliance, determinism, and 22.9% max-min verification.
- **Zero Fabricated Multipliers**: `planResilience` computed via fresh simulation, completely eliminating arbitrary `* 1.03` factors.
- **S30 Baseline Derivation**: Validates 53.95% authoritative multi-hop BFS calculation and contrasts with 54.26% naive 1-hop model (both round to 54.0%).
- **S30 Planned Recovery**: Fresh evaluation of chosen interventions (Generator 20u + 2 Sirens 20u = 40u) reaches 71.7%.
- **All 12 S72 Planner Combinations**: Exhaustively tests 4 budgets (20, 50, 80, 100) × 3 auto-tune adoption curves (0.0, 0.5, 1.0) under both ReachMax and FairnessFloor objectives.
- **Complete Mesh Topology**: Validates 190-unit Euclidean distance threshold, gateway connectivity, and multi-hop routing paths.
- **Intermediate Node Cutoffs**: Confirms Uppalam and Sagar lose mesh connectivity upon intermediate node Karai failure.
- **Hour-48 Grid Recovery**: Verifies pre-restoration blackout and post-restoration FM recovery.
- **Permanent Power Failure**: Confirms 0.00% reach when utility grid is unrecoverable.
- **Deterministic Experiment Replays**: Validates seed hashing (Mulberry32, FNV-1a) and SHA-256 simulation checksums across replays.

---

## 11. Unresolved Questions (Preserved from Project Bible)

In compliance with project guidelines, the following questions remain open and un-fabricated pending committee decisions:
- **Q2 (Judging Criteria)**: Exact weightings between raw population reach and fairness floor equity.
- **Q4 (Demonstration Time Limit)**: Final pitch presentation duration (3-min pitch vs 7-min technical demonstration).
- **Q19 (Official Tagline)**: Core working title retained as *"Disaster-Resilient Broadcast Network"*.
