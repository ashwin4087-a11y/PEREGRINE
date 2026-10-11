# PEREGRINE — Project Source of Truth

**Disaster-Resilient Broadcast Network · IEEE BTS Hackathon**
**Version 2.1 (DRAFT for team approval) · 10 October 2026**
**Supersedes:** PEREGRINE Project Bible v1.0 (once the team approves the `[PROPOSED]` items below). Everything in Bible v1.0 is carried forward here with its original status label.

> **North star:** PEREGRINE helps emergency broadcasters understand how warnings degrade when infrastructure fails, identify the most consequential weaknesses, and compare recovery interventions using explicit, inspectable assumptions.

---

## Contents

0. How to use this document
1. Project identity
2. Problem, people served, principles
3. Positioning and originality
4. Evidence and source policy
5. Scope and feature status
6. System model (world, dependencies, channels, scenarios, reproduced test vectors)
7. Metrics (formal definitions)
8. Silence Clock
9. Redundancy Illusion analysis
10. Decision engine (budget planner + fairness floor)
11. Validation and experiment protocol
12. Architecture and implementation spec (for IDE work)
13. Integrity / audit panel (signed alerts)
14. UI/UX design system (brand symbol and wordmark in 14.6)
15. User interface structure
16. Demo story and pitch
17. Claims policy and hard questions
18. Build plan and acceptance tests
19. Open questions and decisions required
20. Source register
21. Change log and change-request format
- Appendix A. Rules for AI coding assistants and IDE agents
- Appendix B. Glossary

---

## 0. How to use this document

This is the single authoritative reference for product purpose, scope, model assumptions, formulas, architecture, UI, demo claims and unresolved decisions. If a chat message, slide, prompt, generated code or older file conflicts with this document, follow this document until the team records a change (Section 21).

### Status labels (use them in code comments, UI copy, slides and this file)

| Label | Meaning |
|---|---|
| **[DECIDED]** | A team decision recorded in project history. |
| **[IMPLEMENTED]** | Reported as present in the prototype; verify in the running build before any demo. |
| **[ASSUMPTION]** | A modelling choice or default. Not a measured fact. |
| **[PROPOSED]** | Recommended, not yet approved or built. Not binding. |
| **[UNVERIFIED]** | A claim or detail that must be checked before it is stated as fact. |
| **[REPRODUCED]** | A reported number that was re-derived by hand from the documented formula (Section 6.6). Confirms the documentation is self-consistent. It does **not** confirm the running code matches. |
| **[DERIVED]** | A conclusion worked out by hand from documented dependencies. Must be confirmed by the implementation. |
| **[DECISION NEEDED]** | A blocking choice the team must make before the dependent feature is built. |

### Source-of-truth rules

1. Do not silently change the name, purpose, technical assumptions, visual tokens or feature status. Propose a change and record it (Section 21).
2. Keep **implemented**, **assumed** and **planned** visibly separate in the product, code comments, demo, slides and this document.
3. Every model parameter lives in one configuration object (Section 12.3). Never duplicate a default in the UI, tests or docs without referencing the config.
4. If an external fact lacks a cited source or has not been checked recently, label it `[UNVERIFIED]`. Do not guess.
5. PEREGRINE is a planning simulation and alert-hub concept. It is **not** a deployed emergency broadcast system. Simulation output is not field evidence.
6. Never hardcode an outcome to make a result look better. Every displayed number must be computed from the model.

---

## 1. Project identity

| Field | Value |
|---|---|
| Name | **PEREGRINE** (previously RelayGrid) |
| Descriptor | Disaster-Resilient Broadcast Network |
| Tagline | **Resilience Beyond Reach.** `[DECIDED]` in Bible v1.0. **Conflict:** the brand note's lockup uses a different tagline. See 14.6 and Q19 `[DECISION NEEDED]` |
| Brand lockup | Falcon symbol + `PEREGRINE` wordmark. Specification in 14.6. Always use the master vector asset, never retyped text |
| Event | IEEE BTS Hackathon (BTS expansion to be confirmed, see Section 19) |
| Build constraint | Six hours, software-only |
| Legacy file name | `relaygrid.html` (name may stay; product name is PEREGRINE) |

**One-sentence definition.** PEREGRINE is a broadcast-resilience planning and alert hub that estimates how emergency warning reach changes during cascading infrastructure failures, identifies critical weak points, and compares interventions that could improve resilience over an outage.

**Product category.** Decision-support simulation for emergency broadcasting and communication resilience. It does not replace public warning authorities, SACHET, broadcasters, telecom operators or existing alert infrastructure.

### What PEREGRINE is not

- Not a generic mesh-chat app.
- Not a generic disaster map or status dashboard.
- Not an operational authority that issues real emergency alerts.
- Not a system that can confirm receipt from every radio or one-way broadcast receiver.
- Not a validated field-deployment plan until real network, receiver and operational data are incorporated and reviewed.
- Not an AI product by default. Use transparent modelling where it fits better than AI.

---

## 2. Problem, people served, principles

### Core pain point

Disasters cause correlated failures across power, fibre, towers, transmitters, gateways and other infrastructure. Multiple warning channels can look redundant while sharing a critical dependency. Planners need to know not just whether a channel exists, but how much warning reach survives over time and which intervention restores the most.

### Primary users (intended groups, not confirmed customers or partners)

- Emergency broadcasters and broadcast-network planners.
- Disaster-management authorities and resilience planners.
- Infrastructure operators evaluating backup power, mobile assets or alternate gateways.
- Researchers and educators in disaster communication resilience.

### Job to be done

"When a hazard or infrastructure outage is plausible, help me identify the critical failure paths and compare practical recovery choices so I can protect warning delivery to the communities most at risk."

### Why broadcast is central

One transmission can serve many receivers without per-person requests. Real usefulness still depends on surviving transmitters, power, feed links, receiver availability and behaviour, and local conditions. PEREGRINE models these dependencies explicitly. It never claims broadcast is inherently failure-proof.

### Human-impact principle

Do not optimise only for the largest total population reached. Always report **worst-served** and **isolated** communities next to the average so an aggregate cannot hide a severe last-mile gap.

---

## 3. Positioning and originality

| Existing system or approach | Existing contribution | PEREGRINE's position |
|---|---|---|
| SACHET / national alert infrastructure | Public warning delivery incl. SMS, cell broadcast, multilingual alerts | Complement. Never claim to replace. |
| ITU connectivity and early-warning maps | Connectivity, exposure, coverage-gap analysis | Do not claim gap mapping is novel. |
| Mesh / offline communication projects | Local forwarding or peer-to-peer comms | Mesh is a channel in the model, not the headline. |
| Backup power and mobile broadcast assets | Operational ways to preserve or restore broadcasting | Model how each affects system-level resilience. |
| Resilience research | Graph dependencies, cascading failures, recovery planning | Build on it. State the narrower contribution. |

### Intended differentiator `[DECIDED]` (carried from Bible v1.0)

A **broadcast-first, dependency-aware resilience model** that connects (a) cascading infrastructure failures, (b) time-integrated warning reach, (c) underserved-community outcomes, and (d) a transparent comparison of recovery interventions.

This is a proposed contribution, not proof that nothing similar exists. Do not say "first", "unique" or "nobody has done this" without a documented prior-art review.

### Sharpening the differentiator `[PROPOSED]`

Three named ideas make the contribution concrete and demonstrable. Each is specified later and each must be computed from the model, never narrated.

| Idea | One line | Section |
|---|---|---|
| **Silence Clock** | Per village, the modelled hours with no available warning path. | 8 |
| **Redundancy Illusion** | Channels that look independent but share an upstream dependency, shown as nominal vs available vs N-1 guaranteed channels. | 9 |
| **Fairness-floor planner** | A budget planner run twice, once maximising total reach and once protecting a minimum per-village reach, to expose who an average-maximising plan leaves behind. | 10 |

**Proposed pitch line:** *PEREGRINE shows when your backup warning channels are an illusion, and finds the budget plan that protects the communities averages leave behind.*

### Research hypothesis `[PROPOSED]`

Under the same budget and disaster scenario, a dependency-aware recovery planner preserves more time-integrated warning reach than simpler baselines, without worsening outcomes for the worst-served communities. This must be tested, not presented as established.

---

## 4. Evidence and source policy

This document is built **only** from material the team has provided, plus clearly labelled hand derivations. No new external facts were added.

| Material | How it is used here |
|---|---|
| PEREGRINE Project Bible v1.0 (`PEREGRINE_PROJECT_BIBLE.md`) | Primary source for identity, model, UI tokens, claims policy. Carried forward. |
| Team planning note: Silence Clock, fairness-floor optimiser, Redundancy Illusion (pasted in chat, 10 Oct 2026) | Source for Sections 8-10. Everything from it is `[PROPOSED]` until approved. Two corrections were applied (Section 10.2, Section 9.2). |
| Team brand note: PEREGRINE wordmark specifications (pasted in chat, 10 Oct 2026) | Source for Section 14.6. `[PROPOSED]`. The logo concept image itself was not supplied. The note's tagline conflicts with Section 1, and its tracking range for the tagline is inconsistent between two places. Both are flagged in 14.6. |
| *Bioengineering Solutions for Disaster-Resilient Ecosystems* (Prem Priyank, uploaded PDF) | **Not used for any PEREGRINE technical or numerical claim.** Reasons: it addresses ecological and biological mitigation, not broadcast engineering. The author describes himself as a school student. The portion provided gives no primary-source citations for its statistics (for example the benefit-cost ratio and field-trial percentages). Its only relevant point is general: early-warning systems are conventional measures that other approaches complement. That does not support any PEREGRINE claim. Bible v1.0 already classifies it as "not a primary source for broadcast engineering". |
| Mauthe et al., *Disaster-Resilient Communication Networks: Principles and Best Practices* | Listed in the Bible as an uploaded PDF. `[UNVERIFIED]` bibliographic details. Cite only after checking. |
| Web sources in Section 20 | Carried from the Bible. Not re-verified. Re-check anything time-sensitive before a pitch. |

**What qualifies as evidence**

| Level | Meaning | Allowed wording |
|---|---|---|
| Simulation demonstration | The software behaves as coded under chosen inputs. | "The model shows…" |
| Event-grounded simulation | Uses some verified facts from a real disaster, still model-dependent. | "Under assumptions grounded in…" |
| Expert review | Practitioners judge plausibility. | "Reviewed by…" (only if true) |
| Field validation | Real transmitters, receivers, network data or exercises. | Only if it happened. |

Never say "field-tested", "proven in disasters" or "validated in the real world".

---

## 5. Scope and feature status

### 5.1 Reported as implemented `[IMPLEMENTED — verify build]`

- Eight fictional villages, total model population 19,900.
- Two cellular towers and modelled infrastructure dependencies.
- Failure toggles and a "Cyclone hits" preset.
- Channel assumptions for cell broadcast, FM and shelter mesh.
- A resilience score over a 30-minute alert window.
- Comparison: cell-only, multi-channel, multi-channel plus response plan.
- Failure-impact ranking and a sequential failure/degradation view.
- A 72-hour outage-plan matrix (backup generators, mobile broadcast unit, receiver auto-tune assumptions).
- Alert composer (severity, language, validity window) with channel-specific illustrative payloads.
- Browser-side ECDSA P-256 signature verification, tamper demonstration, signed withdrawal/cancellation.
- Browser text-to-speech where supported.

Before demo day, smoke-test every control and mark anything broken as "not available in demo".

### 5.2 Proposed scope (priority order) `[PROPOSED]`

| Priority | Item | Why |
|---|---|---|
| P0 | Audit and stabilise the existing model (Section 18, step 1) | Every later metric inherits any bug here. |
| P1 | Per-village time series and the **Silence Clock** | Foundation for fairness, last-mile view and the human-facing metric. |
| P2 | **Budget planner** with two objectives (reach-max, fairness-floor), re-simulated before/after | Turns the tool from a dashboard into a decision engine. |
| P3 | **Redundancy Illusion** panel computed from the dependency graph | The memorable technical reveal. |
| P4 | Baseline comparison and experiment log (median, range, worst case) | Evidence. |
| P5 | Sensitivity ("challenge our assumptions") panel | Turns invented inputs into a feature. |
| P6 | Last-mile view for one named village | Human face. |
| Backlog | Gateway-loss as an explicit demo beat; event-grounded scenario; random-storms mode; budget-vs-resilience curve; minimal-failure-set search; confidence ladder; one-page brief export; second gateway; drill log; real-region data; congestion modelling | Only if time remains. |

### 5.3 Out of scope for a six-hour software-only build

- Real emergency alert distribution to the public.
- Claiming SACHET or operator integration without an implemented, authorised integration.
- Claiming consumer phones in India support a specific broadcast auto-wake feature without verification.
- Deployable radio or LoRa transmission without confirming spectrum and equipment rules.
- Any real-world effectiveness claim based solely on simulation.

---

## 6. System model

All locations, populations, times and percentages are invented or assumed unless replaced with a sourced value. They exist to demonstrate model behaviour. Label every export and screen accordingly.

### 6.1 World `[ASSUMPTION]`

| Village | Population | Notes |
|---|---:|---|
| Kovalam | 4,200 | Tower A service area |
| Pazhaya | 1,800 | Tower A |
| Marina | 5,200 | Tower A; satellite gateway location |
| Thoni | 900 | No tower, no FM |
| Karai | 2,600 | Tower B |
| Uppalam | 3,100 | Tower B |
| Hill Camp | 600 | No tower, no FM |
| Sagar | 1,500 | Tower B |
| **Total** | **19,900** | Fictional planning scenario |

Derived: Tower A population 11,200; Tower B 7,200; no-tower villages 1,500 (Thoni, Hill Camp). Tower-covered share = 18,400 / 19,900 = 0.92462.

Reported: six villages have FM coverage and six have a shelter mesh node; mesh range is 190 map units; the mesh is fed from the satellite gateway at Marina. `[UNVERIFIED]` which six villages have mesh nodes, and village map coordinates. **Read both from the code before building anything that depends on them** (Section 19, Q11).

The reported 72-hour results are reproduced exactly if FM coverage equals the six tower-covered villages (Section 6.6). Treat that as "consistent with", and confirm in code.

### 6.2 Infrastructure nodes and dependencies `[ASSUMPTION — confirm in code]`

Nodes: `power_west`, `power_east`, `fibre`, `tower_A`, `tower_B`, `fm_tx`, `gateway`, `mesh_node[v]` for each village with a node.

| Failure toggle | Effect |
|---|---|
| West power cut | Tower A down |
| East power cut | Tower B and FM transmitter down, unless backup generation is active |
| Fibre cut | Cell broadcast down on both towers |
| Tower A / Tower B collapse | That tower down |
| FM fault | FM transmitter down |
| Gateway lost | Mesh feed down |
| "Cyclone hits" | Bundled preset. **Currently keeps the gateway alive.** |

Channel upstream sets implied by the above:

| Channel | Village group | Needs all of |
|---|---|---|
| Cell broadcast | Tower A villages | `fibre`, `tower_A`, `power_west` |
| Cell broadcast | Tower B villages | `fibre`, `tower_B`, `power_east` |
| FM | Six tower-covered villages | `fm_tx`, `power_east` (unless backup generation) |
| Shelter mesh | Villages with a node | `gateway`, own `mesh_node` (plus hop reach within 190 units) |

**Known weakness `[DECIDED to fix]`.** Keeping the gateway alive in the cyclone preset hides a single point of failure. Gateway loss must remain independently testable and must be part of stress testing and the demo.

### 6.3 Channel assumptions `[ASSUMPTION]`

| Channel | Assumption | Timing |
|---|---|---|
| Cell broadcast | Reaches 85% of people when available | Arrival 0.2 min |
| FM | Radio share 55%. Effective reach = radio share × (auto-tune share + (1 − auto-tune share) × 0.25), where 0.25 is the fraction of other listeners already tuned in | Auto-tune 0.2 min; existing listeners 1 min |
| Shelter mesh | Reaches 60% of people | 0.3 min + 0.5 min per hop; the only modelled two-way/confirmed channel |
| Combined | Per-village probability that at least one available channel reaches a person | Combination rule must be read from code. Default assumed here: independent union, `1 − Π(1 − reach_c)`. `[UNVERIFIED]` |

These are modelling assumptions, not statements about real receiver behaviour. Auto-tune is a **scenario variable** (none / half / all), never a statement about what current Indian phones or radios support.

### 6.4 Response planner (alert-window scenario) `[ASSUMPTION]`

For villages still unreached, the existing planner considers:

- **Relay node:** 10-minute arrival if a mesh-capable neighbour is within range.
- **Responder with siren:** 8 minutes + 0.1 minute per distance unit.
- Ranking: population × severity ÷ response time; top three interventions.

These are heuristics, not validated dispatch times.

### 6.5 Scenarios

Two scenario families exist. They use **different time models and must never be mixed or compared on one axis.**

| ID | Name | Window | Time model | Channels active |
|---|---|---|---|---|
| **S30** | Alert window | 30 minutes | Arrival-time model: a person reached at arrival time `a` contributes `(window − a)/window` | Cell, FM, mesh per toggles |
| **S72** | Outage plan | 72 hours | Availability model: fraction of the 72 h that a service is on air | Cell, fibre and mesh unavailable by assumption; only FM can be on air |

S72 assumptions: power fails at hour 0. Broadcast is on air when grid power returns (default hour 48), while the generator runs (default 25 h), or after the mobile broadcast unit arrives (default hour 24). Auto-tune varies over none / half / all.

S72 on-air windows (hours): no investment `[48,72]`; generators `[0,25] ∪ [48,72]`; mobile unit `[24,72]`; generator + mobile unit `[0,72]`.

### 6.6 Reproduced test vectors `[REPRODUCED]`

These re-derive the Bible's reported numbers from its own documented formulas. They are acceptance targets for the code (Section 18). Tolerance ±0.05 percentage points unless stated.

**S30, healthy network, cell-only resilience**

```
18,400 people × 0.85 reach × (30 − 0.2)/30 ÷ 19,900 = 0.78069  → 78.07%  (Bible: 78%)
```

**S72 outage-window reach (population-weighted, time-averaged expected reception)**

```
reach_FM_village(a) = 0.55 × (a + (1 − a) × 0.25)
population-weighted = reach_FM_village(a) × 18,400 / 19,900
value = population-weighted × (hours on air / 72)
```

| Plan | On-air hours | a = 0 (none) | a = 0.5 (half) | a = 1 (all) |
|---|---:|---:|---:|---:|
| No investment | 24 | 4.24% | 10.59% | 16.95% |
| Backup generators | 49 | 8.65% | 21.63% | 34.61% |
| Mobile broadcast unit | 48 | 8.48% | 21.19% | 33.90% |
| Generator + mobile unit | 72 | 12.71% | 31.78% | 50.85% |

All twelve cells round to the Bible's reported matrix (4/11/17, 9/22/35, 8/21/34, 13/32/51).

**S72 silence hours per village (new, derived from the same on-air windows)**

| Plan | Six tower-covered (FM) villages | Thoni, Hill Camp |
|---|---:|---:|
| No investment | 48 h | 72 h |
| Backup generators | 23 h | 72 h |
| Mobile broadcast unit | 24 h | 72 h |
| Generator + mobile unit | 0 h | 72 h |

`[DERIVED]` **Important finding to confirm in code:** under the documented S72 assumptions, no existing intervention (generators, mobile unit, auto-tune) can ever reach Thoni or Hill Camp, because they have no tower and no FM coverage. This is the model-based reason the fairness story needs interventions that can reach them (Section 10.2).

### 6.7 Known model weaknesses to fix or label `[DECIDED to address]`

1. Gateway kept alive in the cyclone preset (6.2).
2. S72 values mix availability and reception into one number. Report them as **time-averaged expected reception**, not "population reached" (Section 7).
3. The "54-point drop at the gateway step" in the worst-first sequence depends on failure order. Test several orders. Never present it as a fixed real-world impact.
4. Single-failure impact ranking (fibre 27.9, west power 17.0, Tower A 17.0, east power 13.3, Tower B 11.0, gateway 7.0, FM fault 0.7 percentage points) are model outputs under assumptions, not predictions. `[SIMULATION OUTPUTS ONLY]`
5. Reported S30 defaults: healthy 78 / 87 / 89 (cell-only / all channels / all + plan); cyclone 0 / 54 / 56. `[SIMULATION OUTPUTS ONLY]`

---

## 7. Metrics

Define every metric once, here. Code, UI, slides and exports must match.

### 7.1 S30 alert-window resilience `[IMPLEMENTED — keep consistent with code]`

```
Resilience_S30 = Σ_groups ( pop_g × reach_g × max(0, window − arrival_g) ) / ( totalPop × window )
```

Area under the degradation curve over the alert window. People unreached or arriving after expiry contribute zero. The exact handling of probabilities must match the code. Any change must be recorded in Section 21 and updated here, in code and in slides at the same time.

### 7.2 Per-village series (new) `[PROPOSED]`

For each village `i` and time step `t` (S72 default step Δt = 1 hour, 72 steps):

```
PathAvailable_i(t) ∈ {0, 1}
   = 1 iff at least one channel serving i has all upstream nodes up at t
     (and, for FM, is on air at t).  Binary. Used for the Silence Clock.

ExpectedReach_i(t) ∈ [0, 1]
   = probability a person in i could receive a warning at t
   = 1 − Π_c (1 − reach_c,i(t))      (combination rule per 6.3)
```

### 7.3 Headline metrics `[PROPOSED]`

| Metric | Formula | Notes |
|---|---|---|
| `TimeAvgReach_i` | `(1/T) Σ_t ExpectedReach_i(t) · Δt` | Per village, 0-1 |
| `OverallReach` | `Σ_i pop_i · TimeAvgReach_i / Σ_i pop_i` | Population-weighted. Equals the S72 matrix in 6.6 |
| `MinVillageReach` | `min_i TimeAvgReach_i`, report which village | Worst-served community. Always shown next to `OverallReach` |
| `SilenceHours_i` | `Σ_t (1 − PathAvailable_i(t)) · Δt` | Section 8 |
| `LowServiceHours_i(θ)` | `Σ_t [ExpectedReach_i(t) < θ] · Δt` | θ is a configurable threshold, placeholder 0.25 `[ASSUMPTION]` |
| `UnreachedBeforeExpiry` | people whose modelled arrival is after alert expiry or never | S30 only |
| `RecoveryTime` | time until a stated share of population or of critical villages regains a path | Optional |
| `GainPerCost` | `(OverallReach_after − OverallReach_before) / cost` | Planner only |

### 7.4 Delivery confidence ladder `[PROPOSED]`

Never treat these as synonyms, and never use "confirmed" green for a broadcast that was only transmitted.

`transmitted → available by a modelled channel → relayed → confirmed`

Only the shelter mesh is modelled as two-way or confirmed.

### 7.5 Rules

- Show formulas, assumptions and units next to every metric. No opaque "AI score".
- Every gauge or chart shows its time window and unit.
- Distinguish real sourced inputs from fictional demo data in labels and exports.

---

## 8. Silence Clock `[PROPOSED]`

**Definition.** For each village, the total hours in the scenario window during which the model has **no available warning path**: `SilenceHours_i` (Section 7.3).

**Why.** "Hill Camp: 72 hours of silence" is understood instantly. A resilience percentage is not. The Silence Clock is the human-facing metric. The resilience and reach numbers remain the planner-facing metrics.

**Rules**

1. Computed from `PathAvailable_i(t)` only. Never from an assumed or typed-in value.
2. Always labelled "modelled hours with no available warning path". It is **not** proof that nobody physically heard a warning.
3. Show `LowServiceHours` separately for villages with a path but weak reach, so the clock cannot look better than reality.
4. Show the S72 clock per plan so a viewer sees silence being bought back.

**UI behaviour.** One clock per village in a compact grid, with the odometer-drum component (Section 14.4) for the hours value. Ordering default: worst first. Hatching plus a text label "NO MODELLED PATH" on any village at 72 h.

**Acceptance.** Must match the S72 silence table in Section 6.6.

---

## 9. Redundancy Illusion analysis `[PROPOSED]`

**Idea.** Count channels honestly. Three channels on paper may be fewer in practice if they share upstream nodes.

### 9.1 Quantities (per village, for a given scenario state)

| Quantity | Definition |
|---|---|
| `nominal_i` | Channels configured for village `i` |
| `available_i` | Channels with all upstream nodes up now |
| `n1_guaranteed_i` | `min` over each currently-up node `n` of the number of channels still available after additionally removing `n` |
| `common_cause_nodes` | Nodes whose removal disables two or more channels for some village |

Display as: **"3 on paper · 2 now · 1 guaranteed after one more failure"**. All three numbers come from the graph. **Never force a dramatic transition.** If the graph does not produce "3 → 0", do not show it.

### 9.2 Correction to the team planning note `[DERIVED]`

The planning note and earlier discussion assumed a single upstream node shared by all three channels. By the dependencies documented in 6.2 there is **no single node common to all three channels** for any village. The illusion appears in two documented forms:

1. **Tower B villages (Karai, Uppalam, Sagar):** cell broadcast and FM both depend on `power_east`. One east power cut removes both. `n1_guaranteed` is 1 (mesh only, if the village has a node).
2. **After compound failures (for example the cyclone preset):** once other channels are down, the mesh through `gateway` can be the only remaining path, so losing the gateway removes the last path. This is a conditional effect of the scenario, not a property of the healthy network.

Marina (Tower A, FM, mesh) by the documented graph has `n1_guaranteed = 2`. These hand results must be confirmed by the implementation. If code disagrees, investigate which is wrong and record the outcome.

### 9.3 Algorithm

```
for each village i:
  chans = channels serving i
  available = [c for c in chans if allUpstreamUp(c)]
  worst = len(available)
  for each node n currently up and used by any c in available:
      remaining = [c for c in available if n not in upstream(c)]
      worst = min(worst, len(remaining))
  n1_guaranteed_i = worst
common_cause_nodes = nodes n where removal drops >= 2 channels for some village
```

Complexity is trivial at this scale. Unit-test with hand-built graphs.

---

## 10. Decision engine `[PROPOSED]`

### 10.1 Purpose

Given a scenario, a candidate set of interventions with costs, and a budget, choose a plan, re-simulate it, and explain it. Compare two objectives on identical inputs.

| Plan | Objective |
|---|---|
| **A. Reach maximiser** | Maximise `OverallReach` within budget. Risk: a large village outweighs a small one. |
| **B. Fairness-constrained** | Require `MinVillageReach ≥ F` first, then maximise `OverallReach` with the remainder. Trade-off: may cost more or lower the best achievable average. |

Use the same scenario, window, costs and budget for both. The comparison is only meaningful if inputs are identical.

### 10.2 Candidate interventions

| ID | Intervention | Scenario | Effect | Status |
|---|---|---|---|---|
| `backup_generation` | Backup generators | S30, S72 | Keeps east-power-dependent nodes on for the runtime (default 25 h) | Existing toggle |
| `mobile_broadcast_unit` | Mobile broadcast unit | S72 | On air from arrival (default hour 24); serves FM-covered villages as modelled | Existing toggle |
| `relay_node` | Relay node | S30 | 10 min arrival if a mesh-capable neighbour is within range | Existing planner heuristic |
| `siren_responder` | Responder with siren | S30 | `8 + 0.1 × distance` minutes | Existing planner heuristic |
| `second_gateway` | Redundant satellite gateway | S30 | Removes the gateway single point of failure for mesh | `[PROPOSED]` |
| (village-specific continuous service) | Something that can give Thoni and Hill Camp a path in S72 | S72 | **Not defined** | `[DECISION NEEDED]` |

**Correction to the team planning note `[DERIVED]`.** Generators, the mobile unit and a second gateway can only help villages whose channels they feed. By the documented model, Thoni and Hill Camp have no tower and no FM, so none of those can help them (Section 6.6). A fairness result that depends on protecting them needs at least one village-specific intervention. Otherwise the fairness floor is mathematically unreachable and the planner will correctly say so.

**`[DECISION NEEDED]` how to give the fairness story something to work with.** Pick one before building the fairness feature:

| Option | Description | Fidelity to documented model | Cost to build |
|---|---|---|---|
| **1 (recommended)** | Run the fairness-floor comparison on **S30**, where `relay_node` and `siren_responder` already exist and target unreached villages. Use S72 for the infrastructure-plan story (generators vs mobile unit) and for the Silence Clock. | High: no new assumptions | Low |
| 2 | Model `siren_responder` in S72 as periodic contact with an explicit patrol interval parameter | Medium: new assumption, label it | Medium |
| 3 | Add a new "community receiver kit" intervention serving Thoni and Hill Camp | Low: invents hardware behaviour | Medium |

Whichever is chosen, record it in Section 21 and label new parameters `[ASSUMPTION]`.

### 10.3 Costs `[DECISION NEEDED]`

Defensible costs do not exist yet (Bible Q9). For development only, use **placeholder budget units**, clearly labelled and unitless in the UI ("illustrative budget units"):

```
PLACEHOLDER (not sourced, replace when defensible):
backup_generation 20 · mobile_broadcast_unit 30 · second_gateway 40
relay_node 15 · siren_responder 10 · default budget slider 0-100
```

Never present these as real prices. Never use them to claim cost-effectiveness outside the simulation.

### 10.4 Algorithm (greedy, simulation-in-the-loop)

```
function plan(scenario, candidates, budget, objective, floor F):
  state    = simulateBaseline(scenario)          # no interventions
  chosen   = []
  remaining = budget

  loop:
    feasible = [i for i in candidates if i not in chosen and cost(i) <= remaining]
    if feasible is empty: break

    if objective == REACH_MAX:
        score(i) = ( Overall(apply(state, i)) - Overall(state) ) / cost(i)

    if objective == FAIRNESS_FLOOR:
        shortfall(s) = Σ_v max(0, F - TimeAvgReach_v(s))        # unweighted per village
        if shortfall(state) > 0:
            score(i) = ( shortfall(state) - shortfall(apply(state, i)) ) / cost(i)
            if no i has score > 0: switch to REACH_MAX scoring for the remainder
        else:
            score(i) = REACH_MAX score

    best = argmax score(i)    # ties: lower cost, then lexicographic id (deterministic)
    if score(best) <= 0: break
    state = apply(state, best); chosen += best; remaining -= cost(best)

  final = simulateFromScratch(scenario, chosen)   # re-run, do not trust incremental state
  return PlanResult(...)
```

Design choices and reasons (explain these to judges):

- **Greedy by gain per cost**: simple, fast, explainable. It is a heuristic and does **not** guarantee a global optimum. Never claim otherwise.
- **Unweighted shortfall in the fairness phase**: weighting by population would let a 600-person village be ignored, which defeats the purpose.
- **Re-simulate from scratch at the end**: guards against incremental-state bugs.
- **Deterministic tie-breaks**: same inputs always give the same plan.
- **Monotonicity assumption**: applying an intervention never reduces any village's availability. Test it (Section 18).
- **Impossible floors**: if the floor cannot be met, return `floorMet = false` and the list of villages still below it. Never claim fairness was achieved when it was not.

### 10.5 Output contract

```
PlanResult {
  objective, budget, floor?, chosen: Intervention[], totalCost,
  before: MetricsSnapshot, after: MetricsSnapshot,
  perVillage: [{ id, reachBefore, reachAfter, silenceBefore, silenceAfter }],
  floorMet: boolean, villagesBelowFloor: string[],
  explanations: [{ interventionId, marginalGain, cost, villagesHelped[] }],
  warnings: string[]
}
```

### 10.6 Side-by-side comparison

| Measure | Reach maximiser | Fairness-constrained |
|---|---|---|
| Overall reach | computed | computed |
| Lowest village reach (and which) | computed | computed |
| Hill Camp / Thoni silence hours | computed | computed |
| Total cost | computed | computed |
| Villages meeting the floor | computed | computed |

The central insight, "the plan that is best on average may leave the smallest village worst off", is a **testable hypothesis**, not a given. The data decides. If the model shows no such difference, say so.

### 10.7 Optional rigour `[PROPOSED]`

With at most about 12 candidates, exhaustively evaluate all subsets (≤ 4,096) to compute the **greedy optimality gap** honestly. Report it. This turns the heuristic's biggest weakness into a measured result.

---

## 11. Validation and experiment protocol

### 11.1 Research question

Can a dependency-aware model and recovery planner produce better warning-resilience outcomes under a fixed budget than simpler strategies across a range of plausible disaster scenarios?

### 11.2 Baselines `[PROPOSED]` (same scenarios and assumptions for every run)

| ID | Strategy | How to implement |
|---|---|---|
| A | Cell broadcast only | Existing |
| B | Multiple channels, no dependency-aware diagnosis | `[DECISION NEEDED]` Suggested: estimator that treats channels as independent (ignores shared nodes) and so overestimates resilience. Compare estimate vs dependency-aware truth. |
| C | Dependency-aware diagnosis, no optimisation | Diagnose, then apply interventions in a fixed naive order |
| D | PEREGRINE: diagnosis + budget planner | Section 10 |

Also compare the greedy planner against: cheapest-feasible-first, highest-population-first, and no intervention.

### 11.3 Scenario and sensitivity matrix

Vary at least: gateway survives or fails; short / medium / long power outage; fibre survives or cut; generator runtime; mobile unit arrival; radio share and auto-tune share; channel reach and arrival times; budget; single vs correlated failures. Record the random seed whenever randomness is used.

**"Challenge our assumptions" panel `[PROPOSED]`.** Let a viewer vary uncertain inputs (for example ±30%) and show whether the recommended plan's ranking survives. Wording: "Don't trust our numbers. Break them and see if the conclusion holds."

Report **median, range and worst case**, not only the best run.

### 11.4 Experiment log (minimum fields)

Experiment ID and timestamp; scenario and failure sequence; input parameters with source/assumption labels; algorithm/baseline version; interventions considered and chosen; cost assumptions; metrics from Section 7 including worst-served village; difference from each baseline; known limitations and interpretation.

Store configuration and output so any result is reproducible. Export as JSON (and CSV where useful).

---

## 12. Architecture and implementation spec (for IDE work)

### 12.1 Principles

- **Pure model core.** All simulation, metrics, illusion analysis and planning are pure, deterministic functions with no DOM access. The UI calls them; tests call them; the experiment runner calls them.
- **Single config.** All parameters in one object (12.3). The UI reads from it. Show when current settings differ from defaults. Provide reset-to-defaults.
- **Traceable numbers.** Every displayed metric maps to a named function and its inputs.
- **Graceful degradation.** Missing browser speech voices or fonts must never break a demo.
- **Real verification.** Signature status comes from actually verifying the signature. A green label alone is not evidence.

### 12.2 Proposed layout `[PROPOSED]`

Stack beyond the single HTML artifact is `[UNVERIFIED]` (Q16). The layout is language-agnostic and assumes TypeScript/JavaScript because the prototype is browser-based. If the team stays with one HTML file, keep the model in a clearly delimited script block that can be extracted and tested in Node.

```
/docs/PEREGRINE_SOURCE_OF_TRUTH.md     this file
/src/model/config.ts                   single parameter object (12.3)
/src/model/graph.ts                    nodes, channels, upstream sets, availability
/src/model/simulate.ts                 S30 arrival model; S72 hourly series
/src/metrics/resilience.ts             7.1
/src/metrics/reach.ts                  7.2-7.3
/src/metrics/silence.ts                Section 8
/src/metrics/illusion.ts               Section 9
/src/planner/interventions.ts          catalogue + pure apply()
/src/planner/greedy.ts                 Section 10.4
/src/planner/baselines.ts              11.2
/src/planner/exhaustive.ts             10.7 (optional)
/src/experiments/runner.ts             scenario batches, seeds
/src/experiments/sensitivity.ts        11.3
/src/experiments/log.ts                11.4
/src/integrity/{sign,verify,withdraw}.ts   Section 13
/src/ui/...                            Sections 14-15
/assets/brand/                         master SVGs: symbol, wordmark, lockups, icon (14.6)
/tests/...                             Section 18
relaygrid.html                         legacy prototype (do not delete until parity verified)
```

### 12.3 Config shape (values from this document; unknowns are explicit)

```jsonc
{
  "meta": { "dataLabel": "FICTIONAL / ASSUMED", "version": "2.0" },
  "villages": [
    { "id": "kovalam",  "name": "Kovalam",  "pop": 4200, "tower": "A",  "fm": true,  "meshNode": null, "x": null, "y": null },
    { "id": "pazhaya",  "name": "Pazhaya",  "pop": 1800, "tower": "A",  "fm": true,  "meshNode": null, "x": null, "y": null },
    { "id": "marina",   "name": "Marina",   "pop": 5200, "tower": "A",  "fm": true,  "meshNode": null, "x": null, "y": null, "hostsGateway": true },
    { "id": "thoni",    "name": "Thoni",    "pop": 900,  "tower": null, "fm": false, "meshNode": null, "x": null, "y": null },
    { "id": "karai",    "name": "Karai",    "pop": 2600, "tower": "B",  "fm": true,  "meshNode": null, "x": null, "y": null },
    { "id": "uppalam",  "name": "Uppalam",  "pop": 3100, "tower": "B",  "fm": true,  "meshNode": null, "x": null, "y": null },
    { "id": "hillcamp", "name": "Hill Camp","pop": 600,  "tower": null, "fm": false, "meshNode": null, "x": null, "y": null },
    { "id": "sagar",    "name": "Sagar",    "pop": 1500, "tower": "B",  "fm": true,  "meshNode": null, "x": null, "y": null }
  ],
  "_todo": "meshNode (6 of 8 true), x, y: read from relaygrid.html before use",
  "channels": {
    "cell": { "reach": 0.85, "arrivalMin": 0.2 },
    "fm":   { "radioShare": 0.55, "existingListenerShare": 0.25, "autoTuneArrivalMin": 0.2, "listenerArrivalMin": 1 },
    "mesh": { "reach": 0.60, "baseMin": 0.3, "perHopMin": 0.5, "rangeUnits": 190 }
  },
  "planner": { "relayArrivalMin": 10, "sirenBaseMin": 8, "sirenPerUnitMin": 0.1, "topN": 3 },
  "s30": { "windowMin": 30 },
  "s72": { "hours": 72, "stepHours": 1, "generatorRuntimeH": 25, "mobileUnitArrivalH": 24,
           "gridReturnH": 48, "autoTune": [0, 0.5, 1] },
  "metrics": { "lowServiceThreshold": 0.25 },
  "interventionCosts": { "_label": "PLACEHOLDER, not sourced",
    "backup_generation": 20, "mobile_broadcast_unit": 30, "second_gateway": 40,
    "relay_node": 15, "siren_responder": 10 },
  "planning": { "defaultBudget": 50, "defaultFloor": null }
}
```

### 12.4 Core types `[PROPOSED]`

```ts
type NodeId = 'power_west'|'power_east'|'fibre'|'tower_A'|'tower_B'|'fm_tx'|'gateway'|`mesh_${string}`;
type ChannelId = 'cell'|'fm'|'mesh';

interface Village { id:string; name:string; pop:number; tower:'A'|'B'|null; fm:boolean;
                    meshNode:boolean|null; x:number|null; y:number|null; }

interface ScenarioState {
  failedNodes: Set<NodeId>;
  backupGenerationActive: boolean;
  mobileUnitArrivalH: number|null;
  generatorRuntimeH: number;
  autoTune: number;                // 0..1, scenario variable
  appliedInterventions: string[];
}

interface VillageSeries { id:string; pathAvailable:number[]; expectedReach:number[]; }  // length = steps

interface MetricsSnapshot {
  overallReach:number; minVillageReach:{id:string; value:number};
  silenceHours:Record<string,number>; lowServiceHours:Record<string,number>;
}

interface Intervention { id:string; label:string; cost:number; scenarios:('S30'|'S72')[];
  apply:(s:ScenarioState)=>ScenarioState;   // pure; must never reduce availability
}
```

### 12.5 Engineering rules

1. No `Math.random()` without a seeded generator. Log the seed.
2. No hardcoded outputs. No lookup tables of "expected" results outside tests.
3. Metrics are computed from series, not from a parallel code path (otherwise the Silence Clock and the reach numbers can disagree).
4. Keep S30 and S72 code paths and labels separate.
5. Export anything shown on screen as JSON.

---

## 13. Integrity / audit panel `[IMPLEMENTED — verify build]`

- Alerts are signed with ECDSA P-256 in the browser and verified by actually verifying the signature. The UI label reflects the real result.
- A tamper demonstration modifies a signed message and must show **REJECTED**.
- A **withdrawal/cancellation** is a separate, authenticated event tied to the original alert ID, not an edit of the original. Explain this in the UI.
- Keep the event history visible.

**Limits (state them if asked).** Signed alerts alone do not eliminate misinformation or prove issuer authority. That needs defined trust keys, issuance authority and verification procedures. Use CAP-style fields only as an interoperability direction. Do not claim certified CAP conformance.

Only simulated alerts. Never show real location-specific warnings that could be mistaken for official notices.

---

## 14. UI/UX design system

**Name: Trust-First Retro-Utility Hardware.** Analog utility hardware meets Swiss technical publishing: a rugged, high-precision calibration instrument. Use physical metaphors only where they explain the data.

### 14.1 Anti-patterns (banned)

No floating pills or candy tags; no diffuse or purple-tinted shadows; no frosted glass or glow; no gradients as a substitute for hierarchy (the navy hero gradient is the only exception); no sparkle, robot or decorative network graphics; no excessive 3D, animation or decorative mechanics; no fully rounded static containers (radius 2-4 px, except round gauge pivots); do not use amber or green decoratively (the logo symbol is the one documented exception, see 14.6).

### 14.2 Colour tokens

| Token | Hex | Usage |
|---|---|---|
| `--navy` Industrial Navy | `#123B63` | Shell, primary buttons, hard shadows, frames |
| `--navy-deep` Deep Void Navy | `#0C2A47` | Dark panels, console surfaces, hero gradient bottom |
| Odometer Chamber | `#081D33` | Inset gauge/metric chambers |
| Chamber Edge | `#061526` | Deep inset frame edge |
| `--bg` Drafting Grid | `#F7FAFC` | Canvas |
| `--surface` Paper | `#FFFFFF` | Cards, forms, tables, modals |
| `--ink` Typographic Ink | `#17212B` | Body copy and labels |
| `--muted` Technical Muted | `#5B6B80` | Units, metadata, timestamps |
| `--border` Structural Border | `#DCE5ED` | Hairlines |
| `--green` Safe Green | `#56A67A` | Healthy accents |
| Safe text | `#2E7D57` | Text on light green |
| Safe inset | `#EBF7F0` | Light safe background |
| `--amber` Warning Amber | `#F4B942` | Warning threshold, focus accent |
| Warning text | `#D99020` | Warning labels on light surfaces |
| Warning inset | `#FEF7EA` | Light warning surface |
| `--red` Critical Red | `#C95C5C` | Critical failure |
| Critical text | `#B23A3A` | Text on light critical |
| Critical hatch | `#9C2828` | Deep hazard stripe alternate |
| Critical inset | `#FDF2F2` | Light critical surface |

Navy dominates. Green = normal. Amber = caution. Red = critical. Check contrast for every semantic text colour.

### 14.3 Canvas, layout, type, motion

- Canvas `#F7FAFC` with a 24×24 px drafting grid of `rgba(220,229,237,0.5)` hairlines.
- Cards: white, 1 px border, hard navy shadow, 2-4 px radius. Standard shadow `3px 3px 0 #123B63`; large `5px 5px 0 #123B63`; pressed `0.5px 0.5px 0 #123B63`. No blur for elevation.
- 4 px accent stripe under the header: navy 45%, amber 35%, green 20%. It is a framing device, not a status.
- Fonts: **Bricolage Grotesque** (700-800, letter-spacing −0.02em) for headings; **Azeret Mono** (tabular, lining numerals) for numbers and codes; **Hind Madurai** or a clean humanist sans (400/500/600, line-height 1.55-1.65) for body. Always define fallbacks so a missing font never breaks layout.
- Motion: ease `cubic-bezier(0.16, 1, 0.3, 1)`. Odometer strip about 1.3 s, reduced or disabled for rapid changes. Reveal order: instrument 0.4 s at 0.05 s, action slips/inputs 0.12 s, data grids 0.20 s, supporting panels 0.28 s, only where it helps reading order.
- Buttons: rest `2px 2px 0 #123B63`; on press translate about 1.5 px and reduce the shadow. Focus ring `3px solid #F4B942`, offset 2 px.
- Honour `prefers-reduced-motion`. No essential information may depend on animation. Do not animate scores in a way that suggests live telemetry.

```css
:root{
  --navy:#123B63; --navy-deep:#0C2A47; --bg:#F7FAFC; --surface:#FFFFFF;
  --ink:#17212B; --muted:#5B6B80; --border:#DCE5ED;
  --green:#56A67A; --green-text:#2E7D57; --green-inset:#EBF7F0;
  --amber:#F4B942; --amber-text:#D99020; --amber-inset:#FEF7EA;
  --red:#C95C5C; --red-text:#B23A3A; --red-hatch:#9C2828; --red-inset:#FDF2F2;
  --shadow:3px 3px 0 #123B63; --shadow-lg:5px 5px 0 #123B63; --shadow-press:.5px .5px 0 #123B63;
  --ease:cubic-bezier(.16,1,.3,1);
}
```

### 14.4 Metaphors mapped to PEREGRINE

| Metaphor | Use | Rule |
|---|---|---|
| Rolling odometer drum | Silence hours, affected population, time to recovery | Only for values that change meaningfully |
| 180° analog gauge | Resilience or reach, with optional target marker | Explicit scale and units; no misleading ranges |
| Perforated receipt / analysis slip | Failure analysis, plan comparison, run report, decision audit | Do not imply an official record |
| Rubber-ink stamp | SIMULATED, ASSUMPTION, VERIFIED SIGNATURE, REJECTED, WITHDRAWN | Stamps are labels, not proof. The underlying state must be true and also available as text |
| Diagonal hazard striping | Critical failure, NO MODELLED PATH | Sparingly, always with text or icon |
| Tactile mechanical buttons | Run scenario, apply failure, compare plan, reset, export | Clear pressed and focus states |
| Dependency graph with cut paths | Failed component to unavailable channels to affected villages | Explanatory, never decorative |

### 14.5 Status presentation and accessibility

- Normal: green plus text "AVAILABLE" or "HEALTHY". Warning: amber plus "DEGRADED" / "AT RISK". Critical: red plus restrained hatching plus "FAILED" / "UNREACHABLE IN MODEL". Unknown or unconfirmed: neutral blue-grey, never green.
- A visible **SIMULATION** or **MODEL OUTPUT** indicator wherever the screen could be mistaken for an operational system.
- Never communicate status by colour alone. Show units and time windows on every chart or gauge. Make assumptions inspectable. Support keyboard focus, visible focus rings and readable body sizes. Keep the grid subtle enough for legibility.

### 14.6 Brand identity: symbol and wordmark `[PROPOSED — adopt on team approval]`

**Source:** team brand note, 10 Oct 2026. The logo concept image was **not** supplied to this document, so the symbol is described only by the brand note. Until the master vector exists (Q20), this section is the specification the asset must meet.

**Brand character.** Aerodynamic, precise, resilient, technically credible. Not overly colourful or decorative.

**Tagline conflict `[DECISION NEEDED]` (Q19).** Section 1 (from Bible v1.0) says "Resilience Beyond Reach." The brand note's lockup uses **FURTHER REACH A BRIGHTER TOMORROW**. Only one may be the tagline. Until the team decides, do not show either tagline in new UI, slides or exports. Use the wordmark alone, plus the descriptor `DISASTER-RESILIENT BROADCAST NETWORK` where context is needed. The tagline typography below applies to whichever is chosen.

#### Components

| Component | Specification |
|---|---|
| Symbol | Falcon, with a broken circular arc, a small amber destination node at the upper right, and a green wing accent. Visually dominant enough to work alone. |
| Wordmark | `PEREGRINE`, uppercase only, bold and compact, geometric (not rounded), highly legible at small sizes. No italics, no decorative letter distortion. |
| Tagline | Subordinate to the wordmark (see typography below). |
| Descriptor (optional) | `DISASTER-RESILIENT BROADCAST NETWORK`. Smaller than the tagline. Do not use both descriptor and tagline in very small applications. |

Visual hierarchy: 1) falcon symbol, 2) `PEREGRINE`, 3) tagline, 4) descriptor if used.

Horizontal structure: `[Symbol]   PEREGRINE`. Stacked structure: `PEREGRINE` above the tagline.

#### Wordmark typography

| Property | Specification |
|---|---|
| Font | **Bricolage Grotesque ExtraBold** (weight 800) |
| Alternatives | Space Grotesk Bold, Sora ExtraBold, Manrope ExtraBold, Plus Jakarta Sans ExtraBold. Use only if the primary is unavailable, and never mix fonts across assets. |
| Tracking, primary wordmark | `+0.08em` to `+0.14em` |
| Tracking, small wordmark | `+0.12em` to `+0.18em` |
| Rule | Moderate tracking for a premium aerospace/infrastructure feel. Excessive spacing that weakens the word is not allowed. |

The wordmark tracking is deliberately different from the heading style in 14.3 (`-0.02em`). The wordmark is a logo, not a heading. Never set it with heading styles.

#### Spacing and clear space

| Rule | Value |
|---|---|
| Symbol-to-wordmark gap (horizontal) | About **0.5 to 0.7×** the symbol height |
| Alignment | Optical centre of the symbol aligned with the wordmark |
| Contact | The wordmark must not touch or visually merge with the circular symbol |
| Clear space around the complete logo | At least **one quarter of the symbol height** on every side. No other text, border, icon or UI element may enter it. |
| Symbol alone | Preserve clear space around the outer circular arc and the amber node, especially near the upper-right destination point |

#### Wordmark colour

| Background | Wordmark | Optional |
|---|---|---|
| Light (`#FFFFFF` or `#F7FAFC`) | Industrial Navy `#123B63` | Deep Void Navy `#0C2A47` |
| Dark (`#0C2A47`) | Paper White `#FFFFFF` | Muted Blue-Grey `#5B6B80` for subtle secondary details |

Never colour the whole wordmark green or amber. They stay functional accents inside the symbol.

#### Symbol colour roles

| Element | Colour | Meaning |
|---|---|---|
| Main falcon body | `#123B63` | Trust, infrastructure, precision |
| Deep symbol sections | `#0C2A47` / `#081D33` | Strength, resilience, dark-mode depth |
| Secondary circular arc | `#5B6B80` | Navigation, technical structure |
| Wing / delivery accent | `#56A67A` | Brand metaphor for a message crossing a broken network path |
| Alert destination node | `#F4B942` | Alert marker for a remote community. **Keep it small.** It is a destination marker, not decoration. |
| Background | `#FFFFFF` or `#F7FAFC` | Clarity and technical documentation |

All colours above are existing tokens from 14.2. No new colours are introduced.

#### Tagline typography

| Property | Specification |
|---|---|
| Font | Manrope Medium, Bricolage Grotesque Medium, or Inter Medium. `[PROPOSED]` prefer Bricolage Grotesque Medium because it is already loaded, so no extra font is needed. |
| Weight | Medium |
| Case | All uppercase |
| Size | About 20 to 28% of the main wordmark height |
| Tracking | `+0.22em` to `+0.30em` |
| Colour on light | `#5B6B80` |
| Colour on dark | `#DCE5ED` |

**Source inconsistency.** The brand note gives tagline tracking as `+0.22em` to `+0.32em` in its spacing section and `+0.22em` to `+0.30em` in its tagline section. This document uses the stricter range, `+0.22em` to `+0.30em`, so both statements are satisfied.

#### Lockups

| Lockup | Symbol | Wordmark | Tagline | Background |
|---|---|---|---|---|
| Primary light | Navy + blue-grey + green + amber | `#123B63` | `#5B6B80` | `#FFFFFF` |
| Primary dark | White + blue-grey + green + amber | `#FFFFFF` | `#DCE5ED` | `#0C2A47` |
| Small app icon (24 to 32 px) | Falcon and broken arc only. Keep the amber node. Reduce or remove the smallest blue-grey arc detail if it becomes unclear. Keep the green wing accent only if it stays visibly distinct. | none | none | any |

#### Implementation rules for consistency `[PROPOSED]`

1. **Use the master vector asset.** The wordmark in product UI, exports and slides is the outlined-text SVG from `/assets/brand/`, never live text. A missing font then cannot change the logo. Provide light, dark, horizontal, stacked and icon variants.
2. **Do not retype or redraw the logo.** If the asset does not exist yet, leave a clearly marked placeholder. Do not invent a symbol.
3. **Do not modify the logo.** No recolouring outside the roles above, no rotation, stretching, outlining, glow, blur shadow or gradient fill (consistent with 14.1). The hard card shadow from 14.3 applies to cards, not to the logo.
4. **Text-only fallback.** Where an SVG cannot be used (plain README, docs), write `PEREGRINE` in uppercase. If styled with CSS, use the values below. Never use this in product UI.
5. **Green and amber exception.** The symbol's green and amber are brand colours. They are exempt from the "reserve green and amber for status" rule, but only inside the logo asset. Never reuse them elsewhere as decoration, and do not place the logo directly beside a status element in a way that could read as a status.
6. **Brand meaning is not a claim.** The green wing is a metaphor. Do not caption it as delivery success. Sections 7.4 and 14.5 still apply: green is never used for a broadcast that is only transmitted and not confirmed.
7. **Minimum sizes are not specified** in the brand note except the icon range (24 to 32 px). Define minimum sizes for the full lockup and the stacked lockup before shipping (Q20). Do not invent them in code.
8. Brand placements: header lockup, favicon and app icon, exports, slide title and closing slides. Results screens and exports still carry the SIMULATION label (14.5).

```css
/* Text-only fallback for docs. Production uses the SVG asset. */
.wordmark-text{
  font-family:'Bricolage Grotesque','Manrope','Inter',system-ui,sans-serif;
  font-weight:800; text-transform:uppercase;
  letter-spacing:.10em;            /* primary: .08em to .14em */
  color:#123B63;                   /* on dark: #FFFFFF */
  font-style:normal;
}
.tagline-text{
  font-family:'Bricolage Grotesque','Manrope','Inter',system-ui,sans-serif;
  font-weight:500; text-transform:uppercase;
  letter-spacing:.26em;            /* .22em to .30em */
  color:#5B6B80;                   /* on dark: #DCE5ED */
}

/* Composing separate symbol and wordmark parts. A single combined SVG with spacing built in is preferred. */
:root{ --logo-symbol-h:40px; }
.logo-lockup{
  display:inline-flex; align-items:center;
  gap:calc(var(--logo-symbol-h) * .6);        /* 0.5 to 0.7 x symbol height */
  padding:calc(var(--logo-symbol-h) * .25);   /* clear space: 1/4 symbol height */
}
.logo-lockup .symbol{ height:var(--logo-symbol-h); width:auto; }
/* wordmark height ratio comes from the master asset (not specified in the brand note) */
```

---

## 15. User interface structure

Target information architecture unless the team records a change. Do not add screens to look feature-rich.

1. **Network / Scenario Overview.** Components, villages, current scenario, model status, global summary. Always show the SIMULATION label.
2. **Scenario Controls.** Individual failure toggles, cyclone preset, gateway-loss toggle, reset.
3. **Resilience Instruments.** Cell-only vs all channels vs plan, with window and assumptions beside the values. `OverallReach` and `MinVillageReach` side by side.
4. **Silence Clock grid** (Section 8) `[PROPOSED]`.
5. **Failure Diagnosis.** Ranked failures, cascading path, steepest drop, affected villages, **Redundancy Illusion panel** (Section 9) `[PROPOSED]`.
6. **Recovery Planning.** Intervention options, 72-hour matrix, then budget input, objective toggle ("Save the most people" / "Leave no one behind"), floor control, recommended plan with reasons `[PROPOSED]`.
7. **Alert Composer.** Severity, language, validity window, channel payload preview. Labelled simulated.
8. **Integrity / Audit Panel.** Section 13.
9. **Experiment Log** `[PROPOSED]`. Run ID, scenario, settings, metrics, baseline comparison, export.

Core demo flow must be obvious and achievable without relying on vertical scroll. If content scrolls, use intentional panel-level scrolling, never hide important controls.

---

## 16. Demo story and pitch

### 16.1 Pitch, current features only `[DECIDED]` (from Bible v1.0)

"When a cyclone hits, power can fail, fibre can be cut, and multiple communication channels can disappear together. Having backup channels is not enough if they share the same hidden dependency. PEREGRINE models how warning reach degrades over time, identifies the failures that hurt the most, and compares recovery options such as backup power and mobile broadcasting. Its purpose is to help planners understand which interventions buy the most resilience, especially for communities most likely to be left unreached. The current prototype is a transparent simulation: its inputs are illustrative, and the next research step is to compare its recommendations against simple baselines and test how robust they are to uncertainty."

### 16.2 Pitch with the new features `[PROPOSED — use only if built and tested]`

"It's two days after a cyclone. Here is the report on who never heard the warning, and why. PEREGRINE writes that report before the disaster. In a transparent simulation it estimates, village by village, how many hours no warning path exists, shows where backup channels secretly share a dependency, and compares budget plans that buy that silence back, including a plan that protects the smallest communities. Every input is an assumption you can change. The next step is validating it against real network data."

### 16.3 Demo sequence (about three minutes)

1. Point out the SIMULATION label and the fictional-data notice.
2. Healthy network: compare cell-only, all-channel, response-plan scores.
3. Apply the cyclone preset. Show the cell-only collapse while other modelled channels retain some reach.
4. Failure ranking, then the dependency path. **Test gateway loss explicitly** and read the result from the model.
5. `[PROPOSED]` Silence Clock grid and Redundancy Illusion panel. Show the three counts the graph actually produces.
6. 72-hour matrix: no investment, generators, mobile unit, combined.
7. `[PROPOSED]` Set a budget, run both objectives, compare the table in 10.6. Describe whatever the data shows.
8. Integrity: verify, tamper-reject, signed withdrawal, only after a live smoke test. Keep to about 15 seconds.
9. State what is assumed, what the model calculated, and what real validation would need.

If the planner is not built and tested, do not call the current matrix an optimiser.

### 16.4 Demo safety

Confirm the demo link works on the presenting machine. Test every button and reset. Keep a local copy and a recorded fallback video. Treat text-to-speech as optional. Any broken feature is "not available in demo". Add a limitations slide yourselves.

---

## 17. Claims policy and hard questions

### 17.1 Safe claims

- PEREGRINE models a fictional network and shows how dependency assumptions affect warning resilience.
- The prototype compares modelled channels and outage interventions under explicit assumptions.
- Its intended contribution is a broadcast-first, dependency-aware analysis and planning workflow.
- Existing alert infrastructure and standards are complementary context, not something PEREGRINE replaces.

### 17.2 Do not claim without further evidence

- That scores describe actual reach in a real disaster.
- That any channel's coverage or arrival time is measured.
- That the project is field-tested, deployed, production-ready or integrated with SACHET.
- That auto-tune assumptions reflect what Indian phones or radios support today.
- That DRM/ATSC capability exists in the target deployment environment without checking current rollout and hardware.
- That signed alerts alone eliminate misinformation or prove issuer identity.
- That cost optimisation exists before it is implemented and tested.
- That a greedy heuristic finds the global optimum.
- That PEREGRINE is first or only of its kind without a prior-art review.
- That Silence Clock hours prove nobody heard a warning. They are modelled hours with no available path.
- That a fairness or illusion result is a finding about the real world. It is a result under stated assumptions.

### 17.3 Canonical answers

**Where do the numbers come from?** "The village world and most channel values are assumptions chosen for an interactive simulation. We label them. The result shows what follows from those assumptions, not a prediction of a real disaster."

**Why not use SACHET?** "PEREGRINE does not replace the alerting system. It explores resilience analysis and intervention planning around the broadcast network that carries warnings."

**What happens if the gateway fails?** "The model identifies the gateway as a critical dependency. A second gateway is a candidate intervention, and we test its benefit with before-and-after scenarios instead of assuming it fixes everything."

**Is this deployable?** "It is a software planning simulation. Deployment needs validated network data, transmitter and receiver integration, operational workflows, security review and approvals."

**What is novel?** "Our intended contribution is connecting dependency-aware failure modelling to time-integrated reach and transparent recovery planning, and we are testing whether it beats simpler baselines."

**Why not just add more channels?** "Channels that share an upstream node fail together. The Redundancy Illusion panel counts how many channels survive one more failure, computed from the dependency graph."

**Is the fairness result real?** "It is a result under our assumptions. The tool lets you change those assumptions and see whether the conclusion holds."

**Is the planner optimal?** "No. It is a greedy heuristic. [If built] on small candidate sets we compare it to the exhaustive optimum and report the gap."

---

## 18. Build plan and acceptance tests

### 18.1 Order of work

| Step | Task | Done when |
|---|---|---|
| 0 | Verify the official problem statement, judging criteria, time limits (Q1-Q4) | Recorded in Section 19 |
| 1 | **Audit** existing S30 and S72 code against Sections 6-7. Read mesh membership, coordinates, combination rule from code. Fix the gateway-in-cyclone behaviour | T-DATA, T-S30, T-S72 pass; Section 6 updated with actual values |
| 2 | Build per-village series and Silence Clock | T-SIL pass |
| 3 | Make the Section 10.2 decision (fairness scenario) and fix costs (placeholders OK, labelled) | Recorded in Section 21 |
| 4 | Build planner (both objectives), before/after, explanations | T-PLAN pass |
| 5 | Redundancy Illusion panel | T-ILL pass |
| 6 | Baselines, experiment log, sensitivity panel | T-EXP pass |
| 7 | Last-mile view for one village | Reads from series, no typed values |
| 8 | Rehearse, record fallback demo, update Section 16 to match what actually works | Smoke test passes |

Suggested workstreams once roles are assigned (record names here): model and algorithm integrity; UI integration and interaction testing; evidence, sourcing and experiment log; pitch, demo choreography and fallback recording. Avoid parallel edits to the same model assumptions or design tokens.

### 18.2 Acceptance tests

**Data and model**

| ID | Test | Expected |
|---|---|---|
| T-DATA-01 | Sum of village populations | 19,900 |
| T-DATA-02 | Tower A / Tower B / no-tower populations | 11,200 / 7,200 / 1,500 |
| T-S30-01 | Healthy cell-only `Resilience_S30` | 78.07% |
| T-S30-02 | Fibre cut, cell-only | 0% (Bible: cyclone cell-only 0%) |
| T-S72-01 | `OverallReach` for all 12 plan × auto-tune cells | Section 6.6 table |
| T-S72-02 | Setting gateway failed in the cyclone preset | Changes results; mesh paths for dependent villages become unavailable |

**Silence Clock**

| ID | Test | Expected |
|---|---|---|
| T-SIL-01 | S72 silence hours, FM villages: none / generators / mobile / both | 48 / 23 / 24 / 0 |
| T-SIL-02 | Thoni and Hill Camp, all four plans | 72 / 72 / 72 / 72 |
| T-SIL-03 | `PathAvailable` vs `ExpectedReach` consistency | `PathAvailable = 0` implies `ExpectedReach = 0` |
| T-SIL-04 | Metrics derive from the series | No second code path for the same number |

**Planner**

| ID | Test | Expected |
|---|---|---|
| T-PLAN-01 | Budget 0 | No interventions, after = before |
| T-PLAN-02 | Budget below the cheapest cost | No interventions |
| T-PLAN-03 | Monotonicity: apply any intervention | No village's availability decreases |
| T-PLAN-04 | Determinism: same inputs twice | Identical `PlanResult` |
| T-PLAN-05 | Impossible floor | `floorMet = false`, `villagesBelowFloor` non-empty, no false claim |
| T-PLAN-06 | Budget large enough to afford every candidate | Result equals applying all candidates |
| T-PLAN-07 | Final re-simulation equals incremental state | Metrics match |
| T-PLAN-08 | Same scenario, costs, budget for both objectives | Inputs identical in the log |

**Redundancy Illusion**

| ID | Test | Expected |
|---|---|---|
| T-ILL-01 | Hand-built 3-channel graph with one shared node | `n1_guaranteed = 2` or lower as constructed |
| T-ILL-02 | Karai, healthy, mesh node present `[DERIVED]` | `nominal 3`, `available 3`, `n1_guaranteed 1` (cell and FM share `power_east`). Confirm against code |
| T-ILL-03 | Marina, healthy, mesh node present `[DERIVED]` | `n1_guaranteed 2`. Confirm against code |
| T-ILL-04 | Display | Counts equal function output. No forced values |

**Experiments and UI**

| ID | Test | Expected |
|---|---|---|
| T-EXP-01 | Re-run a logged experiment from its stored config | Identical output |
| T-EXP-02 | Seeded random scenarios | Same seed gives same results |
| T-UI-01 | SIMULATION indicator | Visible on every results screen |
| T-UI-02 | Reduced-motion | Respected |
| T-UI-03 | Status without colour | Every status has text or pattern |
| T-UI-04 | Keyboard | All controls reachable with visible focus |
| T-BRAND-01 | Logo source | Every brand placement uses an SVG from `/assets/brand/`. No live-text wordmark in product UI |
| T-BRAND-02 | Wordmark colour | Fill is `#123B63` or `#0C2A47` on light, `#FFFFFF` on dark. Never green or amber |
| T-BRAND-03 | Spacing | Gap 0.5 to 0.7× symbol height. Clear space at least 1/4 symbol height on every side |
| T-BRAND-04 | Case and style | Uppercase `PEREGRINE`, no italics, no distortion. Tracking within 14.6 ranges |
| T-BRAND-05 | Icon | Used at 24 to 32 px without wordmark. Amber node visible |
| T-BRAND-06 | Tagline | Only the tagline recorded in the decision log appears. If none is recorded, none appears |

An AI assistant must run these before saying a feature is done, and must change the status label in this file only after they pass.

---

## 19. Open questions and decisions required

| # | Question / decision | Status |
|---|---|---|
| Q1 | Exact official problem-statement wording | Open |
| Q2 | Judging criteria and weights | Open |
| Q3 | Does "BTS" mean IEEE Broadcast Technology Society? What expertise will judges have? | Open |
| Q4 | Live demo? Pitch and demo time limits | Open |
| Q5 | Stack and repository / source-of-truth location going forward | Open |
| Q6 | Which real region and event could support an event-grounded scenario (verified data only) | Open |
| Q7 | Is IEEE Xplore document 7608262 the Mauthe et al. paper? | Open |
| Q8 | Tested status of signature and withdrawal | Open |
| Q9 | Defensible cost units for generators, mobile units, gateways | `[DECISION NEEDED]` placeholders until resolved |
| Q10 | Which assumptions are fixed before running comparisons | Open |
| Q11 | **Which six villages have mesh nodes; map coordinates** (read from code) | `[DECISION NEEDED]` blocks Section 9 and mesh hop logic |
| Q12 | **Combination rule** for multiple channels (independent union assumed) | Verify in code |
| Q13 | **Fairness scenario**: S30 (Option 1) vs periodic siren in S72 (Option 2) vs new kit (Option 3) | `[DECISION NEEDED]` (Section 10.2) |
| Q14 | Low-service threshold θ (placeholder 0.25) | Open |
| Q15 | Definition of baseline B (naive independence estimator suggested) | `[DECISION NEEDED]` |
| Q16 | Stay single-file or extract modules (model must stay testable either way) | Open |
| Q17 | Should the cyclone preset keep the gateway alive? (recommended: no, make it a separate explicit toggle and demo beat) | `[DECISION NEEDED]` |
| Q18 | Floor value F default for the fairness plan | Open |
| Q19 | **Tagline**: "Resilience Beyond Reach." (Bible v1.0) vs "FURTHER REACH A BRIGHTER TOMORROW" (brand note), and whether the descriptor accompanies it | `[DECISION NEEDED]` |
| Q20 | **Master brand asset**: create and store the vector symbol, outlined wordmark, light/dark/horizontal/stacked/icon variants in `/assets/brand/`; define minimum sizes; confirm who owns the file | `[DECISION NEEDED]` |

---

## 20. Source register

Carried from Bible v1.0. Inclusion does not mean re-verified as of this date. Re-check time-sensitive facts before use.

**Research and public-warning context**

- CEEW, early-warning systems and disaster preparedness: https://www.ceew.in/publications/how-can-india-strengthen-climate-disaster-preparedness-with-multi-hazard-effective-early-warning-systems
- MicroSave, SACHET system: https://www.microsave.net/2025/07/24/turning-the-tide-how-indias-sachet-system-is-reshaping-disaster-preparedness/
- Inc42, cell broadcast explainer: https://inc42.com/buzz/what-is-the-cell-broadcast-alert-system-tested-by-india/
- The Quint, Cyclone Amphan and cellular tower outages: https://www.thequint.com/amp/story/tech-and-auto/tech-news/cellphone-services-hit-after-amphan-knocks-out-cell-towers-in-west-bengal
- TBS News, Bangladesh tower/power outage reporting: https://www.tbsnews.net/node/1155336
- Greater Kashmir, communications disruption: https://m.greaterkashmir.com/article/telecom-blackout-amid-flood-panic-cuts-kashmir-off-from-world/427585
- Kashmir Times, communication networks and floods: https://kashmirtimes.com/news/why-kashmirs-communication-networks-fail-when-it-matters-most
- ORF, lessons from Kerala floods: https://www.orfonline.org/research/43550-lessons-from-kerala-floods
- CyberPeace, misinformation in crisis: https://cyberpeace.org/resources/blogs/misinformation-in-crisis-challenges-and-role-of-social-media
- IGI Global, misinformation during disasters: https://www.igi-global.com/article/misinformation-in-social-media-during-disasters/303596

**Broadcast and receiver standards**

- Radioinfo Asia, DRM emergency warning feature (older reporting; Indian rollout `[UNVERIFIED]`): https://radioinfo.asia/?p=42082
- DRM Consortium submission to TRAI (2024): https://trai.gov.in/sites/default/files/DRM_Consortium_29102024.pdf
- NAB Show session on ATSC wake-up functionality: https://www.nabshow.com/session/standardized-but-sleeping-awakening-a-forgotten-feature-wake-up-bits
- ATSC Advanced Emergency Information Implementation Guide: https://www.atsc.org/wp-content/uploads/2019/02/AEA-IT-024r32-Advanced-Emergency-Information-Implementation-Guide.pdf
- Communications Today, feature-phone discussion: https://www.communicationstoday.co.in/dots-mandatory-auto-readout-requirement-will-jack-up-prices-say-mfrrs/

**Landscape examples recorded by the team**

- ARCNET: https://news.vidyaacademy.ac.in/?p=76352
- TribalNet: https://www.pcbway.com/project/shareproject/TribalNet_Solar_Powered_LoRa_Mesh_Network_for_Disaster_Communication_14b5b114.html
- Project Owl: https://www.opensourceforu.com/?p=37377

**Team-provided materials**

- Mauthe et al., *Disaster-Resilient Communication Networks: Principles and Best Practices* (uploaded PDF; `[UNVERIFIED]` bibliographic details).
- National Research Council, *Disaster Resilience: A National Imperative* (2012), DOI: https://doi.org/10.17226/13457
- Prem Priyank, *Bioengineering Solutions for Disaster-Resilient Ecosystems* (uploaded PDF). **Not used for PEREGRINE claims** (Section 4).
- Australian Broadcasting Resilience Program release (previously pasted; verify exact source before reuse).
- IEEE Xplore document 7608262 (link only; identity unverified).
- PEREGRINE prior prototype artifact: https://claude.ai/artifact/23sufPMuwPvnyogZYbhbwa (owner-private until shared).
- Team planning note on Silence Clock, Redundancy Illusion and fairness-floor optimiser (pasted 10 Oct 2026). All proposals `[PROPOSED]`.
- Team brand note: PEREGRINE wordmark specifications (pasted 10 Oct 2026). `[PROPOSED]`. Logo concept image not supplied.

---

## 21. Change log and change-request format

| Version | Change |
|---|---|
| Earlier v1 | Initial mesh-plus-dashboard prototype; signed-alert concept; channel payloads |
| Earlier v2 | Dependency-aware failures, resilience score, failure ranking |
| Earlier v3 | Reframed around broadcast; generator and receiver settings |
| Earlier v4 | 72-hour outage-plan matrix; signed withdrawal; original project bible |
| Earlier v5 | Renamed RelayGrid to PEREGRINE; file name kept as `relaygrid.html` |
| Bible v1.0 | Consolidated source of truth plus UI theme; implemented vs proposed R&D; claims policy |
| **Source of Truth v2.0 (draft)** | Added: evidence and source policy; reproduced S30 and S72 test vectors; per-village series and metric definitions; Silence Clock; Redundancy Illusion spec; budget planner spec with fairness floor; experiment protocol; IDE architecture, config and types; acceptance tests; AI-assistant rules. Corrected two planning-note assumptions (no single shared node across all three channels; generators and mobile unit cannot reach Thoni or Hill Camp). All new features `[PROPOSED]`. |
| **Source of Truth v2.1 (draft)** | Added brand identity (14.6): symbol roles, wordmark typography, spacing, clear space, colours, tagline typography, lockups, implementation rules and fallback CSS; brand tests; asset path; AI-assistant rules. Flagged: tagline conflict with Section 1 (Q19), tagline tracking inconsistency inside the brand note (stricter range adopted), logo green/amber exception to the status-colour rule, and the missing master vector asset (Q20). |

### Change request format

Add a dated entry with: **Decision changed**, **Reason** (evidence or constraint), **Impacted areas** (model, UI, architecture, pitch, tests, sources), **Status** (proposed / approved / implemented / verified), **Owner**.

### Decision log (fill in as the team decides)

| Date | Decision | Owner | Status |
|---|---|---|---|
| | Approve `[PROPOSED]` items in Sections 5.2, 8, 9, 10 | | |
| | Fairness scenario choice (Q13) | | |
| | Cyclone preset gateway behaviour (Q17) | | |
| | Cost placeholders (Q9) | | |
| | Tagline for lockup and Section 1 (Q19) | | |
| | Master brand asset and minimum sizes (Q20) | | |

---

## Appendix A. Rules for AI coding assistants and IDE agents

Paste or reference this block at the start of any AI-assisted session.

1. **Read this file first.** Treat it as the spec. If code and this file disagree, do not silently change either. Report the conflict and propose a change request (Section 21).
2. **Never invent numbers.** No hardcoded outputs, no fabricated results, no made-up sources or statistics. Unknowns stay `null` or `[UNVERIFIED]`.
3. **Respect status labels.** Do not present `[PROPOSED]` features as implemented in UI text, comments, slides or demo scripts.
4. **Keep the model pure and deterministic.** No DOM access in model code. Seed any randomness and log the seed.
5. **One source for every number.** Compute metrics from the per-village series. Do not create a second code path for the same value.
6. **Keep S30 and S72 separate** in code, labels and charts.
7. **All parameters come from the config object.** No duplicated defaults.
8. **Always show the SIMULATION label** and the fictional-data notice on any results screen. Never generate real alert content tied to a real location.
9. **Do not remove or weaken** the claims policy, safety checks or limitations wording.
10. **Follow the design tokens exactly** (Section 14). Respect the banned patterns. Provide font fallbacks.
11. **Accessibility is required**: text or pattern with every colour status, visible focus, reduced motion.
12. **Run the acceptance tests** (Section 18.2) before saying a feature is done. Update the status label here only after they pass.
13. **Explain the reasoning** behind modelling and algorithm decisions in comments or the change log, not only the finished code.
14. **Do not add dependencies, network calls or screens** without a recorded reason. The demo must work offline from a local copy.
15. **When uncertain, ask or flag**, do not guess. List the assumption you made in your reply and in a code comment tagged `[ASSUMPTION]`.
16. **Use the brand asset, never retype or redraw the logo.** Place the master SVG from `/assets/brand/` and follow 14.6 for clear space, colours and spacing. If the asset is missing, leave a marked placeholder. Do not invent the symbol.
17. **Do not choose a tagline.** Use the one recorded in the decision log. If none is recorded, omit the tagline.

---

## Appendix B. Glossary

| Term | Meaning |
|---|---|
| Alert window (S30) | 30-minute period in which arrival time determines contribution to the resilience score |
| Outage window (S72) | 72-hour period used for the outage-plan matrix and Silence Clock |
| Path available | At least one channel serving a village has every upstream node up (and, for FM, is on air) |
| Expected reach | Modelled probability a person in a village could receive a warning at a time step |
| Silence hours | Modelled hours with no available warning path |
| Low-service hours | Modelled hours with expected reach below a threshold θ |
| Nominal channels | Channels configured for a village |
| N-1 guaranteed | Channels still available after the worst single additional node failure |
| Common-cause node | A node whose failure disables two or more channels for some village |
| Fairness floor | A minimum time-averaged reach required for every village |
| Worst-served village | The village with the lowest time-averaged reach |
| Greedy planner | Picks the best gain-per-cost option step by step. Not guaranteed optimal |
| Auto-tune | A scenario variable: share of receivers that tune to an emergency broadcast automatically. Not a claim about real devices |
| Event-grounded | Uses some verified facts from a real event but remains model-dependent |
| Lockup | A fixed arrangement of symbol, wordmark and optional tagline or descriptor (14.6) |
| Clear space | Minimum empty zone around the logo, one quarter of the symbol height |

**End of source of truth.**
