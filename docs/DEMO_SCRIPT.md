# PEREGRINE — 3-Minute Demonstration Script & Evaluator Guide

**Disaster-Resilient Broadcast Network · IEEE BTS Hackathon**  
*Directly matched to the 6-Step Guided Demo Mode (`Demo Tour` in Header)*

---

## 1. Executive 3-Minute Demonstration Script (6 Guided Steps)

To follow this script live, click **"Demo Tour"** in the top-right header, or use **Space / Arrow keys** to advance.

### Step 1: Healthy Baseline Network (0:00 – 0:30)
- **Tab**: `Overview & Topology` (`/overview`)
- **App State**: All power grids (West/East), fibre backhaul, and transmitters operational.
- **On Screen**: 
  - 8 settlements along the coast and inland hills (Total population: 19,900).
  - Effective rapid-onset alert reach: **~84.4%** ($S_{30}$).
  - Silence Clock: **0 hours of blackout** across all communities.
- **Narrative**:
  > "Welcome to PEREGRINE. We are demonstrating a decision-support simulator for disaster broadcast coordinators. Under normal conditions, nominal channels look healthy—cell broadcast, FM towers, and satellite relays provide high population coverage. But what happens when correlated physical hazards strike?"

---

### Step 2: Cyclone Compound Landfall (0:30 – 1:00)
- **Tab**: `Overview & Topology` (`/overview`)
- **App State**: West Grid cut, East Grid cut, core fibre backhaul severed.
- **On Screen**:
  - Cell towers lose fibre backhaul; Cell Broadcast reach collapses to **0.00%**.
  - Overall $S_{30}$ reach drops to **54.0%**, sustained solely by local battery-buffered shelter mesh radios.
- **Narrative**:
  > "When a severe cyclone strikes, power and fibre fail simultaneously. Cellular networks drop to zero immediately. But unlike naive simulations that assume independent channels, PEREGRINE traces upstream physical dependencies. In this state, only the multi-hop shelter mesh keeps the 6 coastal settlements reachable at 54.0%."

---

### Step 3: Single Point of Failure — Marina Gateway Loss (1:00 – 1:30)
- **Tab**: `Overview & Topology` (`/overview`)
- **App State**: Gateway down under cyclone conditions.
- **On Screen**:
  - Overall $S_{30}$ reach collapses from **54.0% down to strictly 0.00%**.
  - Single-Point Failure Demo Card displays complete warning blackout across all 6 mesh settlements.
- **Narrative**:
  > "Here is an unforgettable single-point vulnerability: the Marina Satellite Gateway is the sole uplink for the entire mesh. If that single dish is flooded or knocked offline, the warning path collapses from 54% to zero—total blackout for all 18,400 coastal residents. 
  > 
  > With one click on our 'Deploy Redundant Gateway' intervention (40 units), we restore satellite ingress at Karai, lifting reach straight back to 54.0%. This proves the value of targeted redundancy before disaster strikes."

---

### Step 4: The Human Impact — Silence Clock Grid (1:30 – 2:00)
- **Tab**: `Silence Clock Grid` (`/silence`)
- **App State**: Extended 72-hour outage ($S_{72}$).
- **On Screen**:
  - Odometer drum displays showing cumulative hours with zero warning paths.
  - **Thoni (pop. 900)** and **Hill Camp (pop. 600)** show **72 / 72 hours of complete silence** (1,500 residents abandoned).
- **Narrative**:
  > "Aggregates hide human suffering. On our Silence Clock, we measure the cumulative duration each community has zero surviving warning paths. Notice that while coastal towns regain grid power at hour 48, isolated inland communities—Thoni with 900 people and Hill Camp with 600—endure 72 full hours of total communication blackout."

---

### Step 5: Redundancy Illusion & East Grid Cut (2:00 – 2:30)
- **Tab**: `Redundancy Illusion` (`/illusion`)
- **App State**: Inspecting shared infrastructure dependencies.
- **On Screen**:
  - Breakdown table comparing Nominal (on paper) vs Available Now vs **N-1 Guaranteed**.
  - 6 out of 8 communities show $N-1 = 0$ guaranteed paths.
- **Narrative**:
  > "On paper, Karai, Uppalam, and Sagar have 3 channels: Cell, FM, and Mesh. But our dependency graph audit reveals that Tower B and the FM transmitter both depend on the East Power Grid. 
  > 
  > A single substation cut drops both channels at once. That is the Redundancy Illusion: diversity on paper, but zero true $N-1$ protection."

---

### Step 6: Plan A vs Plan B & Price-of-Fairness Frontier (2:30 – 3:00)
- **Tab**: `Decision Engine` (`/planner`)
- **App State**: Budget 50 units. Comparing Reach Maximiser vs Fairness-Floor Optimizer.
- **On Screen**:
  - Native SVG Pareto Frontier chart showing Overall Reach vs Minimum Village Reach.
  - Plain English finding: *"At budget 50, the best possible minimum village reach is 22.9%; protecting it costs 6.8 points of overall reach."*
  - Optimizer benchmark card: Plan A achieves **100% of global theoretical optimum** (0.0% gap vs exhaustive 256-subset evaluation), outperforming both Cheapest-First (19.4%) and Highest-Pop-First (28.7%).
- **Narrative**:
  > "This brings us to the core ethical trade-off. At a budget of 50 units:
  > - **Plan A (Reach Maximiser)** spends budget on coastal generators and mobile units, boosting headline reach to 31.8%, but leaves Thoni and Hill Camp at 0.0%.
  > - **Plan B (Fairness-Constrained)** deploys sirens to Thoni and Hill Camp, lifting them to 50.0% and the lowest village to 22.9%, at an honest cost of 6.8 points of overall reach.
  > 
  > We exhaustively evaluated all 256 intervention combinations: Plan A is mathematically optimal for reach, while our frontier curve plots every Pareto-efficient option for emergency coordinators."

---

## 2. Canonical Answers to Hostile Technical Questions

| Judge Question | Model-Backed Defensible Answer |
|---|---|
| **Where do your numbers come from? Are they measured?** | "We audited ourselves and relabeled all uncited parameters from MEASURED to ASSUMED (cell reach 0.85, arrival 12s, FM radio share 0.55). The only parameter marked IMPLEMENTED is the Euclidean BFS shortest-path routing algorithm. Every displayed metric is deterministically calculated from `src/model`, with zero fabricated multipliers." |
| **How do you prove your optimizer does useful work?** | "In `src/planner/engine.ts`, we benchmark our planner against two standard heuristics: Cheapest-First (19.4% reach) and Highest-Population-First (28.7% reach). We also ran an exhaustive $2^8 = 256$ subset global evaluation in memory, confirming Plan A achieves 31.8%—exactly 100% of the theoretical global optimum with a 0.0% optimality gap." |
| **Why does the gateway loss drop reach from 54% to 0%?** | "Under the cyclone scenario, both West and East power grids and the core fiber backhaul are severed. Cell towers have zero backhaul and the fixed FM transmitter has no power. The 6 mesh communities were receiving alerts solely via satellite packets relayed through the Marina Gateway. When the gateway fails, the single remaining physical path is broken." |
| **What infrastructure assumptions enable redundant gateway recovery?** | "We assume a portable or secondary satellite uplink terminal (40 units) can be colocated at Karai or connected via line-of-sight packet radio, which re-injects packets into the surviving BFS mesh topology without requiring utility grid restoration." |
| **What is the mathematical definition of your fairness floor?** | "A constraint $R_v \ge \text{floor}$ for every settlement $v$. When no combination within budget can satisfy the floor (e.g. at budget 50 with a 35% floor, where Kovalam peaks at 22.9%), PEREGRINE honestly flags `floorMet: false` and logs the exact 12.1% shortfall rather than masking failure." |
| **Does your conclusion survive if siren and kit reach assumptions change?** | "Yes. In our Sensitivity Suite, we vary siren reach, community kit reach, radio share, and generator runtime by ±30% across 16 corner combinations. In 100% of trials (16/16), Plan A abandons Thoni and Hill Camp to 0.0%, and the fairness trade-off cost reliably ranges between +4.2% and +8.9% percentage points." |
| **What cryptographic threat model is used?** | "We use W3C Web Crypto ECDSA P-256 with SHA-256 for alert authenticity and tamper detection. Under this model, an attacker without the broadcast authority's private key cannot forge or alter alert payloads without invalidating the cryptographic signature." |
