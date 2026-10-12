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
5. **Provides Verifiable Cryptographic Alert Integrity**: Uses standard W3C Web Crypto (ECDSA P-256 with SHA-256) to ensure broadcast warnings cannot be spoofed, altered, or replayed during multi-channel distribution.

---

## 2. System Architecture & Project Structure

```
peregrine/
├── index.html                   # HTML entry point with metadata & font preconnects
├── package.json                 # Clean dependencies (React 19, Vite, Tailwind CSS, TSX)
├── tsconfig.json                # TypeScript compiler configuration
├── vite.config.ts               # Vite bundler configuration
│
├── public/
│   └── assets/
│       └── brand/               # Official PEREGRINE vector branding
│           ├── peregrine-lockup.svg
│           ├── peregrine-lockup-dark.svg
│           └── peregrine-symbol.svg
│
├── src/
│   ├── main.tsx                 # React DOM mount
│   ├── App.tsx                  # Primary workspace application layout & scenario routing
│   ├── index.css                # PEREGRINE design tokens, typography, and utility classes
│   │
│   ├── model/                   # Simulation Engine & Single Source of Truth
│   │   ├── config.ts            # Centralised parameters, channel reach, timings, costs
│   │   └── graph.ts             # Deterministic simulation, mesh BFS routing, S30/S72 engines
│   │
│   ├── planner/                 # Dual-Objective Decision Engine
│   │   └── engine.ts            # Reach Maximiser vs Fairness-Floor Optimizer
│   │
│   ├── integrity/               # Cryptography & Reproducibility
│   │   ├── crypto.ts            # ECDSA P-256 digital signature signing & verification
│   │   └── experiment.ts        # Seeded deterministic experiment runner & checksums
│   │
│   └── components/              # Interactive Operational Views
│       ├── NetworkMapAndGraph.tsx        # Topographical network map & infrastructure graph
│       ├── SilenceClockGrid.tsx          # Real-time blackout clock & community status
│       ├── RedundancyIllusionPanel.tsx   # Nominal vs Available vs N-1 audit matrix
│       ├── DecisionEngineView.tsx        # Comparative optimization workbench & trade-off log
│       ├── OutagePlanMatrix.tsx          # 72-hour hourly restoration matrix & step viewer
│       ├── AuditPanel.tsx                # Cryptographic verification & tamper detection
│       ├── SensitivityPanel.tsx          # Parametric sensitivity analysis (±30% stress)
│       ├── ExperimentLogView.tsx         # Baseline comparisons (A, B, C vs D) & audit slips
│       └── brand/
│           └── PeregrineLogo.tsx         # Responsive SVG falcon lockup component
│
├── test/
│   └── model-integrity.test.ts  # 45-point automated verification & test vector suite
│
└── docs/
    └── PITCH_DECK_REVISION_PLAN.md # Evidence-based slide revision plan
```

---

## 3. Installation & Development

### Prerequisites
- Node.js >= 20.x or Bun >= 1.2
- npm, pnpm, or bun

### Commands
```bash
# 1. Install dependencies
npm install
# or
bun install

# 2. Run local development server (port 3000)
npm run dev

# 3. Execute automated test suite (all 45 tests)
npm test

# 4. Run type checker / linter
npm run lint

# 5. Build production bundle
npm run build
```

---

## 4. Simulation Methodology & Mathematical Formulations

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

## 5. Centralised Model Assumptions

All assumptions are centralised in `src/model/config.ts` and marked as **MEASURED**, **IMPLEMENTED**, or **ASSUMED**:

| Parameter | Value | Status | Description |
|---|---|---|---|
| Cell Reach | 0.85 | MEASURED | Benchmark outdoor/indoor mobile phone alert reach |
| Cell Arrival Time | 0.2 min | MEASURED | 12-second Cell Broadcast delivery standard |
| FM Radio Share | 0.55 | MEASURED | Population percentage with accessible FM receiver |
| FM Existing Listeners | 0.25 | MEASURED | Percentage actively listening prior to alert |
| Mesh Range | 190 units | IMPLEMENTED | Line-of-sight packet radio transmission distance |
| Mesh Base Arrival | 0.3 min | IMPLEMENTED | Gateway packet ingestion and broadcast latency |
| Mesh Hop Latency | 0.5 min | IMPLEMENTED | Store-and-forward retransmission per mesh hop |
| S30 Siren Reach | 0.80 | ASSUMED | Acoustic vehicle siren outdoor reach in 30m window |
| S72 Siren Reach | 0.50 | ASSUMED | Siren vehicle patrol reach across extended outage |
| Siren Base Latency | 8.0 min | ASSUMED | Vehicle dispatch and crew muster delay |
| Community Kit Reach | 0.70 | IMPLEMENTED | Direct satellite/solar warning kit for Thoni/Hill Camp |
| Community Kit Arrival | 2.0 min | IMPLEMENTED | Autonomous receiver activation delay |
| Relay Node S72 Reach | 0.40 | ASSUMED | Battery-buffered mesh repeater coverage |
| Generator Runtime | 25 hours | ASSUMED | Fuel tank autonomy for fixed FM transmitter |
| Mobile Unit Arrival | 24 hours | ASSUMED | Cross-terrain transit and deployment delay |
| Grid Restoration | Hour 48 | ASSUMED | Utility restoration timeline for regional East Grid |

### Critical Notice on Siren Patrol Assumption
Modelled continuous siren availability reflects continuous alert readiness under scenario assumptions; it does **not** prove indoor audibility across every dwelling. Modelled silence indicates the absence of a verifiable broadcast link in simulation, never physical proof that residents did not hear an outdoor warning.

---

## 6. Algorithmic Planner Results (Verified Test Vectors)

### Scenario: S72 Cyclone Outage at Budget 50 Units

| Objective | Selected Interventions | Total Cost | Overall Reach | Lowest Village Outcome |
|---|---|---:|---:|---|
| **Plan A: Reach Maximiser** | Backup Generators (20u) + Mobile Broadcast Unit (30u) | 50u | **31.8%** | **Thoni at 0.0%** (and Hill Camp at 0.0%) |
| **Plan B: Fairness-Constrained** | Mobile Unit (30u) + Siren Thoni (10u) + Siren Hill Camp (10u) | 50u | **25.0%** | **Kovalam at 22.9%** (Thoni raised to 50.0%) |

#### Key Algorithmic Insights:
1. **The Equity Trade-off**: Plan A concentrates budget on the 6 large coastal settlements (18,400 population), boosting overall average reach to 31.8% but completely abandoning Thoni (900 residents) and Hill Camp (600 residents) to 72 hours of total silence.
2. **Fairness Cost**: Plan B lifts the weakest communities from 0.0% to 50.0%, at an overall aggregate reach cost of $6.8$ percentage points (25.0% vs 31.8%).
3. **Infeasible Floor Detection**: At budget 50, the 35% fairness floor is **infeasible** because Kovalam only reaches 22.9% (shortfall: 12.1%). PEREGRINE honestly reports `floorMet: false` and logs the exact shortfall.
4. **Higher Budget Convergence**: At budgets 80 and 100, both plans converge on deploying Generators, Mobile Unit, and both Sirens (70 units). Lowest village reaches 34.4%, falling just 0.6% short of the 35% floor due to FM receiver limitations.

### Scenario: S30 Gateway Loss Demonstration
- **Cyclone Baseline (Gateway Operational)**: S30 Overall Reach = **54.0%** (Shelter Mesh functional across 6 villages).
- **Gateway Loss (Single-Point Failure)**: S30 Overall Reach = **0.00%** (Complete network collapse).
- **Insight**: Demonstrates that when cell towers and FM transmitters lose power and fibre, the satellite gateway becomes a single point of failure that collapses all remaining broadcast reach.

---

## 7. Automated Test Suite

Run the full verification suite:
```bash
npm test
```
The test suite executes **115 rigorous automated assertions** across 17 distinct test suites verifying:
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

## 8. Unresolved Questions (Preserved from Project Bible)

In compliance with project guidelines, the following questions remain open and un-fabricated pending committee decisions:
- **Q2 (Judging Criteria)**: Exact weightings between raw population reach and fairness floor equity.
- **Q4 (Demonstration Time Limit)**: Final pitch presentation duration (3-min pitch vs 7-min technical demonstration).
- **Q19 (Official Tagline)**: Core working title retained as *"Disaster-Resilient Broadcast Network"*.
