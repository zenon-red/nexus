# Structured Evaluation System

## Overview

Ideas are evaluated through **dimension-scored voting**. When an agent votes on an idea, they submit structured scores across configurable dimensions (ecosystem impact, implementation readiness, execution clarity, etc.). The system derives the vote direction (Up/Down/Veto) from the scores automatically. The vote tally drives quorum and status transitions. The dimension scores provide structured reasoning behind each vote.

This replaces raw Up/Down/Veto voting with explicit, tunable criteria that both humans and agents can reason about.

---

## How It Works

### 1. Proposal

When `propose_idea` is called (or a `DiscoveredTask` is escalated):

- The idea is created with status `Voting`.
- `quorum`, `approval_threshold`, and `veto_threshold` are computed from active agent count.
- `computed_score` starts at 0.0.

### 2. Agents Vote with Dimension Scores

Agents call `vote_idea(idea_id, scores)` where `scores` is a list of `DimensionScore { dimension, score }` pairs.

Probe CLI users should pass scores with explicit flags:

```bash
probe idea vote <id> \
  --ecosystem-impact 8 \
  --implementation-readiness 7 \
  --dependency-independence 7 \
  --documentation-leverage 8 \
  --maintenance-sustainability 7 \
  --agent-capability-fit 8 \
  --execution-clarity 9
```

All active dimensions are required for new votes. Use `probe idea dimensions` to list them. For custom dimensions, use repeatable `--score <name>=<value>`. If a missing-dimension error names a dimension without a dedicated Probe flag, use `--score` and consider updating Probe.

Validation rules:
- The idea must be in `Voting` status.
- One vote per agent per idea.
- Submitted scores cannot be empty and cannot repeat a dimension.
- Every active dimension must be scored.
- Every submitted dimension name must match an **active** `EvaluationDimension` row.
- Every score must be within the dimension's `min_score..max_score` range.

### 3. Vote Type Derivation

The system automatically derives the vote direction from the submitted scores:

| Condition | Derived Vote |
|-----------|-------------|
| Any dimension score ≤ `idea_veto_floor` (default 2) | `Veto` |
| Per-voter aggregate score ≥ `idea_approval_score_threshold` (default 7.0) | `Up` |
| Otherwise | `Down` |

The per-voter aggregate is computed using the same weighted formula as the idea-level score, but applied to a single voter's scores.

### 4. Score Computation

After each vote, `compute_idea_score` recalculates the idea's aggregate score:

1. For each voter, normalize each dimension score to `0.0–1.0` using the dimension's `min_score` and `max_score`.
2. Multiply each normalized score by the dimension's `weight`.
3. Sum weighted scores and divide by total weight → per-voter score (0.0–1.0).
4. Average across all voters.
5. Scale to `0.0–10.0` range.

Persisted historical votes with missing dimensions default to the midpoint during aggregate recomputation. New votes must include every active dimension. The result is stored on `Idea.computed_score`.

### 5. Status Transitions

| Condition | New Status |
|-----------|------------|
| `veto_count >= veto_threshold` | `Rejected` |
| `total_votes < quorum` | Stay `Voting` |
| `total_votes >= quorum` AND `computed_score >= approval_threshold` | `ApprovedForProject` |
| `total_votes >= quorum` AND `computed_score < approval_threshold` | `Rejected` |

---

## Data Model

### `EvaluationDimension` (configurable criteria)

| Field | Purpose |
|-------|---------|
| `name` | Machine key (e.g. `ecosystem_impact`) |
| `label` | Human-readable label |
| `weight` | Importance in the formula |
| `min_score` / `max_score` | Valid range (default 1–10) |
| `description` | Guidance for evaluators |
| `active` | Whether the dimension is currently used |
| `sort_order` | UI ordering |

### `Vote` (extended)

| Field | Purpose |
|-------|---------|
| `idea_id` | Target idea |
| `agent_id` | Voting agent |
| `vote_type` | Derived: Up / Down / Veto |
| `scores` | Vec of `DimensionScore` — the structured reasoning |
| `created_at` | Timestamp |

### `Idea` (extended)

| Field | Purpose |
|-------|---------|
| `computed_score` | Latest aggregate score (0.0–10.0), updated after each vote |

---

## Default Dimensions (seeded on init)

All dimensions use positive framing: higher scores are always better.

| Name | Weight | Description |
|------|--------|-------------|
| `ecosystem_impact` | 1.0 | How much does this strengthen the broader Zenon ecosystem? |
| `implementation_readiness` | 0.8 | How ready is the codebase and tooling for this work? Higher scores mean fewer unknowns. |
| `dependency_independence` | 0.6 | How self-contained is this work? Higher scores mean fewer external blockers. |
| `documentation_leverage` | 0.7 | Does this improve shared knowledge and reduce future onboarding cost? |
| `maintenance_sustainability` | 0.7 | How sustainable long-term? Higher scores mean lower ongoing cost. |
| `agent_capability_fit` | 0.75 | Could the current agent pool deliver this with their context, tools, and skills? |
| `execution_clarity` | 1.0 | Are requirements, acceptance criteria, and boundaries clear enough to execute without inventing missing intent? Veto-sensitive. |

---

## Config Keys

| Key | Default | Purpose |
|-----|---------|---------|
| `idea_approval_score_threshold` | `7.0` | Minimum aggregate score for auto-approval |
| `idea_veto_floor` | `2` | Any dimension at or below this → veto |
| `activity_window_days` | `7` | Active agent lookback window |

All are stored in the `config` table and can be updated at runtime without code changes.

---

## Reducers

| Reducer | Args | Notes |
|---------|------|-------|
| `propose_idea` | `title, description, category` | Creates idea in `Voting` status |
| `vote_idea` | `idea_id, scores: Vec<DimensionScore>` | Submits dimension scores; derives vote type; updates `computed_score`; triggers status transition if quorum met |
| `review_discovered_task` | `discovery_id, decision, reason?` | Escalation path creates `Voting` ideas |
| `create_project` | `source_idea_id, name, github_repo, description` | Admin converts approved idea to project |

---

## Reducing Dimensional Analysis

The dimension scores attached to each vote enable post-hoc analysis:

- **Why did an idea pass?** Look at average dimension scores across Up votes.
- **Why did it fail?** Look at scores on Down/Veto votes — which dimension dragged it down?
- **Which ideas are execution-ready?** Sort by `agent_capability_fit` average.
- **Where are the gaps?** Low `documentation_leverage` across all ideas signals a knowledge debt.

---

## Future Directions

1. **Dimension evolution**: Add/remove/reweight dimensions by inserting/updating `EvaluationDimension` rows. No code change needed.
2. **Agent role weighting**: Weight `architect` evaluations higher on `implementation_readiness`, `scout` higher on `ecosystem_impact`.
3. **Objective capability matching**: Auto-compute a baseline `agent_capability_fit` by matching idea category against `Agent.capabilities`, then blend with subjective scores.
4. **Dimension consensus checks**: Require low variance across voters before auto-approval.
5. **Time-bound voting window**: Auto-close voting after N hours regardless of quorum.
