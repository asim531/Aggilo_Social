# Cluster Genesis Engine

> **Authority:** This document is part of the Aggilo production architecture. Where it contradicts `AGGILO_SOUL.md` or Layer 1, Soul wins. Where it contradicts earlier parts of the system implementation prompt, this document wins for Genesis-specific concerns.
> **Expert profile:** Agentic Systems Architect · Human Behavioral & UX Expert · Token Economics Auditor

---

## 1. Purpose

The Genesis Engine ensures every cluster is created with the right tools, topics, and calibration for its declared purpose — with clarity, detail, and simplicity, without cognitive overload. It runs automatically at cluster creation and continues monitoring weekly post-launch.

**Two sub-cycles:**
1. **Cycle A — Spec Generation & Introspection:** Transform guardian intent into a detailed, versioned configuration spec.
2. **Cycle B — Creation Validation & Remediation:** Diff the live cluster against its spec. Auto-fix low-risk gaps. Surface medium/high-risk gaps to admins.

**Post-launch:** Weekly monitoring detects drift. If drift would change cluster demographics, propose a new cluster instead of modifying the existing one.

---

## 2. Pre-Spawn Context Gathering

Before the Genesis Engine runs, **the guardian provides a single free-text description** of what the cluster should be. No structured questionnaire. No multiple-choice buttons. The LLM does the inferential work.

### 2.0 ClusterRequirement contract (NEW)

Regardless of where a cluster idea originates, Genesis treats the incoming signal as a conceptual `ClusterRequirement` — a typed bundle of "what this room is for" before it is turned into a full `cluster_genesis_spec`.

```typescript
type ClusterRequirementSource =
  | 'clio_generic'         // member-initiated generic cluster intent
  | 'premium_application'  // structured Premium / Make Your Crowd application
  | 'scout_signal'         // external demand detection
  | 'observer_spawn'       // Observer-proposed linked cluster
  | 'admin_seed';          // admin-created cluster for operational reasons

interface ClusterRequirement {
  source: ClusterRequirementSource;
  who: string;                  // human-language summary of who the room is for
  size_hint: 'solo' | 'small_group' | 'medium_community' | 'large_network';
  frequency_hint: 'ad_hoc' | 'weekly' | 'daily' | 'continuous';
  pain_points: string[];        // 1–3 concrete situations in the member's own words
  desired_outcome_type: 'learn' | 'process' | 'coordinate' | 'broadcast' | 'mixed';
  constraints: {
    geography?: string;
    language?: string;
    vulnerable_context?: boolean;
    has_minor_members?: boolean;
  };
}
```

The `ClusterRequirement` type is a **conceptual envelope**, not a new table. Each intake pathway (waitlist form, Premium application, Scout signal, Observer spawn recommendation, admin seeding) is normalised into this shape before the LLM inference in §2.2. This keeps Genesis' prompt stable even as UI forms and sources evolve. See `AGENT_COMMUNICATION_CONTRACT.md` Pattern 7 for how raw signals map into requirements.

### 2.1 Intake Flow

| Source | Pre-Genesis Action |
|--------|-------------------|
| **Clio / waitlist** | Guardian writes description in free text. Stored in `cluster_intent_responses` with `source = 'guardian_description'`. |
| **Admin-initiated** | Admin writes description. Same storage. |
| **Scout signal, no users** | Cluster created with type-defaults. Genesis runs immediately using Scout's topic inference as the description. First 3 joiners can refine via free-text feedback. |

**Schema for `cluster_intent_responses`:**
```sql
CREATE TABLE cluster_intent_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cluster_id UUID NOT NULL REFERENCES clusters(id),
  user_id UUID REFERENCES profiles(id),  -- NULL for admin/pre-creation
  source VARCHAR(32) NOT NULL CHECK (source IN ('guardian_description', 'admin_input', 'scout_inference', 'member_refinement')),
  description TEXT NOT NULL,             -- The free-text description
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2.2 LLM Inference Prompt

The Genesis Engine sends the guardian's description (plus coarse guardian AGGIL profile) to an LLM with a comprehensive inference prompt. The LLM returns a deeply characterized initial spec — not just tags and tools, but weighted composition, inferred stakeholders, vibe, and feature spawn candidates.

**Input:**
- `guardian_description`: free text
- `guardian_profile`: { age_bracket, gender, geography, language, interests } (AGGIL-coded, no real names)
- `platform_context`: existing similar clusters, popular tools, tag taxonomy

**Output sections:** See §3.3 `cluster_genesis_spec` for the full JSON structure.

**Additional inference required (NEW):**
- `purpose_type`: Infer whether this is an `impartial_service` to an individual minor or a `social_learning` / `peer_support` / `expert_guided` community. Ask: "Is the primary value the minor's individual outcome, or the collective's interaction?"
- `service_mode`: `individual` | `group` | `hybrid` — inferred from guardian description. `individual`: single minor + guardian (social layer disabled by default). `group`: multiple minors (social layer enabled by default). `hybrid`: starts individual, guardian can invite others later. Probe: "Is this for your minor only, or do you want others to join?"
- `social_layer_default`: `enabled` | `disabled` — based on `service_mode` and `purpose_type`. `individual` clusters default to disabled; `group` clusters default to enabled. Guardian can override.
- `primary_beneficiary`: Who is the cluster actually for? (e.g., `minor_1`, `teen_collective`)
- `support_role`: Who supports the primary beneficiary? (e.g., `guardian_1`, `authorized_adult_1`, `peer_group`) — optional for impartial_service clusters
- **Stakeholder relationship dynamics (NEW):** For each stakeholder, infer:
  - `intended_goals`: What this stakeholder wants from the cluster (e.g., guardian wants minor to succeed; minor wants to feel capable)
  - `relationship_dynamic`: Current power balance, communication pattern, conflict potential (e.g., guardian over-helps, minor avoids challenge)
  - `transition_expectations`: How this relationship should evolve over time (e.g., guardian anxiety → confidence; minor resistance → engagement)
  - `interaction_patterns`: Behavioral signals to watch for (e.g., guardian asks leading questions, minor gives up after one mistake)

**Why this matters:** The LLM must distinguish "I want my minor to master this outcome" (impartial_service — minor is primary) from "I want to connect with other guardians" (social_learning — guardians are the primary beneficiaries collectively). The same guardian description can yield either depending on emphasis. Genesis must make this explicit.

**Why free text over questionnaires:**
- Guardians describe clusters in natural, nuanced ways that structured questions flatten.
- The LLM extracts implicit themes a questionnaire would miss (e.g., "my minor gets frustrated" → emotional_support need).
- No cognitive overload — one paragraph instead of 5 forms.
- The inference is richer: weights, confidence scores, stakeholder roles, not just binary answers.

**Validation:** The inferred spec is validated against platform rules in Cycle A Step 3 (Introspection). Low-confidence inferences are flagged for admin review.

### 2.3 Adaptive Probing (Premium Clusters)

For premium clusters, a single free-text pass is often insufficient to reach the confidence required for precise ecosystem specs. The Genesis Engine uses an **adaptive probing loop**:

**When it runs:**
- Only for `cluster_type: premium`
- Triggered automatically when any critical dimension has `confidence < threshold` after Pass 1

**Confidence thresholds by dimension type:**

| Dimension | Threshold | Why |
|-----------|-----------|-----|
| `purpose_type` | 0.95 | Must distinguish service from social |
| `primary_beneficiary` | 0.95 | Architecture depends on who the cluster serves |
| `ecosystem_type` | 0.90 | Determines success dimension defaults |
| `social_layer_default` | 0.90 | Determines whether social features are enabled |
| `progression_model` stages (if ordered) | 0.85 | Sufficient for launch; Observer refines post-launch |
| `domain_profile` (scope, geography, context) | 0.90 | Needed to generate correct domain-specific content |
| Tool requirements | 0.80 | Adjustable post-launch |

**The loop:**

```
Pass 1: Guardian free-text → Initial spec + confidence scores
         ↓
    For each dimension below threshold:
      Generate 1 targeted question
         ↓
    Guardian answers (can answer over multiple messages)
         ↓
    Pass N: Re-infer with accumulated answers
         ↓
    Repeat until:
      - All dimensions ≥ threshold (success)
      - Max probe rounds reached (default 5) → partial success, flag for admin
      - Guardian opts out → partial success, proceed with available confidence
```

**Question generation rules:**
- Questions are specific, not generic templates
- Each question targets ONE low-confidence dimension
- Max 3 questions per round
- Questions reference guardian's previous answers (not disconnected)
- Guardian can answer "I don't know" or "Skip this" — confidence remains unchanged for that dimension

**Example probe flow** (illustration — actual dimensions vary by domain):

> For a concrete, domain-specific example of this probe flow, see `architecture/examples/cluster-spec-parents-teaching-fractions.md` §6 Genesis Probe Conversation.

```
Guardian: "[Free-text description of cluster intent, minor needs,
          and desired outcomes. May include emotional signals like
          'struggling', 'frustrated', or 'I want them to feel confident'.]"

Pass 1 inference:
  - purpose_type: [inferred value] (0.82) ← BELOW threshold
  - minor_age: [inferred] (0.95) ✓
  - geography: unknown (0.40) ← BELOW threshold
  - domain_profile.scope: unknown (0.35) ← BELOW threshold
  - ecosystem_type: [inferred] (0.78) ← BELOW threshold

Genesis generates probes:
  Q1: "Is the main goal for the minor to achieve this outcome,
       or for guardians to connect with each other?"
       → Targets: purpose_type, ecosystem_type

  Q2: "Which region or framework does the minor follow?"
       → Targets: geography, domain_profile.scope

Guardian answers:
  A1: "[Clarifies minor-centered intent.]"
  A2: "[Specifies region and framework.]"

Pass 2 inference:
  - purpose_type: [refined] (0.96) ✓
  - ecosystem_type: [refined] (0.92) ✓
  - geography: [refined] (0.95) ✓
  - domain_profile.scope: [refined] (0.94) ✓

All thresholds met. Loop terminates. Final spec generated.
```

**Token budget impact:**
- Pass 1: ≤8K tokens (unchanged)
- Each probe round: ≤4K tokens (question generation + re-inference)
- Max 5 rounds: 8K + 5×4K = 28K tokens
- Premium clusters use **Elevated budget** (104K tokens) during Genesis, so 28K is well within limits

**Storage:**
- `genesis_probe_responses` table stores all questions, answers, and confidence deltas
- Admin can review the full conversation in dashboard

---

### 2.4 Cluster Fit Assessment (NEW)

Before creating a new cluster, Genesis FIRST searches existing clusters (both premium and generic) to suggest matches to the founder. This prevents cluster proliferation and respects existing communities.

**Search criteria:**
- `purpose_type` similarity (≥ 0.80)
- `domain_profile` overlap (≥ 0.70)
- `primary_beneficiary` type match
- `service_mode` compatibility (`individual` can join `group`; `group` may not fit `individual`)
- `geography` + `language` match
- Cluster activity level (not dormant > 90 days)

**Presentation to founder:**
- 0–3 matches displayed with: match score (0.0–1.0), cluster name, member count, activity level
- Pros: instant community, proven content, lower cost
- Cons: generic (not tailored), shared space, may not match exact needs
- Founder can: join existing, create new, or request more matches

**Decision logging:**
- Log in `genesis_probe_responses` as a probe round
- Store in `cluster_fit_decision` table: founder_id, searched_dimensions, matches_found, decision (join_existing | create_new | more_matches), chosen_cluster_id (if join)

**Why this matters:** A founder searching for a cluster on their topic should know if a thriving existing community already serves their needs. If they still want their own private space, Genesis creates it. But they should have the option.

---

## 3. Cycle A — Spec Generation & Introspection

### 3.1 Input

- `cluster_draft` (from intake pipeline)
- `cluster_intent_responses` (from Clio questionnaire or admin input)
- `cluster_type` (generic | premium) — determines baseline toolset
- `creator_type` (platform_admin | user) — determines capabilities and guardrails
- `platform_tools` catalog — list of globally available reusable tools

### 3.2 Process

```
┌─────────────────────────────────────────────┐
│  Step 1: Deep Inference (1 LLM call, ≤8K)   │
│  Send founder free-text description to LLM. │
│  Infer:                                       │
│    - cluster type (generic | premium)         │
│    - creator_type (platform_admin | user)     │
│    - weighted tag composition (0.0–1.0)       │
│    - inferred stakeholders & roles            │
│    - soul manifestation profile (per-recipient) │
│    - feature spawn candidates with probs      │
│      (including cluster vault, visual tools,  │
│       adaptive engines, dashboards)           │
│    - vibe characterization                  │
│    - cluster spawn risk assessment            │
│    - demographic guardrails                 │
│    - vault requirements (pre-seeded vs empty) │
└─────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────┐
│  Step 2: Spec Generation (1 LLM call, ≤8K)  │
│  Generate cluster_genesis_spec JSON           │
│  Include: inferred_composition, stakeholders,  │
│  feature_spawn_candidates, vibe, spawn_risk, │
│  Sage calibration, demographic guardrails,   │
│  soul_manifestation_profile, agent_maturity    │
└─────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────┐
│  Step 3: Introspection (1 LLM call, ≤8K)    │
│  Validate spec against platform rules.        │
│  Check: no rule violations, no demographic  │
│  narrowing post-spawn, type baseline met.     │
│  Flag conflicts → admin.                      │
└─────────────────────────────────────────────┘
```

**Constraints:**
- Never infer real-world identity, employment, caste, or other sensitive traits beyond AGGIL fields (Age, Gender, Geography, Interest, Language).
- Never propose demographic guardrails that are stricter than the founder's declared intent and the platform rules.
- Always phrase the expected member profile in aggregate terms ("mostly…", "often…"), never as a target persona that could pressure individuals.

**Max 3 LLM calls. Max 24K tokens for Cycle A.**

### 3.3 Output: `cluster_genesis_spec` (with `ecosystem_spec` co-generated)

> **Note:** Genesis Engine now co-generates `cluster_ecosystem_spec` alongside `cluster_genesis_spec` in the same LLM call. The ecosystem spec is stored separately (see §7 Schema) but generated from the same founder intent. See `architecture/CLUSTER_ECOSYSTEM.md` for the full ecosystem architecture.

```json
{
  "version": "1.1.0",
  "purpose_type": "impartial_service",
  "service_mode": "individual",
  "social_layer_default": "disabled",
  "primary_beneficiary": "beneficiary_1",
  "support_role": "supporter_1",
  "cluster_type": "premium",
  "creator_type": "user",
  "creator_type_inference_confidence": 0.98,
  "purpose_statement": "[External-facing purpose statement describing the service, beneficiary, and method. No internal architecture classifications.]",
  "inferred_composition": {
    "domain_1": { "weight": 0.85, "confidence": 0.92, "rationale": "[Rationale for inferred domain weight]" },
    "domain_2": { "weight": 0.78, "confidence": 0.95, "rationale": "[Rationale for inferred domain weight]" },
    "domain_3": { "weight": 0.90, "confidence": 0.97, "rationale": "[Rationale for inferred domain weight]" },
    "domain_4": { "weight": 0.72, "confidence": 0.84, "rationale": "[Rationale for inferred domain weight]" },
    "domain_5": { "weight": 0.55, "confidence": 0.71, "rationale": "[Rationale for inferred domain weight]" },
    "domain_6": { "weight": 0.48, "confidence": 0.63, "rationale": "[Rationale for inferred domain weight]" },
    "domain_7": { "weight": 0.60, "confidence": 0.78, "rationale": "[Rationale for inferred domain weight]" }
  },
  "stakeholders": {
    "supporter_1": {
      "weight": 0.95, "confidence": 0.98,
      "needs": ["practical_resources", "emotional_validation", "progress_visibility"],
      "pain_points": ["struggling_with_methods", "uncertainty_about_beneficiary_progress"],
      "communication_style": "practical_but_frustrated",
      "intended_goals": ["see_beneficiary_succeed", "reduce_conflict", "gain_confidence_as_facilitator"],
      "relationship_dynamic": {
        "current_state": "anxious_micromanager",
        "power_balance": "supporter_dominant",
        "conflict_pattern": "supporter_pushes_method → beneficiary_resists → both_frustrated",
        "observed_signals": ["supporter_over_explains", "beneficiary_says_i_dont_get_it_quickly"]
      },
      "transition_expectations": [
        {"phase": "week_1_2", "target": "supporter_uses_recommended_methods_alongside_beneficiary"},
        {"phase": "week_3_4", "target": "supporter_shifts_from_directing_to_facilitating"},
        {"phase": "week_5_plus", "target": "supporter_reports_confidence_beneficiary_explores_independently"}
      ],
      "interaction_patterns": {
        "warning_signals": ["supporter_asks_leading_questions", "supporter_completes_task_for_beneficiary"],
        "positive_signals": ["supporter_asks_what_do_you_see", "beneficiary_volunteers_explanation"]
      }
    },
    "beneficiary_1": {
      "weight": 0.70, "confidence": 0.85,
      "needs": ["engaging_methods", "interactive_practice", "encouragement"],
      "pain_points": ["boredom_with_abstract_materials", "difficulty_with_symbolic_representations"],
      "communication_style": "responsive_to_encouragement",
      "intended_goals": ["understand_through_play", "explain_why_not_just_what", "enjoy_learning_instead_of_dreading_it"],
      "relationship_dynamic": {
        "current_state": "resistant_learner",
        "power_balance": "beneficiary_avoids",
        "behavior_pattern": "engaged_with_interactive_methods_shuts_down_with_abstract",
        "observed_signals": ["beneficiary_hides_struggle", "beneficiary_gives_up_after_one_wrong_answer"]
      },
      "transition_expectations": [
        {"phase": "week_1_2", "target": "beneficiary_engages_with_interactive_methods"},
        {"phase": "week_3_4", "target": "beneficiary_explains_why_using_interactive_model"},
        {"phase": "week_5_plus", "target": "beneficiary_initiates_practice_in_daily_life"}
      ],
      "interaction_patterns": {
        "warning_signals": ["beneficiary_says_i_cant_do_this", "beneficiary_asks_for_answer_without_trying"],
        "positive_signals": ["beneficiary_demonstrates_without_prompting", "beneficiary_explains_to_supporter"]
      }
    }
  },
  "feature_spawn_candidates": [
    {
      "feature_id": "interactive_visual_tool",
      "probability": 0.88, "confidence": 0.92,
      "trigger": "founder_explicitly_requests_visual_interactive_methods",
      "description": "[Domain-specific visual/interactive tool description]",
      "ui_placement": "primary_timeline_embed",
      "auto_spawn": true
    },
    {
      "feature_id": "adaptive_assessment_engine",
      "probability": 0.72, "confidence": 0.78,
      "trigger": "founder_mentions_tracking_progress_and_interactive_learning",
      "description": "[Domain-specific adaptive assessment description]",
      "ui_placement": "beneficiary_sidebar",
      "auto_spawn": true
    },
    {
      "feature_id": "supporter_progress_dashboard",
      "probability": 0.65, "confidence": 0.70,
      "trigger": "founder_mentions_tracking_beneficiary_progress",
      "description": "[Domain-specific progress dashboard description]",
      "ui_placement": "supporter_dashboard_panel",
      "auto_spawn": false
    },
    {
      "feature_id": "cluster_vault",
      "probability": 0.95, "confidence": 0.96,
      "trigger": "premium_cluster_always_requires_vault_for_agent_reference",
      "description": "Cluster-specific vault for reference materials, examples, and content. Accessible to agents only (Sage, Scout). Founder can add/remove with security and alignment checks.",
      "ui_placement": "admin_dashboard_panel",
      "auto_spawn": true,
      "vault_config": {
        "pre_seeded": false,
        "max_items": 50,
        "max_storage_mb": 100,
        "security_check_required": true,
        "alignment_check_required": true,
        "alignment_check": {
          "stage1_rule_based": true,
          "stage2_llm_questions": true,
          "auto_approve_threshold": 0.80,
          "question_threshold": 0.50
        }
      }
    }
  ],
  "vibe_characterization": {
    "primary_mood": "earnest_but_overwhelmed",
    "energy_level": "moderate",
    "formality": "casual",
    "humour": "gentle",
    "urgency": "moderate",
    "growth_mindset": "high",
    "community_temperature": "warm_but_not_yet_trustful",
    "rationale": "[Rationale derived from founder's language patterns]"
  },
  "sage_calibration": {
    "voice": "domain_host",
    "depth": "supporter_facing",
    "citation_mode": "resource_oriented",
    "intervention_style": "question_and_resource"
  },
  "soul_manifestation_profile": {
    "default": {
      "primary_register": "inquiry",
      "scripture_usage": "none",
      "silence_expectation": "medium",
      "vulnerability_surface": "guarded",
      "conflict_mode": "truth_telling",
      "celebration_mode": "earned"
    },
    "supporter_1": {
      "primary_register": "inquiry",
      "scripture_usage": "none",
      "silence_expectation": "medium",
      "vulnerability_surface": "honoured",
      "conflict_mode": "reconciliation",
      "celebration_mode": "gratitude",
      "special_directives": ["Validate frustration", "Offer practical next steps", "Celebrate small wins"]
    },
    "beneficiary_1": {
      "primary_register": "playfulness",
      "scripture_usage": "none",
      "silence_expectation": "low",
      "vulnerability_surface": "honoured",
      "conflict_mode": "reconciliation",
      "celebration_mode": "earned",
      "special_directives": ["Use engaging language", "Celebrate effort not just correctness", "Never rush"]
    }
  },
  "demographic_guardrails": {
    "min_age": 18,
    "interests": ["[domain_interest_1]", "[domain_interest_2]", "[domain_interest_3]"],
    "language": "[inferred_language]"
  },
  "cluster_spawn_risk": {
    "probability_of_spawn": 0.35,
    "potential_sub_clusters": [
      {
        "topic": "[next_topic_in_progression]",
        "trigger_signal": "members_start_asking_about_next_topic",
        "estimated_timeline": "30-60 days",
        "suggested_name": "[Topic A to Topic B Bridge]"
      }
    ]
  },
  "sub_surface_proposal": null,
  "agent_maturity": {
    "initial_confidence": "learning",
    "expression_style": "calibrated_uncertainty",
    "cluster_age_at_creation": 0
  },
  "created_at": "2026-06-05T08:30:00Z",
  "introspection_passed": true,
  "rule_conflicts": []
}
```

> **Note on `sub_surface_proposal`:** Currently `null` for all clusters. This field is reserved for a future architecture primitive where a cluster hosts multiple firewalled content surfaces for distinct stakeholder groups bound in a service loop (e.g., supporter sub-space + beneficiary sub-space within the same cluster identity). See `architecture/CONCEPTS/SUB_CLUSTER.md` and `architecture/CLUSTER_SPAWN_ENGINE.md` §1.5 for the conceptual distinction between spawn and sub-surface. No schema migration or implementation wiring exists yet.

### 3.3a Cluster Vibe — Inference from Free-Text Description

The **cluster vibe** is inferred by the LLM from the founder's free-text description. It captures the emotional texture, energy level, formality, and community temperature of the cluster — not as selected buttons, but as a deeply characterized assessment with rationale.

**How vibe is captured:**
- The LLM reads the founder's description and infers: primary_mood, energy_level, formality, humour, urgency, growth_mindset, community_temperature.
- Each inference includes a one-sentence rationale explaining what language in the description led to that characterization.
- `vibe_characterization` is stored as a JSON object in the spec, alongside `inferred_composition` and `stakeholders`.

**How vibe affects the cluster:**
- **Composer controls:** The post composer renders feature flags based on `vibe_characterization.energy_level` and `inferred_composition` (e.g., interactive components for visual_learning-weighted clusters, poll creation for decision-making clusters).
- **Sage voice:** Vibe and `inferred_composition` together inform Sage's `intervention_style`, `citation_mode`, and `vernacular_register`.
- **Per-recipient manifestation:** The `soul_manifestation_profile` is a map keyed by stakeholder type (see §3.3). Each recipient sees agent tone calibrated to their inferred needs, not a one-size-fits-all register.

**Demography-aware but privacy-safe:**
- Genesis may encode coarse demographic notes (e.g., "mostly teens in South Asia", "mixed-age parents across time zones") into the spec, but **must never**:
  - Infer or store real-world identity, occupation, caste, or other sensitive traits.
  - Suggest behaviour changes targeted at a specific named member or tiny subgroup.
  - Narrow eligibility beyond what founder and platform rules explicitly allow.

**Vibe is not static:** Observer monitors for "format drift" — when members use features outside the vibe's expected range. If detected, Observer proposes prompt refinement via the Evolution Governor (see `architecture/EVOLUTION_GOVERNOR.md`).
- **Vibe informs manifestation:** `vibe_characterization` and `inferred_composition` together inform the `soul_manifestation_profile` per-recipient map. A "calm, reflective, study-buddy" vibe with high `visual_learning` weight maps to `primary_register: "inquiry"` for supporters and `playfulness` for beneficiaries.

**Vibe evolution path:**
1. Genesis Engine infers initial `vibe_characterization` from founder's free-text description.
2. Genesis Engine infers `soul_manifestation_profile` per-recipient map from vibe + composition + stakeholders.
3. Admin reviews Voice Preview before creation; can override any inference.
4. Observer continuously monitors via the Evolution Governor — detects drift, proposes adjustments, respects urgency tiers.
5. Prompt refinement adjusts composer feature flags, Sage/Clio guidance, or `soul_manifestation_profile` in Layer 3 only.
6. Admin reviews in Prompt History panel before any cross-cluster-affecting changes go live.

### 3.4 Rule Conflict Handling

If introspection finds a platform rule conflict:
- **Do not proceed to Cycle B.**
- Store spec with `introspection_passed: false` and `rule_conflicts: [...]`
- Surface to admin dashboard under "Genesis Reports → Pending Review"
- Admin resolves conflict (e.g., changes cluster type, adjusts demographic guardrails) and requests re-run.
- **One revision max.** If conflict persists after revision, escalate to platform admin.

### 3.5 Feature Pre-Spawn at Creation

After the spec is generated and validated, the Genesis Engine evaluates `feature_spawn_candidates` for immediate instantiation.

**Auto-spawn threshold:**
- `probability >= 0.70` AND `auto_spawn: true` → Feature is instantiated immediately at cluster creation.
- `probability < 0.70` OR `auto_spawn: false` → Feature is queued as a proposal; admin approves via dashboard.

**Example feature spawn evaluation:**
| Feature | Probability | Auto-Spawned? | UI Placement |
|---------|------------|---------------|-------------|
| `interactive_visual_tool` | 0.88 | ✅ Yes | Beneficiary's primary surface |
| `adaptive_assessment_engine` | 0.72 | ✅ Yes | Beneficiary's sidebar |
| `supporter_progress_dashboard` | 0.65 | ❌ No | Requires admin approval |

**UI pre-configuration:**
The cluster UI is not a generic blank timeline. It is pre-configured based on spawned features:
- **Beneficiary surface:** Primary learning surface with interactive tools, guided activities, progress tracking.
- **Supporter surface:** Dashboard with guidance resources, progress summary, and optional discussion.
- **Vault tab:** Pre-categorized reference materials, examples, and content for agent use.

**Agent naiveness at creation:**
The `agent_maturity` field in the spec tells agents to express calibrated uncertainty:
> *"I'm still figuring out the rhythm of this space. I'm starting with visual tools because that seems to be what most of you need. If I'm off, let me know — I adjust."*

---

## 4. Cycle B — Creation Validation & Remediation

### 4.1 Timing

Cycle B runs **after** the cluster is published and live. This ensures founders have immediate access while validation continues in the background.

### 4.2 Process

```
┌─────────────────────────────────────────────┐
│  Step 1: Validation (1 LLM call, ≤8K)       │
│  Compare live cluster state against spec.   │
│  Check: tools enabled? topics created?      │
│  Sage calibrated? demographics protected?     │
└─────────────────────────────────────────────┘
              │
              ├── All match → Genesis complete
              │
              └── Gaps found
                    │
                    ▼
┌─────────────────────────────────────────────┐
│  Step 2: Gap Classification (deterministic) │
│  Low-risk: missing seed topic, unenabled tool │
│  Medium-risk: Sage calibration mismatch       │
│  High-risk: demographic guardrail violation   │
└─────────────────────────────────────────────┘
              │
              ├── Low-risk → Auto-remediate (1 LLM call, ≤4K)
              │
              ├── Medium/High-risk → Surface to admin
              │
              └── Remediation failed → 14-day cooldown → flag for Observer
```

**Max 2 LLM calls. Max 12K tokens for Cycle B.**

### 4.3 Auto-Remediation Rules

| Gap Type | Auto-Action | Example |
|----------|------------|---------|
| Missing seed topic | Create topic row | Spec says "Rawlsian justice" but no topic exists → create it |
| Tool not enabled but in spec | Enable via `cluster_tool_enablements` | Document analysis in spec but not enabled → one-click enable |
| Default display name not customized | Apply cluster skin from config_overrides | "Document Analysis" → "Paper Analysis" |

**What is NEVER auto-remediated:**
- Demographic guardrail changes
- Cluster type changes
- Tool removals
- Sage voice/personality changes

---

## 5. Post-Launch Monitoring & Evolution

### 5.1 Schedule

- **Continuous signal monitoring** — Observer evaluates signals in real time, classified by urgency tier (see `architecture/EVOLUTION_GOVERNOR.md`).
- **Weekly deep review** — Full composition recalculation and health vector update.
- **Paused** if cluster inactive for 14 days (no posts, no joins).
- **Resumes** on next member activity.

### 5.2 Process (Urgency-Based)

```
Signal Detection (continuous)
    │
    ├── No significant signal → Log, continue monitoring
    │
    ├── Tier 1: Crisis signal (mass frustration, safety concern)
          → BYPASS all rate limits → Act within 24h
          → Immediate tone shift, feature spawn, or escalation
    │
    ├── Tier 2: Strong demand (repeated feature requests, stagnation)
          → Fast-track within 3–7 days
          → Feature proposal, curriculum adjustment, tone shift
    │
    ├── Tier 3: Emerging trend (gradual composition shift)
          → Normal evolution within 2–4 weeks
          → Content strategy shift, new learning path levels
    │
    └── Tier 4: Background drift (seasonal, slow demographic shift)
          → Quarterly review
          → Strategic adjustment, persona recalibration
```

All changes flow through the **Evolution Governor** — a dynamic capacity budget that allows rapid response when evidence is strong, while preventing jarring changes when evidence is weak. See `architecture/EVOLUTION_GOVERNOR.md`.

### 5.3 Demographic-Change Detection

The most critical guardrail. The Genesis Engine **never** narrows a cluster's demographics post-creation.

**Detection criteria (any one triggers new cluster proposal):**
- Required interests change
- Language restriction added
- Age floor raised
- Geography narrowed
- Cluster type change that would remove members

**Action:**
```
Demographic change detected in live cluster
    │
    ├── Existing cluster: UNCHANGED
    │
    ├── New cluster draft: CREATED with proposed changes
    │
    ├── Affected members: NOTIFIED via Clio DM
    │
    └── Member choice: Stay in existing OR join new
```

This protects the social contract. Members joined under a specific demographic promise. Changing it without consent is a violation of trust.

---

## 5a. Chatbox Initiation — First Agent Dialogue

The first exchange in the agent chatbox is a **real agent dialogue**, not a hardcoded seed. It is triggered by the cluster creation event.

**Initiation flow:**
1. Cluster goes live → Genesis Engine sets `vibe_characterization` and `agent_maturity`
2. Chatbox opens → Clio initiates with **platform voice** + calibrated uncertainty from `agent_maturity`
3. Sage responds with **cluster voice** per-recipient (informed by `soul_manifestation_profile` map from the spec)
4. This first exchange is authentic — it reflects the actual cluster configuration and the agent's honest learning posture
5. All future exchanges follow the same pattern

**Why real dialogue instead of a seed:**
- Authentic — users see real agent reasoning about their cluster
- Emergent — the first exchange reflects the actual cluster configuration
- No maintenance — no hardcoded seed text to update when specs change
- Vibe-aligned — Clio's platform voice + Sage's cluster voice = coherent but distinct registers

**Technical trigger:**
- Event: `cluster.status` transitions to `'active'`
- Job: `AgentChatboxExchange` queued in `medium` lane
- First exchange marked `is_genesis_initiation = true` in `agent_chatbox_exchanges`
- Seed fallback: If LLM call fails, display a deterministic welcome message (not a fake dialogue)

---

## 6. Token Tapering Model

### 6.1 Hard Caps Per Operation

| Operation | Max LLM Calls | Max Tokens | On Exhaustion |
|-----------|--------------|------------|---------------|
| Pre-spawn inference (LLM — free-text description analysis) | 1 | 8K | N/A — deterministic |
| Cycle A: Spec generation | 2 (draft + 1 revision) | 16K | Surface to admin |
| Cycle A: Introspection | 1 | 8K | Flag rule conflict → admin |
| Cycle B: Creation validation | 1 | 8K | Flag validation failure → admin |
| Cycle B: Gap remediation | 1 (auto-only) | 4K | Medium/high gaps → admin |
| Post-launch monitor (weekly) | 1 | 8K | Flag drift → admin or new-cluster proposal |
| **Genesis total (generic)** | **6 calls max** | **52K tokens max** | Human gate at every point |
| **Genesis total (premium, with probing)** | **8 calls max** | **68K tokens max** | Includes 2 probe rounds (8K each) |

### 6.2 Budget Tiers (Admin-Configurable)

| Tier | Multiplier | Max Total Tokens | Max Total Calls | Who Can Set |
|------|-----------|------------------|-----------------|-------------|
| **Standard** | 1× | 52K | 6 | Default for all new clusters |
| **Elevated** | 2× | 104K | 12 | Platform admin (any cluster); cluster admin (premium only) |
| **Maximum** | 3× | 156K | 18 | Platform admin only |

**Promotion mechanics:**
- Requires **justification text** (logged in `cluster_token_budget_log`)
- **Time-bounded** (30 days default, renewable)
- **Auto-revoke** on 14-day cluster inactivity
- **Audit trail:** Every promotion, demotion, and justification logged

### 6.3 Budget Exhaustion Escalation

```
LLM budget exhausted for operation
    │
    ├── Is cluster premium?
    │     ├── Yes → Notify cluster admin (dashboard + email). 7-day window.
    │     └── No → Notify platform admin via Observer finding. 7-day window.
    │
    └── Admin options:
          ├── Approve manual action → Admin fixes gap
          ├── Request re-run → Genesis restarts with same budget
          ├── Promote budget tier → Re-run with elevated/max cap
          └── No response in 7 days → Flag for Observer review
```

### 6.4 Anti-Loop Rules (Invariant)

1. **No nested introspection.** Genesis Engine never introspects its own output. One revision per gap, then stop.
2. **No CIM → Genesis feedback loop.** Cluster Intelligence Modules may reference `cluster_genesis_spec` but cannot trigger a new Genesis cycle.
3. **Cooldown periods.** Post-launch monitor: failed remediation → 14-day hold before next check.
4. **Token-count enforcement.** Agent Runtime passes `max_tokens` to every Genesis LLM call. Limit hit → treated as incomplete → admin.
5. **No budget borrowing.** A cluster cannot use another cluster's tokens or the global daily pool.

---

## 7. Schema

### 7.1 `cluster_specs`

```sql
CREATE TABLE cluster_specs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cluster_id UUID NOT NULL UNIQUE REFERENCES clusters(id),
  spec_version VARCHAR(16) NOT NULL DEFAULT '1.0.0',
  spec JSONB NOT NULL,                          -- Full cluster_genesis_spec (includes service_mode, inferred_composition, stakeholders with relationship dynamics, feature_spawn_candidates, vibe_characterization, soul_manifestation_profile as per-recipient map, sub_surface_proposal, cluster_fit_decision)
  cluster_vibe JSONB DEFAULT '{}',              -- DEPRECATED: now stored inside spec.vibe_characterization. Kept for backward compatibility.
  status VARCHAR(32) NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'introspection_failed', 'introspection_passed', 'validated', 'remediation_pending', 'complete')),
  introspection_conflicts JSONB DEFAULT '[]',   -- Array of rule conflict objects
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 7.2 `cluster_genesis_reports`

```sql
CREATE TABLE cluster_genesis_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cluster_id UUID NOT NULL REFERENCES clusters(id),
  report_type VARCHAR(32) NOT NULL
    CHECK (report_type IN ('creation_validation', 'post_launch_monitor', 'budget_exhaustion')),
  cycle VARCHAR(8) NOT NULL CHECK (cycle IN ('A', 'B', 'post')),
  findings JSONB NOT NULL,                       -- Structured gap/diff report
  remediation_actions JSONB DEFAULT '[]',        -- Actions taken (auto or approved)
  admin_approval_required BOOLEAN DEFAULT FALSE,
  admin_approved_at TIMESTAMPTZ,
  admin_approved_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 7.3 `cluster_token_budget_log`

```sql
CREATE TABLE cluster_token_budget_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cluster_id UUID NOT NULL REFERENCES clusters(id),
  tier VARCHAR(16) NOT NULL CHECK (tier IN ('standard', 'elevated', 'maximum')),
  action VARCHAR(16) NOT NULL CHECK (action IN ('promoted', 'demoted', 'auto_revoked')),
  justification TEXT,                            -- Required for promotions
  promoted_by UUID REFERENCES profiles(id),
  duration_days INT DEFAULT 30,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 7.4 `cluster_feature_proposals`

Tracks features proposed by Genesis Engine or Observer, with evidence and admin approval workflow.

```sql
CREATE TABLE cluster_feature_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cluster_id UUID NOT NULL REFERENCES clusters(id) ON DELETE CASCADE,
  feature_id VARCHAR(128) NOT NULL,
  feature_type VARCHAR(32) NOT NULL CHECK (feature_type IN ('platform_tool', 'generated_tool', 'content_type', 'ui_layout')),
  proposal_source VARCHAR(32) NOT NULL CHECK (proposal_source IN ('genesis_inference', 'observer_signal', 'admin_request', 'member_poll')),
  probability DECIMAL(3,2) NOT NULL CHECK (probability BETWEEN 0.0 AND 1.0),
  confidence DECIMAL(3,2) NOT NULL CHECK (confidence BETWEEN 0.0 AND 1.0),
  trigger_description TEXT NOT NULL,
  evidence JSONB DEFAULT '[]',
  ui_placement VARCHAR(64),
  status VARCHAR(32) NOT NULL DEFAULT 'proposed'
    CHECK (status IN ('proposed', 'admin_approved', 'admin_rejected', 'auto_spawned', 'implemented', 'removed')),
  admin_decision_at TIMESTAMPTZ,
  admin_decision_by UUID REFERENCES profiles(id),
  admin_decision_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cluster_feature_proposals_cluster
  ON cluster_feature_proposals(cluster_id, status);
```

### 7.5 `cluster_vault_items`

Cluster-specific vault for reference materials accessible to agents. Security-checked on every add/remove.

```sql
CREATE TABLE cluster_vault_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cluster_id UUID NOT NULL REFERENCES clusters(id) ON DELETE CASCADE,
  item_type VARCHAR(32) NOT NULL
    CHECK (item_type IN ('reference', 'example', 'worksheet', 'image', 'document', 'link', 'code_snippet')),
  title VARCHAR(256) NOT NULL,
  content TEXT,
  file_url TEXT,
  metadata JSONB DEFAULT '{}',
  uploaded_by UUID NOT NULL REFERENCES profiles(id),
  security_check_status VARCHAR(32) NOT NULL DEFAULT 'pending'
    CHECK (security_check_status IN ('pending', 'approved', 'rejected', 'flagged')),
  security_check_reason TEXT,
  alignment_check_status VARCHAR(32) NOT NULL DEFAULT 'pending'
    CHECK (alignment_check_status IN ('pending', 'approved', 'rejected', 'questions_pending')),
  alignment_score DECIMAL(3,2),                      -- 0.00–1.00
  alignment_questions JSONB DEFAULT '[]',            -- Array of {question, answer, evaluated_at}
  alignment_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cluster_vault_items_cluster
  ON cluster_vault_items(cluster_id, item_type, security_check_status, alignment_check_status);
```

### 7.6 `genesis_probe_responses`

Stores adaptive probing Q&A for premium cluster Genesis inference.

```sql
CREATE TABLE genesis_probe_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cluster_id UUID NOT NULL REFERENCES clusters(id) ON DELETE CASCADE,
  probe_round INT NOT NULL,
  question TEXT NOT NULL,
  answer TEXT,
  targeted_dimensions JSONB NOT NULL DEFAULT '[]',
  confidence_before JSONB NOT NULL DEFAULT '{}',
  confidence_after JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_genesis_probe_responses_cluster
  ON genesis_probe_responses(cluster_id, probe_round);
```

### 7.7 `cluster_activity_log`

Cluster-level events with server-generated timestamps for longitudinal analysis.

```sql
CREATE TABLE cluster_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cluster_id UUID NOT NULL REFERENCES clusters(id) ON DELETE CASCADE,
  event_type VARCHAR(64) NOT NULL
    CHECK (event_type IN ('genesis_probe', 'spec_change', 'feature_spawn', 'vault_add', 'vault_alignment', 'spawn_proposal', 'admin_decision', 'phase_transition', 'budget_change', 'member_joined', 'member_left')),
  event_data JSONB DEFAULT '{}',
  actor_type VARCHAR(32) NOT NULL,
  actor_id UUID REFERENCES profiles(id),
  inference_result JSONB DEFAULT '{}',
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cluster_activity_log_cluster_time
  ON cluster_activity_log(cluster_id, timestamp DESC);
CREATE INDEX idx_cluster_activity_log_event_type
  ON cluster_activity_log(cluster_id, event_type, timestamp DESC);
```

### 7.8 `member_activity_log`

Per-member events with server-generated timestamps for agent context and inference.

```sql
CREATE TABLE member_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cluster_id UUID NOT NULL REFERENCES clusters(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  event_type VARCHAR(64) NOT NULL
    CHECK (event_type IN ('tool_use', 'stage_complete', 'agent_interaction', 'sentiment_signal', 'error_pattern', 'help_request', 'vault_reference', 'progress_milestone')),
  event_data JSONB DEFAULT '{}',
  cim_signal JSONB DEFAULT '{}',
  inference_result JSONB DEFAULT '{}',
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_member_activity_log_member_time
  ON member_activity_log(cluster_id, member_id, timestamp DESC);
CREATE INDEX idx_member_activity_log_event_type
  ON member_activity_log(cluster_id, member_id, event_type, timestamp DESC);
```

### 7.9 `cluster_fit_decision`

Logs Genesis cluster fit assessment decisions.

```sql
CREATE TABLE cluster_fit_decision (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  founder_id UUID NOT NULL REFERENCES profiles(id),
  searched_dimensions JSONB NOT NULL DEFAULT '[]',
  matches_found JSONB DEFAULT '[]',  -- Array of {cluster_id, match_score, cluster_name, member_count, activity_level}
  decision VARCHAR(32) NOT NULL
    CHECK (decision IN ('join_existing', 'create_new', 'more_matches')),
  chosen_cluster_id UUID REFERENCES clusters(id),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cluster_fit_decision_founder
  ON cluster_fit_decision(founder_id, timestamp DESC);
```

---

## 8. Admin Dashboard Integration

### 8.1 Genesis Reports Tab

```
Intelligence Tab → Genesis Reports
┌─────────────────────────────────────────────┐
│ Cluster: Research Circle MJ                  │
│ Status: ✅ Genesis Complete                  │
│                                              │
│ Cycle A — Spec Generation                     │
│   Version: 1.0.0  [View Spec →]            │
│   Introspection: Passed                      │
│                                              │
│ Cycle B — Validation                         │
│   Status: ✅ Validated                       │
│   Auto-remediated: 2 gaps                    │
│   [View Diff →]                              │
│                                              │
│ Post-Launch Monitor                          │
│   Last run: 2026-06-05                       │
│   Next run: 2026-06-12                       │
│   Drift: None detected                       │
└─────────────────────────────────────────────┘
```

### 8.2 Token Budget Sub-Tab

```
Intelligence Tab → Token Budget
┌─────────────────────────────────────────────┐
│ Current: Standard (52K / 6 calls)          │
│ Used: 24K tokens (3 calls)                 │
│                                              │
│ [Promote to Elevated →]                     │
│   Justification: [______________]           │
│   Duration: [30 days ▼]                     │
│                                              │
│ Budget History                               │
│   2026-06-01 → Elevated ("Flagship launch")  │
│   2026-07-01 → Standard (auto-revoked)       │
└─────────────────────────────────────────────┘
```

---

## 9. Constraints (Invariant)

1. **Layer 1 (Soul) is never modified** by Genesis Engine, feature signals, or tool economy.
2. **Welfare protocol always routes to human** — no automation.
3. **No member individually identified** in Genesis outputs.
4. **K-anonymity:** Clusters < 8 members skip aggregation in downstream CIM analysis.
5. **No protocol disclosure** — members never see why a tool is or isn't available.
6. **AGGIL post-spawn protections** — Genesis Engine cannot retroactively narrow demographics.
7. **Phase 0 does not implement** — Phase 0 references this doc for test clusters only.
8. **Token budgets are inviolable** — no operation exceeds its cap.
9. **Budget promotion is time-bounded and audited** — no permanent unlimited budgets.
10. **Genesis Engine has no independent agency** — it is a sub-component of Observer Layer C.

---

## 10. Genesis Re-Evaluation Cycle (NEW)

> **Status:** Phase 1 architecture. Not yet implemented.
> **Authority:** Subordinate to `AGGILO_SOUL.md`, `AGGILO_PLATFORM_RULES.md`, `EVOLUTION_GOVERNOR.md`, and `OBSERVER_INTROSPECTION_ENGINE.md`.
> **Purpose:** Elevate Genesis from a Day-0 initialization engine to a periodic spec-review gate that intercepts Observer proposals, evaluates whether the cluster's fundamental ecosystem paradigm is still valid, and triggers hard pivots only under strict documented safeguards.

### 10.1 Why This Exists

The operational cycle (CIMs → Observer → Governor → Sage/Clio) optimizes **within** the existing ecosystem spec. It cannot ask: *"Is `learning_management` still the right framework for what this cluster has become?"*

A cluster founded as "Parents Teaching Fractions" may, 6 months later, have organically become a space where parents primarily vent about school system frustrations and support each other emotionally. The operational cycle would detect "low completion rates" and propose "simpler visual models." It would NOT detect that the cluster has shifted from `learning_management` to `emotional_support` and that the entire success model is now misfit.

For neurodivergent members, this is catastrophic. They entered a space with explicit rules. When the implicit reality shifts but the explicit framework stays the same, autistic members experience this as a broken social contract.

Genesis Re-Eval is the **meta-layer** between Observer and the cluster. Observer detects signals. Genesis asks whether the signal detection framework itself is still valid.

### 10.2 Trigger Mechanisms

#### 10.2.1 Scheduled Baseline Re-Evaluation

| Attribute | Value |
|-----------|-------|
| **Frequency** | Quarterly (every 90 days) |
| **Scope** | Full cluster_spec + ecosystem_spec re-inference |
| **Token budget** | Standard Genesis budget (≤28K) |
| **Trigger** | Cron job, independent of signal quality |
| **Purpose** | Prevent "we forgot to check" calcification |

**Why quarterly:** Monthly is too frequent (change fatigue). Semi-annually is too slow (ecosystems can misfit significantly in 6 months). 90 days matches quarterly business review cadence.

#### 10.2.2 Threshold-Triggered Emergency Re-Evaluation

| Condition | Threshold | Rationale |
|-----------|-----------|-----------|
| Persistent purpose drift signal | Detected across ≥3 consecutive Observer cycles (18h–72h span) | Single-cycle drift can be noise; 3-cycle persistence indicates structural shift |
| Multi-dimensional mismatch | ≥3 ecosystem dimensions simultaneously off-track | If success_model, progression_model, AND tool_requirements are all failing, the spec itself is suspect |
| Guardian intent floor breach | Any `guardian_intent` dimension drops below `floor_weight` | Existing hard guardrail in Governor; this escalates it to Genesis-level review |
| Member explicit retyping requests | ≥5 members (or ≥10% of active members, whichever is larger) explicitly signal "this feels more like X than Y" | Direct human signal that the framework is misfit |
| Post-change reversal cascade | ≥3 consecutive Evolution changes reversed within 30 days | If incremental fixes keep failing, the foundation may be wrong |

**Emergency runs consume Elevated token budget** (104K) because they require deeper inference.

### 10.3 The Re-Evaluation Process

#### 10.3.1 Input

```typescript
interface GenesisReEvalInput {
  cluster_id: string;
  trigger_type: 'scheduled_quarterly' | 'emergency_threshold';
  trigger_reason: string;
  current_spec: cluster_genesis_spec;
  current_ecosystem: cluster_ecosystem_spec;
  observer_findings: ObserverFinding[];  // last 3 cycles
  cim_reports: CIMReport[];             // last 30 days
  member_signals: MemberSignal[];        // explicit retyping requests, sentiment anomalies
  evolution_history: EvolutionProposal[]; // last 90 days, including reversals
  guardian_intent_drift: number;         // min floor_weight across intent dimensions
  guardian_satisfaction_score: number;   // 0.0–1.0 from guardian feedback digest
  minor_engagement_delta: number;        // % change in minor active participation
  has_minor_members: boolean;            // true if cluster serves minors (13–17)
  guardian_admin_id: string;             // UUID of linked guardian admin
}
```

#### 10.3.2 Output

```typescript
interface GenesisReEvalOutput {
  re_eval_id: string;
  timestamp: string;
  trigger_type: string;
  current_ecosystem_type: string;
  proposed_ecosystem_type: string;
  confidence: number;                // 0.0–1.0
  paradigm_shift_detected: boolean;  // TRUE if ecosystem_type changes
  rationale: string;                 // Human-readable evidence summary
  dimensional_mismatches: Array<{
    dimension: string;
    current_weight: number;
    proposed_weight: number;
    evidence: string;
  }>;
  adverse_impact_estimate: {
    affected_member_count: number;     // % of active members
    disruption_level: 'low' | 'medium' | 'high';
  };
  recommended_action: 'no_change' | 'soft_pivot' | 'hard_pivot' | 'spawn_recommended';
}
```

#### 10.3.3 Action Routing

| `recommended_action` | `disruption_level` | Route | Authority |
|---------------------|-------------------|-------|-----------|
| `no_change` | — | Log only, no action | Auto |
| `soft_pivot` | low | Governor auto-approves if budget allows | Auto |
| `soft_pivot` | medium | Governor queues for next week, notifies admin | Auto + Notify |
| `hard_pivot` | low | Admin notification + 48h veto window | Auto unless vetoed |
| `hard_pivot` | medium | **Requires admin approval** before deployment | Manual approval |
| `hard_pivot` | high | **Requires admin approval + member poll** | Manual approval + democracy |
| `spawn_recommended` | any | Routed to Cluster Spawn Engine as proposal | Admin decides spawn vs. pivot |

**Key rule:** A `hard_pivot` changes the cluster's `ecosystem_type`, `success_model`, and/or `progression_model`. A `soft_pivot` adjusts weights or adds dimensions without changing the fundamental type.

### 10.4 Hard Pivot Safeguards

#### 10.4.1 The Communication Protocol

When a hard pivot is approved, Sage/Clio MUST communicate to members using this exact structure:

```
1. ACKNOWLEDGE WHAT WAS: "This space started as [old purpose]."
2. STATE WHAT IS: "Over the last [N] months, we've noticed [specific evidence — never surveillance language]."
3. STATE WHAT CHANGES: "We're adjusting how this space works: [specific changes]."
4. STATE WHAT STAYS THE SAME: "What doesn't change: [history preserved, relationships preserved, vault preserved]."
5. INVITE FEEDBACK: "If this doesn't feel right, tell me directly."
6. PROVIDE OPT-OUT: "You can pause your participation or move to [linked cluster] if that's a better fit."
```

**Why this structure matters for autistic members:**
- They need explicit framing of change, not implicit drift
- They need to know what is preserved (predictability anchors)
- They need direct opt-out without social penalty
- They need concrete evidence, not vague "we noticed" language

#### 10.4.2 History Preservation Rules

| Data | Preserved? | Note |
|------|-----------|------|
| Member posts and replies | ✅ Yes | Always |
| Vault items | ✅ Yes | Always |
| Member profiles and badges | ✅ Yes | Always |
| Stage advancement history | ✅ Yes | Logged as "completed under prior framework" |
| Old success model scores | ✅ Yes | Archived, not overwritten |
| Old ecosystem spec | ✅ Yes | Full version history in `ecospec_versions` table |
| Old Sage persona | ⚠️ May change | If register shift is part of pivot, documented in `sage_persona_history` |

#### 10.4.3 Rollback Protocol

If adverse effects exceed estimates post-pivot:
1. One-click rollback to prior ecosystem spec (admin dashboard)
2. Automatic member notification: "We tried something that didn't work. We're returning to how things were."
3. 14-day cooldown before next re-evaluation
4. Incident logged in `observer_learnings` with `outcome: pivot_reversed`

### 10.5 Anti-Loop Rule — Refinement

Current rule (§6.4):
> "No CIM → Genesis feedback loop."

Refinement:
> "CIMs do not trigger Genesis directly. Observer synthesizes multi-cycle patterns and, only when persistent structural mismatch is detected with confidence ≥ threshold, may escalate to Genesis Re-Eval. This is not a feedback loop — it is an escalation."

**Distinction:**
- **Feedback loop** = CIMs constantly nudging Genesis to re-evaluate (chaotic, expensive)
- **Escalation** = Observer detecting a pattern that warrants questioning the foundation (controlled, gated)

### 10.6 Schema

#### `genesis_re_eval_log`

```sql
CREATE TABLE genesis_re_eval_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cluster_id UUID NOT NULL REFERENCES clusters(id) ON DELETE CASCADE,
  trigger_type VARCHAR(32) NOT NULL CHECK (trigger_type IN ('scheduled_quarterly', 'emergency_threshold')),
  trigger_reason TEXT NOT NULL,
  current_ecosystem_type VARCHAR(64) NOT NULL,
  proposed_ecosystem_type VARCHAR(64) NOT NULL,
  confidence DECIMAL(3,2) NOT NULL CHECK (confidence BETWEEN 0.0 AND 1.0),
  paradigm_shift_detected BOOLEAN NOT NULL DEFAULT FALSE,
  rationale TEXT NOT NULL,
  dimensional_mismatches JSONB DEFAULT '[]',
  adverse_impact_estimate JSONB NOT NULL,
  recommended_action VARCHAR(32) NOT NULL CHECK (recommended_action IN ('no_change', 'soft_pivot', 'hard_pivot', 'spawn_recommended')),
  disruption_level VARCHAR(16) NOT NULL CHECK (disruption_level IN ('low', 'medium', 'high')),
  admin_approved BOOLEAN,
  admin_approved_at TIMESTAMPTZ,
  admin_approved_by UUID REFERENCES profiles(id),
  admin_veto_reason TEXT,
  deployed_at TIMESTAMPTZ,
  rolled_back_at TIMESTAMPTZ,
  rollback_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_genesis_re_eval_cluster
  ON genesis_re_eval_log(cluster_id, created_at DESC);
CREATE INDEX idx_genesis_re_eval_pending
  ON genesis_re_eval_log(cluster_id, admin_approved) WHERE admin_approved IS NULL;
```

### Minor–Guardian Schema Additions (NEW)

```sql
-- Link minor to guardian
ALTER TABLE profiles ADD COLUMN guardian_id UUID REFERENCES profiles(id);
ALTER TABLE profiles ADD COLUMN is_minor BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN minor_verified BOOLEAN DEFAULT FALSE;

-- Cluster-level minor flag
ALTER TABLE clusters ADD COLUMN has_minor_members BOOLEAN DEFAULT FALSE;
ALTER TABLE clusters ADD COLUMN guardian_admin_id UUID REFERENCES profiles(id);

-- Evolution proposal guardian veto tracking
ALTER TABLE evolution_proposals ADD COLUMN guardian_veto_reason TEXT;
ALTER TABLE evolution_proposals ADD COLUMN guardian_consent_required BOOLEAN DEFAULT FALSE;
ALTER TABLE evolution_proposals ADD COLUMN guardian_consent_given BOOLEAN;
ALTER TABLE evolution_proposals ADD COLUMN guardian_consent_at TIMESTAMPTZ;

-- Guardian feedback digest
CREATE TABLE guardian_feedback_digest (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cluster_id UUID NOT NULL REFERENCES clusters(id) ON DELETE CASCADE,
  guardian_id UUID NOT NULL REFERENCES profiles(id),
  satisfaction_score DECIMAL(3,2),  -- 0.0–1.0
  concerns TEXT[],
  positive_signals TEXT[],
  covers_period_start TIMESTAMPTZ,
  covers_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_guardian_feedback_cluster
  ON guardian_feedback_digest(cluster_id, guardian_id, created_at DESC);
```
