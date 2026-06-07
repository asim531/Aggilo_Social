# Cluster Intelligence Modules (CIM)

> **Status:** Architectural specification — ready for implementation
> **Scope:** Admin-facing intelligence synthesis layer. Not member-facing.
> **Inherits:** `architecture/PLATFORM_AGENCY.md`, `architecture/AGENT_RUNTIME.md`, `architecture/AGENT_COMMUNICATION_CONTRACT.md`
> **Consumes:** Sage Feature Intelligence signal log, Observer findings, Clio FAB aggregated signals (anonymized)
> **Outputs:** Structured intelligence reports → admin dashboard (auto-approve or review)

---

## 1. Purpose

Cluster Intelligence Modules (CIM) are periodic, structured analytical jobs that synthesize cluster data with **LLM inference** to produce actionable intelligence for the cluster admin. CIM does not merely aggregate statistics — it uses the LLM's reasoning capability to infer patterns, tensions, opportunities, and risks that raw data alone cannot surface.

They answer a simple question: **"What is happening in this cluster that the admin should know, and what should they consider doing about it?"**

**Applicable to:** Both **generic** and **premium** clusters. Intelligence adapts to cluster type — premium clusters include Admin/Manager authority signals, vault context, and Workshop state.

CIM is **not** a member-facing feature. Members never see module reports, are never named in output, and cannot opt into or out of analysis. All output is pattern-level, anonymized, and admin-private.

**Background-Only Implementation Principle:** CIM findings, recommendations, and their implementation are invisible to cluster members by default. If a recommendation is approved, it is implemented *subtly in the background* — through Sage persona calibration, content nudges, or configuration changes. Members never receive a public notification that "CIM recommended this." The only way a member ever encounters CIM output is if the **admin deliberately pushes a finding to the Workshop Room** for community discussion.

---

## 2. The Five Modules

Each module targets a different dimension of cluster health. They can run independently or in combination.

### 2.1 Behavioural Module

**Dimension:** Member interaction patterns

**Question it answers:** How are members actually interacting? Is the cluster forming real relationships or just transactional exchanges?

**Evaluates:**
- Reply-network topology (who replies to whom, reciprocity, orphans)
- Engagement depth (thread length, follow-up rate, turn-taking equity)
- Lurker patterns (silent members — see Lurker Typology below)
- Sub-community formation (cliques, splintering, private-language emergence)
- Care-signalling patterns (welfare-adjacent concern, emotional support)
- Informal authority / cultural setter dynamics (who disproportionately sets tone, topic, or norms without formal role)

**Lurker Typology — a lurker is not a problem:**

| Type | Signal | Treatment |
|------|--------|-----------|
| **Satisfied observer** | Reads regularly, never posts, no churn signals | Leave alone. This is healthy community participation. |
| **At-risk lurker** | Used to post, stopped, no longer reading | Churn signal — flag to admin as *member health* observation, not as a problem to solve. |
| **New-member observer** | Joined < 14 days, observing, still reading | Normal acclimation. Do not intervene. |

CIM must never treat lurkers as a problem to solve. The 90-9-1 rule is a feature, not a bug.

**Proposes:**
- **Sub-community surface-to-admin:** Identify potential sub-groups and notify the admin (no automatic split or action suggested). Admin decides if this is healthy density or pathological splintering.
- **Ice-breaker prompts for low-engagement sub-groups** (subtle, background — never public call-outs)
- **Structural adjustments** (threading, DM opening when organically appropriate)
- **Cultural setter observation:** Surface which members disproportionately set tone or norms, and what happens if that person leaves — this is structural intelligence, not a recommendation to act.
- **Sage calibration refinements:** Small deltas to the Genesis Engine baseline (e.g., "Sage should cite more frequently in this cluster"). NOT wholesale rewrites. If a refinement would change cluster type, demographics, or core purpose, it triggers Genesis Engine review instead of direct application.
- **Prompt calibration mismatch flag:** If the Behavioural Module detects register drift (Sage's tone no longer matches member tone), vocabulary gaps, or format coherence issues, it flags `prompt_quality_decline` for the Observer's Priority Queue Engine. This consumes Pool B (prompt refinement budget), not Pool A (general introspection). See `observer/OBSERVER_INTROSPECTION_ENGINE.md` for scoring and budget rules.

**Genesis threshold:** If a Behavioural Module proposal would modify `cluster_genesis_spec` fields (cluster type, tool enablement, demographic guardrails, core purpose), the proposal is routed to the Genesis Engine for review — not applied directly. The Genesis Engine validates the change against platform rules and cluster member impact before any modification.

**Prompt refinement threshold:** If a proposal only affects Layer 3 prompts (Sage register, Clio context fragment, composer feature flags) without changing cluster structure, it is routed to Observer's Channel 1 (autonomous stewardship) with a 30-minute veto window, NOT to the Genesis Engine.

### 2.2 Functional Module

**Dimension:** Feature and tool gaps

**Question it answers:** Are the tools and features available to this cluster sufficient? What friction exists?

**Evaluates:**
- Unused skills (skills Sage never calls, features members ignore)
- Missing capabilities (patterns of need that no tool addresses)
- UX friction (where members drop off, struggle, or create workarounds)
- Feature signals (`feature_signals` table, aggregated only) — organic member needs captured by Clio and Sage polling. **K-anonymity enforced:** Only signals with `frequency_count >= 3` OR from clusters with `>= 8 members` are included. Individual signals (with user_id) are never visible to CIM or any agent.
- Global tool catalog (`platform_tools`) — before proposing a new tool, CIM checks if a matching global tool exists that could be enabled instead.
- Tool coverage (does every cluster type have appropriate tools?)

**Proposes:**
- Skill toggles (enable/disable based on engagement)
- New feature recommendations
- UX simplification for over-complicated flows
- Workflow automations

### 2.3 Vibe Module

**Dimension:** Emotional and tonal health

**Question it answers:** What is the emotional temperature of the cluster? Is it safe, warm, tense, or declining?

**Evaluates:**
- **Real-world ritual recognition:** Before inferring online patterns, CIM considers whether the cluster's members share real-world rituals (prayer times, study circles, seasonal gatherings, family routines). A drop in online warmth may simply reflect Ramadan, exam season, or harvest — not community decline. These are *context, not noise*.
- Tone trajectory (positive → neutral → negative drift over time)
- Trust indicators (vulnerability reciprocation, gratitude expression, honesty under disagreement)
- Belonging signals (in-group language, self-identification with cluster, shared reference emergence)
- Safety perception (absence of coded language, absence of dogwhistles, presence of repair after tension)
- Celebration patterns (milestone recognition, organic gratitude, ritual observance)
- **Conflict and repair patterns:** Healthy communities have visible disagreement followed by visible repair. CIM evaluates *whether repair occurs*, not just whether tension exists. A cluster with zero conflict may be avoiding depth.

**Construct decomposition:** Trust, belonging, and safety have different antecedents and require different interventions. CIM findings must specify *which construct* is affected:

| Construct | Breaks | Rebuilds | Urgency |
|-----------|--------|----------|---------|
| **Trust** | Fast (one betrayal) | Slowly | High if declining |
| **Belonging** | Gradually | Through inclusion rituals | Medium |
| **Safety** | Binary (threshold breach) | Through visible repair | Critical if breached |

**Proposes:**
- Tone-calibration prompts for Sage (background, subtle)
- Celebration opportunities the cluster missed (background nudge, never public shaming)
- Trust-building exercises or content (subtle background implementation only)
- Early-intervention content when tone drifts negative (never a public call-out; routed through Sage's persona calibration)

### 2.4 Purpose Module

**Dimension:** Mission alignment

**Question it answers:** Is the cluster still aligned with its founding purpose? Or has it drifted?

**Evaluates:**
- Content-theme drift (topics moving away from original AGGIL configuration)
- Member-intent alignment (why members joined vs. what they actually do)
- Goal-progress tracking (if the cluster had stated goals)
- Purpose-clarity (new members understanding the cluster's reason for being)

**Proposes:**
- Description refinement (when drift is healthy)
- Purpose-reaffirmation content (background — through Sage persona calibration, never a public call-out)
- Cluster sub-type reclassification

**Background-only principle:** Purpose alignment is never enforced on members publicly. If members seem disconnected from the cluster's purpose, CIM routes this through Sage's persona calibration or subtle content nudges. Explicit "re-onboarding" of individual members is never CIM's output. In future phases, Clio may suggest *implicit routes* for members to deepen their connection — not explicit pairing or call-outs.

### 2.5 Growth Module

**Dimension:** Expansion and sustainability

**Question it answers:** Can this cluster sustain itself? Should it grow, shrink, or restructure?

**Evaluates:**
- Acquisition velocity (new member rate, invitation conversion)
- Retention (28-day, 90-day, cohort-based)
- Capacity tension (too many members for quality interaction?)
- Invitation pipeline (organic demand signals)
- Leadership emergence (natural facilitators, potential managers)

**Proposes:**
- **Sub-community surface-to-admin:** Identify sub-groups and notify the admin (no automatic split suggested). Admin decides if healthy density or pathological splintering. CIM never recommends splitting without admin discernment.
- Merge candidate (when overlap with another cluster is high) — *applicable in later stages*
- Growth pause (when quality would degrade)
- Leadership emergence observation (natural facilitators surfaced to admin for *manual* consideration — CIM never auto-appoints managers)

---

## 3. Execution Model

### 3.1 Trigger Types

CIM runs are triggered by three distinct mechanisms:

| Trigger | When | Who Initiates | Modules Run |
|---------|------|---------------|-------------|
| **Weekly cadence** | Every 7 days, staggered by cluster creation date | Platform scheduler | Conditional (see 3.2) |
| **Creation bootstrap** | 24h after cluster creation | Platform event (`cluster_created`) | All 5 modules (inference mode) |
| **Admin on-demand** | Any time | Admin via dashboard | Admin-selected modules |

**Bootstrap rationale:** A cluster at t+24h has no real data. The bootstrap run produces inference-based intelligence that serves as a baseline. The admin receives a "seed intelligence report" that becomes a reference for future weekly reports.

### 3.2 Module Selection Logic

Not all modules run on every cluster every week. Selection depends on cluster maturity and size.

```
IF creation_bootstrap:
    Run ALL modules (inference mode)
    confidence_multiplier = 0.6

IF weekly_cadence:
    Always run: Vibe, Functional
    IF member_count >= 10:
        Also run: Behavioural, Purpose
    IF member_count >= 25 AND arc_phase >= C:
        Also run: Growth

IF admin_on_demand:
    Run modules specified by admin
    confidence_multiplier = data_quality_multiplier
```

**Why conditional?**
- Vibe and Functional can be meaningfully evaluated with very few members (even 2-3)
- Behavioural requires enough interactions to form a network (minimum 10 members)
- Purpose requires enough content to detect theme drift (minimum 10 members)
- Growth requires enough members to sustain statistical validity (minimum 25, active cluster)

### 3.3 Resource Budget

Each module run consumes:
- **Supabase queries:** ~5-15 queries per module (cached within a single CIM run)
- **LLM tokens:** ~8,000-12,000 tokens per module (input + output)
- **BullMQ slot:** 1 slot in `events-medium` lane
- **Redis read:** Sage FI signal log (TTL 7 days)

**Weekly budget per cluster:**
- Small cluster (<10 members): 2 modules × ~10K tokens = ~20K tokens
- Medium cluster (10-24): 4 modules × ~10K tokens = ~40K tokens
- Large cluster (25+): 5 modules × ~10K tokens = ~50K tokens

**Total platform budget:** 1,000 active clusters × ~40K avg = **40M tokens/week**. This is within reasonable bounds for production LLM usage.

---

## 4. Analysis Pipeline

Every module run follows a 5-step pipeline:

### Step 1: Data Assembly

```
1. Query Supabase for cluster context
   - cluster_id, name, description, purpose, arc_phase
   - member_count, post_count, creation_date
   - AGGIL config (age_min/max, gender_filter, geography, interests, languages)

2. Read Sage Feature Intelligence signal log (Redis)
   - Last 7 days of Sage decisions, content types, engagement scores
   - Last 30 days for Behavioural and Growth modules

3. Read Observer findings (scoped)
   - Only findings for this cluster_id
   - Only last 14 days
   - Exclude welfare findings (those route separately)

4. Aggregate and anonymize
   - Remove all `auth_users.id` references
   - Replace member names with "Member A", "Member B" or pattern language
   - Strip all DM content, private tab content, FAB content
   - Aggregate behavioural signals (e.g., "3 members" not "Alice, Bob, Charlie")
```

**Data quality score:** Each assembled dataset is scored 0.0-1.0 based on recency, completeness, and coverage. This feeds into confidence calculation.

### Step 2: LLM Inference & Analysis

**CIM is inference-driven, not statistics-driven.** The LLM does not count frequencies — it reads the data corpus through the lens of the cluster's demography, purpose, and cultural context, then infers meaning. This is the critical distinction: a Behavioural module doesn't just report "reply rate = 0.34"; it infers "a core group has formed while others lurk, suggesting an exclusivity dynamic that may need gentle disruption."

```
System prompt (Layer 1 + Layer 2 + CIM character)
  └── Platform super-prompt (Soul, safety, JSON contract)
  └── CIM analyst character (neutral, pattern-focused, non-judgemental,
      culturally aware, demography-sensitive)
  └── Platform conformity constraints
      ├── Soul principle: never treat a human being as a means to a metric
      ├── Platform Rules: AGGIL privacy hierarchy, nickname identity, no GPS leakage
      ├── Clio persona alignment: CIM output must never contradict Clio's voice,
      │   values, or the Single Clio Principle. CIM is a background intelligence layer;
      │   it does not speak to members, but its inferences shape what Clio and Sage do.
      ├── Agent hierarchy respect: CIM does not override Clio, Sage, or Observer.
      │   It informs. All recommendations route through admin approval.
      └── Engagement is never the goal: CIM must not optimize for engagement,
          retention, or "activation." It optimizes for cluster health, member dignity,
          and meaningful connection.

Context (Layer 3 + Layer 4)
  └── Cluster identity (name, description, AGGIL, arc_phase)
  └── Cluster demography & persona lens
      ├── Age range → life-stage vocabulary and concern framing
      ├── Gender composition → interaction-style expectations
      ├── Geography → cultural context, timezone dynamics
      ├── Interests → domain expertise level, reference expectations
      └── Languages → code-switching patterns, formality registers
  └── Cluster purpose & founding intent (anchor_seed, why this cluster exists)
  └── Premium cluster context (if applicable)
      ├── Admin guidance (free_text_guidance, parsed_directives)
      ├── Vault entries (verified references Sage has surfaced)
      ├── Workshop state (active features, member proposals)
      └── Agent Involvement Slider setting
  └── Module-specific context (e.g., Behavioural gets interaction graph)
  └── Anonymized data corpus

Module prompt
  └── Module-specific analytical framework
  └── Demography-calibrated perspective (see §6 Introspection Model)
  └── Questions to answer
  └── Output schema instructions
```

**Prompt architecture per module (with inference + demography lens):**

- **Behavioural:** "You are a community interaction analyst. The cluster is [demography: 36-50, mixed gender, Bangalore, Deeper Conversations, English]. Read the following reply-network data and engagement patterns. Infer the *social dynamics* — not just the graph. What does the shape of this network reveal about belonging, exclusion, or emerging leadership? Consider life-stage: are members at family-building age seeking peer support, or career-peak age seeking intellectual exchange?"

- **Functional:** "You are a product analyst. The cluster's purpose is [purpose]. Its members are [demography]. Given the tool usage and workaround patterns, infer the *unspoken needs* — what do members want to do but cannot because no tool serves their mental model? Consider cultural context: do members expect async or real-time tools? Individual or collective features?"

- **Vibe:** "You are an emotional tone analyst. The cluster is [demography] with founding intent [purpose]. Read the emotional indicators. Infer the *underlying emotional narrative* — is warmth declining because trust is breaking, or because familiarity has made expression implicit? Consider gender composition: does tone differ by interaction type? Consider language: is formality a mask for distance, or respect?"

- **Purpose:** "You are a mission alignment analyst. The cluster was founded for [purpose], serving [demography]. Given content themes and member-stated goals, infer the *nature of the drift* — if content has shifted, is this healthy evolution or abandonment of the original contract? Consider age: are newer members younger and bringing different priorities?"

- **Growth:** "You are a sustainability analyst. The cluster serves [demography] in [geography] around [interests]. Given acquisition and retention patterns, infer the *capacity tension* — is the cluster too small to sustain energy, or too large to maintain intimacy? Consider geographic concentration: is Bangalore-specific content helping or limiting growth?"

### Step 3: Structured Extraction

Raw LLM output (narrative analysis) is parsed into structured fields:

```typescript
interface IntelligenceReport {
  module_type: 'behavioural' | 'functional' | 'vibe' | 'purpose' | 'growth';
  trigger_type: 'weekly' | 'bootstrap' | 'on_demand';
  cluster_id: string;
  
  findings: Array<{
    finding_type: 'pattern' | 'anomaly' | 'opportunity' | 'risk';
    description: string;
    evidence_summary: string; // pattern-level evidence, no member names
    confidence: number; // 0.0 - 1.0
    severity?: 'info' | 'warning' | 'critical';
  }>;
  
  recommendations: Array<{
    category: 'feature_create' | 'feature_remove' | 'skill_toggle' | 
              'persona_adjust' | 'description_update' | 'goal_update' | 
              'tool_create' | 'protocol_update' | 'other';
    description: string;
    risk_level: 'low' | 'medium' | 'high';
    auto_approved: boolean; // computed by risk + confidence
    implementation_scope: 'cluster_specific' | 'platform_wide' | 'admin_action_only';
    status: 'pending' | 'approved' | 'rejected' | 'deferred';
  }>;
  
  stakeholder_questions: Array<{
    question: string;
    who_should_answer: 'cluster_admin' | 'platform_admin' | 'cluster_members' | 'sage';
    urgency: 'immediate' | 'this_week' | 'when_convenient';
  }>;
  
  confidence_overall: number; // 0.0 - 1.0
  data_quality_score: number; // 0.0 - 1.0
  llm_raw_analysis: string; // Full narrative for admin review
  
  created_at: string;
  reviewed_at?: string;
  reviewed_by?: string; // admin_id
}
```

**Extraction validation:**
- Regex validator on all enum fields
- Confidence bounds check (0.0-1.0)
- One retry if validation fails
- Degraded fallback: store raw analysis + flag for manual review

### Step 4: Cross-Agent Review (Optional)

For findings with `confidence >= 0.75`:

```
Sage ↔ Clio chatbox exchange:
  Sage: "I've identified a pattern: [summary]. Recommend: [action]."
  Clio: "I see that too from the FAB signals. But consider: [pushback]."
  Sage: "Fair. Adjusted recommendation: [refined]."
  
Outcome: PROCEED | MONITOR | DEFER
```

**Why cross-agent review?**
- Single-agent analysis can miss context available to another agent
- Clio has FAB-level signal awareness that CIM data assembly may not capture
- Sage has content-layer signal awareness from FI log
- The exchange produces a more robust recommendation

**Time budget:** 60 seconds. If exchange doesn't complete, default to `MONITOR`.

### Step 5: Persistence & Routing

```
1. Write report to `cluster_intelligence_reports`
2. Write findings to `intelligence_findings` (1:N)
3. Write recommendations to `intelligence_recommendations` (1:N)
4. Write questions to `intelligence_questions` (1:N)
5. Route recommendations:
   - Low risk + confidence >= 0.80 → auto-approve → queue implementation job
   - Medium risk → admin dashboard review queue
   - High risk → admin + platform_admin review queue
6. Send notification to admin (if admin has enabled CIM notifications)
```

---

## 5. Output Format

### 5.1 Findings

Findings are the analytical core. Each finding has a type, description, evidence summary, and confidence.

**Example findings by module:**

**Behavioural:**
```
Type: pattern
Description: "A core group of 5-7 members forms the reply backbone. 
             3 members are consistently orphaned (posts receive no replies)."
Evidence: "Reply-network graph: node degrees show high centrality for 5 members. 
          3 members have zero inbound edges over 14 days."
Confidence: 0.92
Severity: warning
```

**Functional:**
```
Type: opportunity
Description: "Members frequently ask about event coordination, but no calendar 
             or event-planning tool exists in the cluster."
Evidence: "15 posts in 30 days contain event-related keywords. 
          No `event_*` skill has been invoked by Sage."
Confidence: 0.87
Severity: info
```

**Vibe:**
```
Type: anomaly
Description: "Tone shifted from warm/supportive to transactional/informational 
             over the past 10 days."
Evidence: "Sentiment analysis: positive ratio dropped from 0.72 to 0.41. 
          Gratitude expression frequency halved."
Confidence: 0.78
Severity: warning
```

**Purpose:**
```
Type: pattern
Description: "Cluster has organically shifted from 'Quran study' to 
             'general Islamic lifestyle discussion.'"
Evidence: "Topic modelling: religious-practice posts down 40%, 
          cultural/lifestyle posts up 55%."
Confidence: 0.85
Severity: info
```

**Growth:**
```
Type: risk
Description: "Retention drops sharply after 14 days. 60% of members who join 
             become inactive by day 21."
Evidence: "Cohort analysis: 28-day retention = 0.40. 
          Day-7 to Day-14 drop = 45%."
Confidence: 0.91
Severity: warning
```

### 5.2 Recommendations

Recommendations are actionable. Each has a category, risk level, and auto-approval status.

**Risk classification:**

| Risk Level | Categories | Auto-Approve Threshold | Requires |
|------------|-----------|------------------------|----------|
| **Low** | `skill_toggle`, `persona_adjust`, `description_update`, `goal_update` | Confidence >= 0.80 | Admin notification only |
| **Medium** | `feature_create`, `feature_remove`, `tool_create` | Never | Admin approval |
| **High** | `protocol_update` (welfare, character, privacy) | Never | Admin + platform_admin |

**Auto-approve flow:**
```
IF risk_level == 'low' AND confidence >= 0.80:
  auto_approved = TRUE
  status = 'approved'
  Queue implementation job
  Notify admin: "Recommendation auto-approved: [description]"
ELSE:
  auto_approved = FALSE
  status = 'pending'
  Surface in admin dashboard review queue
```

### 5.3 Recommendation Testing Workflow

Every approved recommendation enters a testing phase before being marked as successful. This creates a feedback loop that improves CIM accuracy over time.

```
Admin approves recommendation
    ↓
System queues implementation job
    ↓
Implementation executes (background, subtle)
    ↓
Testing phase begins (default: 14 days)
    ↓
CIM monitors relevant metrics during testing phase
    ↓
Admin receives testing summary: "Before / After" comparison
    ↓
Admin marks outcome: SUCCESS / PARTIAL / NO_EFFECT / NEGATIVE
    ↓
Outcome feeds back into CIM: similar recommendations adjust confidence
```

**Example testing summary:**
```
Recommendation: Enable 'depth_prompt' skill for Sage
Testing period: 14 days
Before: Average thread depth = 2.1, disagreement markers = 3%
After:  Average thread depth = 2.4, disagreement markers = 5%
Assessment: Slight improvement in depth, healthy increase in respectful disagreement.
Outcome: SUCCESS
```

**Status tracking:**
| Status | Meaning |
|--------|---------|
| `approved` | Admin approved, awaiting implementation |
| `testing` | Implementation active, monitoring period running |
| `success` | Admin marked positive outcome |
| `partial` | Admin marked some positive effect |
| `no_effect` | No measurable change |
| `negative` | Unintended negative consequence |
| `implemented` | Legacy status for pre-testing-phase recommendations |

**Note:** Testing workflow is Phase 1 basic. In later stages, CIM may auto-assess outcomes based on metric change without admin input.

### 5.4 Stakeholder Questions

Questions the module cannot answer with data alone. These route to the appropriate stakeholder.

```
Question: "Should the cluster lean into its organic shift toward lifestyle content, 
          or gently guide back toward Quran study?"
Who: cluster_admin
Urgency: this_week
```

---

## 6. LLM Inference & Perspective Layer

### 6.1 Core Principle: Inference Over Aggregation

CIM's value is **inference** — the LLM reasoning about what data *means* in the cluster's specific context. Two clusters with identical reply-rate statistics may need entirely different interpretations:

- Cluster A (13-17, campus explorers): Low reply rate → "Members are observing before engaging — normal for this age group, suggest ice-breakers."
- Cluster B (36-50, professionals): Low reply rate → "Members are time-constrained; consider async-friendly formats and weekend prompts."

The same data point produces different inferences because **demography shapes meaning**.

### 6.2 LLM Perspective Switching

**The admin can change the LLM for any module run.** Different LLMs produce different inferences:

| LLM | Typical Perspective | Best For |
|-----|---------------------|----------|
| **Claude** (Anthropic) | Nuanced, culturally sensitive, cautious | Vibe, Purpose — emotional and mission alignment |
| **Kimi** (Moonshot) | Direct, pattern-forward, concise | Behavioural, Functional — structural and gap analysis |
| **Groq** (Llama/Mistral) | Fast, high-volume, good for bootstrap | Growth, bootstrap runs — statistical inference |
| **Gemini** (Google) | Multi-modal aware, trend-sensitive | Purpose, Growth — content drift and market sensing |

**On-demand workflow:**
```
Admin selects module → selects LLM → runs → sees inference
Admin switches LLM → re-runs same module → compares inferences
Admin selects canonical → all other inferences archived with metadata
```

**Every inference is permanently saved with:**
- `llm_provider` (anthropic, moonshot, groq, google)
- `llm_model` (claude-sonnet-4-20250514, kimi-k2, etc.)
- `inference_timestamp`
- `tokens_input`, `tokens_output`
- `cost_usd`
- `inference_hash` (SHA-256 of the raw analysis text)
- `perspective_label` (auto-tagged: "cautious", "direct", "nuanced", etc.)

### 6.3 Generic vs. Premium Cluster Inference

| Aspect | Generic Cluster | Premium Cluster |
|--------|----------------|-----------------|
| **Admin context** | None — cluster is agent-managed | Admin guidance, vault entries, Workshop state included |
| **Authority framing** | "What should the platform do?" | "What should the Admin consider?" |
| **Feature proposals** | Route to platform team | Route to cluster Admin for approval |
| **Persona sensitivity** | Standard AGGIL lens | Admin's `free_text_guidance` + vault persona + slider setting |
| **Welfare routing** | Not included in CIM | Included as context (notifications to Admin/Managers) |

---

## 7. Introspection Model

### 7.1 What Is CIM Introspection?

After generating a module's inference, CIM runs a **second-pass introspection layer** that asks: *"Is this inference valid? What perspectives did I miss? How would a different demography or cultural lens re-read this data?"*

Introspection improves inference quality by:
1. **Challenging first conclusions** — the LLM critiques its own output
2. **Generating alternative perspectives** — what would a different persona see?
3. **Calibrating confidence** — adjusting confidence based on how robust the inference is across lenses
4. **Surfacing blind spots** — identifying what the first pass missed

### 7.2 Introspection Prompt Structure

```
Phase 1 — Primary Inference (Step 2 from pipeline)
  └── Module-specific analysis with cluster demography lens
  └── Produces: findings[], recommendations[], questions[]

Phase 2 — Introspection
  └── "Review your own analysis. Challenge specific cognitive biases:"
      ├── **Confirmation bias:** Did I only see evidence that supports my conclusion? What evidence did I ignore or downplay?
      ├── **Fundamental attribution error:** Am I attributing behavior to member personality rather than situational context (e.g., exam season, Ramadan, local events)?
      ├── **Availability heuristic:** Am I overweighting recent dramatic events because they are memorable, not because they are representative?
      ├── **Demographic sceptic:** What would a member of this cluster's exact demography say about my conclusion?
      ├── **Cultural sceptic:** Did I assume any cultural context that may not apply to [geography/language]?
      ├── **Purpose sceptic:** If the cluster's purpose were [slightly different], would my conclusion change?
      ├── **Contrarian evidence:** What did I NOT see in the data that might contradict my inference?
  └── Produces: introspection_notes[], revised_findings[], confidence_adjustment

Phase 3 — Perspective Synthesis
  └── Merge primary + introspection into final output
  └── Confidence recalibrated: if introspection found significant blind spots, confidence reduced
  └── If introspection confirmed robustness, confidence maintained or increased
```

### 7.3 Perspective Dimensions

Introspection specifically tests across these dimensions:

| Dimension | What It Checks |
|-----------|---------------|
| **Life-stage lens** | Would a 20-year-old and a 45-year-old interpret this pattern differently? |
| **Gender lens** | Does the inference hold across gender compositions? |
| **Cultural lens** | Is the inference biased by the LLM's training culture vs. the cluster's geography? |
| **Language lens** | Are formality, warmth, or directness being misread across languages? |
| **Purpose lens** | Would the inference change if the cluster's stated purpose were different? |
| **Authority lens** (premium only) | Does the Admin's guidance contradict or contextualize the inference? |

### 7.4 Introspection Output

Introspection results are stored alongside the primary report:

```typescript
interface CIMIntrospection {
  report_id: string;
  
  // What the LLM critiqued about its own inference
  self_critique: string;
  
  // Alternative perspectives considered
  alternative_perspectives: Array<{
    lens: 'life_stage' | 'gender' | 'cultural' | 'language' | 'purpose' | 'authority';
    perspective: string; // "From a [lens] perspective, this could also mean..."
    impact_on_confidence: 'increased' | 'decreased' | 'unchanged';
  }>;
  
  // Blind spots identified
  blind_spots: string[]; // "I may have missed...", "The data does not show..."
  
  // Final confidence adjustment
  confidence_adjustment: number; // -0.30 to +0.10 applied to primary confidence
  
  // Whether introspection changed any finding
  findings_revised: boolean;
  revised_finding_ids?: string[];
  
  created_at: string;
}
```

**Introspection is always stored** — even when it confirms the primary inference unchanged. This creates an audit trail of reasoning quality.

### 7.5 Cost & Performance

Introspection adds **~30-40% token overhead** per module run:
- Primary inference: ~10K tokens
- Introspection pass: ~3-4K tokens
- Total: ~13-14K tokens per module

**Can be disabled by admin** for on-demand runs (toggle in dashboard: "Deep introspection" vs "Fast inference").

---

## 8. Confidence Scoring

### 8.1 Formula — Weighted Compositional Model

The old multiplicative model was fragile: a single weak factor (e.g., cross-agent disagreement) could collapse an otherwise robust inference. The compositional model weights each factor independently and sums them with a floor, preserving signal even when one factor is uncertain.

```
final_confidence = clamp(
  (base_confidence × 0.40) +
  (data_quality_score × 0.25) +
  (introspection_adjustment × 0.20) +
  (cross_agent_agreement × 0.15),
  min = 0.15, max = 0.98
)
```

| Factor | Source | Weight | Range |
|--------|--------|--------|-------|
| `base_confidence` | LLM self-assessment + prompt-validated | 0.40 | 0.0 - 1.0 |
| `data_quality_score` | Computed from data assembly step | 0.25 | 0.0 - 1.0 |
| `introspection_adjustment` | Introspection robustness or blind-spot penalty | 0.20 | -0.30 to +0.10, normalized to 0.0-1.0 |
| `cross_agent_agreement` | Sage ↔ Clio exchange outcome | 0.15 | 0.0, 0.5, 1.0 |

**Why compositional?** In expert judgment research, weighted averages outperform multiplicative models when factors are partially correlated (which these are). A finding with excellent data and strong inference but one dissenting agent should not be rated 0.36 — it should be "mostly confident with some disagreement."

**Floor (0.15):** No finding is ever 0.00. Uncertainty itself is information.
**Ceiling (0.98):** No finding is ever 1.00. Absolute certainty is epistemically dishonest.

### 8.2 Data Quality Score

| Condition | Score |
|-----------|-------|
| Bootstrap (inferred data) | 0.60 |
| Observed data, n < 5 interactions | 0.70 |
| Observed data, n >= 5 but < 14 days history | 0.90 |
| Observed data, n >= 20 and >= 14 days history | 1.00 |
| Missing key data source (e.g., FI log unavailable) | −0.20 |
| Introspection found blind spots | −0.10 to −0.20 |
| Introspection confirmed robustness | +0.00 |

### 8.3 Introspection Adjustment

| Outcome | Raw Adjustment | Normalized (0-1) |
|---------|---------------|------------------|
| Introspection confirmed robustness across all lenses | +0.00 | 1.00 |
| Introspection found minor blind spots | −0.05 to −0.10 | 0.85 |
| Introspection found significant blind spots | −0.15 to −0.25 | 0.70 |
| Introspection contradicted primary finding | Flag for cross-agent review | — |

### 8.4 Cross-Agent Agreement

| Outcome | Value |
|---------|-------|
| PROCEED | 1.00 |
| MONITOR | 0.50 |
| DEFER | 0.00 (finding suppressed, logged for review) |
| Exchange timeout/failure | 0.50 |

### 8.5 Admin Guardrails & Calibration

**Guardrails are admin-set, not hardcoded.** The platform ships with starting thresholds, but each admin can adjust:

| Threshold | Default | Admin Adjustable | Notes |
|-----------|---------|------------------|-------|
| Auto-approve confidence | 0.80 | Yes (0.70 - 0.90) | Admin may raise or lower based on risk tolerance |
| Cross-agent review trigger | 0.75 | Yes (0.70 - 0.85) | |
| Deep introspection token budget | 40% overhead | Yes (20% - 60%) | |
| Max LLM comparisons / month | 1 | Yes (0 - 3) | Cost guardrail |

**Calibration is manual and deferred.** Empirical calibration (tracking which confidence scores predicted actual outcomes) is a **Phase 2+ activity**. In Phase 1:
- Admins review auto-approved recommendations weekly and flag false positives
- Platform team reviews aggregate accuracy quarterly
- Thresholds are adjusted manually by platform admin, not automatically by algorithm

> **Note:** LLM self-assessed confidence is known to be poorly calibrated. The default thresholds are *starting hypotheses*, not proven bounds. Admins should expect to adjust them in the first 30-60 days.

---

## 9. Admin Dashboard Integration

### 9.1 Intelligence Tab

The admin dashboard has a dedicated "Intelligence" tab showing CIM output.

**Report list view:**
- Date, module type, confidence, overall risk (computed from max finding severity)
- Status: auto-approved / pending review / rejected / implemented
- Quick actions: View / Approve / Reject / Defer

**Report detail view (progressive disclosure):**
- **Layer 1 — Summary:** Executive summary (3-4 sentences), overall confidence, max risk, status. Admin can act from here without scrolling.
- **Layer 2 — Findings & Recommendations:** Expandable findings table; recommendations with action buttons:
  - Approve → queues implementation job
  - Reject → logs reason, suppresses future similar recommendations
  - Defer → reminds admin in 7 days
  - Edit → admin can modify recommendation before approving
- **Layer 3 — Questions & Context:** Stakeholder questions with answer fields
- **Layer 4 — Technical Detail (collapsed by default):** Raw LLM analysis, cross-agent exchange transcript, introspection self-critique, alternative perspectives, blind spots. This layer is for admins who want to interrogate the reasoning. Most admins never need to open it.

### 9.2 LLM Comparison

For on-demand runs, admin can run the same module with multiple LLMs and compare output.

**Cost guardrail:** Each cluster has a monthly LLM comparison quota (default: 1, admin-adjustable 0-3). Exceeding the quota requires platform admin override. This prevents runaway token costs at scale.

```
Admin selects: Behavioural module
Admin selects LLMs: Kimi, Claude, Groq
System checks: cluster comparison quota remaining → if 0, block with explanation
System runs 3 parallel jobs
Admin sees: Diff view of findings, recommendations, confidence scores
Admin selects: "This one is canonical" → canonical_report_id set
Other reports stored in `intelligence_llm_comparisons` for future A/B analysis
Quota decremented
```

**Cost projection displayed:** Before running, admin sees estimated token cost and platform budget impact: "This comparison will use ~39K tokens (~$0.08). Your cluster has 2 comparisons remaining this month."

---

## 10. Database Schema

### 10.1 Tables

```sql
-- One row per module run
CREATE TABLE cluster_intelligence_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cluster_id UUID NOT NULL REFERENCES clusters(id),
  module_type TEXT NOT NULL CHECK (module_type IN ('behavioural','functional','vibe','purpose','growth')),
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('weekly','bootstrap','on_demand')),
  confidence_overall DECIMAL(3,2) NOT NULL CHECK (confidence_overall >= 0 AND confidence_overall <= 1),
  data_quality_score DECIMAL(3,2) NOT NULL,
  llm_raw_analysis TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','implemented')),
  llm_provider TEXT,
  llm_model TEXT,
  tokens_used INTEGER,
  cost_usd DECIMAL(10,6),
  created_at TIMESTAMPTZ DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id),
  
  -- RLS: cluster admin can read reports for their cluster
  -- platform_admin can read all
);

-- 1:N with reports
CREATE TABLE intelligence_findings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES cluster_intelligence_reports(id) ON DELETE CASCADE,
  finding_type TEXT NOT NULL CHECK (finding_type IN ('pattern','anomaly','opportunity','risk')),
  description TEXT NOT NULL,
  evidence_summary TEXT NOT NULL,
  confidence DECIMAL(3,2) NOT NULL,
  severity TEXT CHECK (severity IN ('info','warning','critical')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 1:N with reports
CREATE TABLE intelligence_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES cluster_intelligence_reports(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN (
    'feature_create','feature_remove','skill_toggle','persona_adjust',
    'description_update','goal_update','tool_create','protocol_update','other'
  )),
  description TEXT NOT NULL,
  risk_level TEXT NOT NULL CHECK (risk_level IN ('low','medium','high')),
  auto_approved BOOLEAN DEFAULT FALSE,
  implementation_scope TEXT CHECK (implementation_scope IN ('cluster_specific','platform_wide','admin_action_only')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','deferred','testing','success','partial','no_effect','negative','implemented')),
  admin_decision_reason TEXT,
  implemented_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 1:N with reports
CREATE TABLE intelligence_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES cluster_intelligence_reports(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  who_should_answer TEXT NOT NULL CHECK (who_should_answer IN ('cluster_admin','platform_admin','cluster_members','sage')),
  urgency TEXT NOT NULL CHECK (urgency IN ('immediate','this_week','when_convenient')),
  answer TEXT,
  answered_by UUID REFERENCES auth.users(id),
  answered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Admin A/B testing for LLM comparison
CREATE TABLE intelligence_llm_comparisons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cluster_id UUID NOT NULL REFERENCES clusters(id),
  module_type TEXT NOT NULL,
  canonical_report_id UUID REFERENCES cluster_intelligence_reports(id),
  compared_llms JSONB NOT NULL, -- [{llm: 'kimi', report_id: uuid, confidence: 0.85}, ...]
  admin_selected_llm TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Introspection layer: self-critique and alternative perspectives
CREATE TABLE intelligence_introspection (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES cluster_intelligence_reports(id) ON DELETE CASCADE,
  self_critique TEXT NOT NULL,
  alternative_perspectives JSONB NOT NULL, -- [{lens: 'life_stage', perspective: '...', impact: 'decreased'}, ...]
  blind_spots TEXT[] NOT NULL DEFAULT '{}',
  confidence_adjustment DECIMAL(3,2) NOT NULL CHECK (confidence_adjustment >= -0.30 AND confidence_adjustment <= 0.10),
  findings_revised BOOLEAN DEFAULT FALSE,
  revised_finding_ids UUID[] DEFAULT '{}',
  introspection_llm_provider TEXT,
  introspection_llm_model TEXT,
  introspection_tokens_used INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 10.2 Indexes

```sql
CREATE INDEX idx_intelligence_reports_cluster_module 
  ON cluster_intelligence_reports(cluster_id, module_type, created_at DESC);

CREATE INDEX idx_intelligence_reports_status 
  ON cluster_intelligence_reports(status, created_at DESC);

CREATE INDEX idx_intelligence_findings_report 
  ON intelligence_findings(report_id);

CREATE INDEX idx_intelligence_recommendations_report 
  ON intelligence_recommendations(report_id);

CREATE INDEX idx_intelligence_recommendations_status 
  ON intelligence_recommendations(status, risk_level);

CREATE INDEX idx_intelligence_introspection_report 
  ON intelligence_introspection(report_id);
```

### 10.3 RLS Policies

```sql
-- cluster_intelligence_reports
CREATE POLICY "Cluster admin can read their cluster's reports"
  ON cluster_intelligence_reports FOR SELECT
  USING (cluster_id IN (
    SELECT cluster_id FROM cluster_members 
    WHERE user_id = auth.uid() AND (is_founder = TRUE OR is_manager = TRUE)
  ));

CREATE POLICY "Platform admin can read all reports"
  ON cluster_intelligence_reports FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE
  ));

-- Admin-only write
CREATE POLICY "Only system can create reports"
  ON cluster_intelligence_reports FOR INSERT
  WITH CHECK (FALSE); -- Only service_role

-- findings, recommendations, questions, introspection inherit report_id visibility
-- introspection rows follow the same visibility as their parent report
```

---

## 11. Agent Runtime Integration

### 11.1 BullMQ Job Types

| Job Type | Lane | Trigger | Concurrency | Description |
|----------|------|---------|-------------|-------------|
| `ClusterIntelligenceWeekly` | `events-medium` | Cron (staggered per cluster) | 5 per cluster | Runs selected modules based on cluster state |
| `ClusterIntelligenceBootstrap` | `events-medium` | `cluster_created` event + 24h delay | 1 | Runs all 5 modules in inference mode |
| `ClusterIntelligenceOnDemand` | `clio-high` | Admin dashboard action | 1 | Runs selected modules with specified LLM |
| `ClusterIntelligenceCrossAgentReview` | `events-medium` | Confidence >= 0.75 finding | 1 | Sage ↔ Clio chatbox exchange |
| `ClusterIntelligenceAutoImplement` | `scout-low` | Low-risk auto-approved recommendation | 1 | Queues implementation of approved change |

### 11.2 Idempotency Keys

```
ClusterIntelligenceWeekly:    cim_weekly_{cluster_id}_{module_type}_{YYYY-WW}
ClusterIntelligenceBootstrap: cim_bootstrap_{cluster_id}
ClusterIntelligenceOnDemand:  cim_ondemand_{cluster_id}_{module_type}_{admin_id}_{timestamp}
```

### 11.3 Failure Handling

| Failure | Behaviour |
|---------|-----------|
| LLM timeout | Retry once → mark report `status: 'error'` → admin notified |
| Data assembly failure | Degraded run with available data → flag `data_quality_score` → admin sees warning |
| Cross-agent exchange timeout | Default to `MONITOR` (0.50 multiplier) → proceed with lower confidence |
| Validation failure (structured extraction) | One retry → if still fails, store raw analysis + flag for manual review |
| BullMQ worker crash | Re-queue with backoff → after 3 retries → Observer Domain 5 finding |

---

## 12. Privacy & Security

### 12.1 Core Principles

1. **No individual identification.** All output uses pattern-level language. "Two members" not "Alice and Bob."
2. **No cross-cluster data.** Each module sees only its own cluster's data.
3. **No FAB content leakage.** Clio's private tab, DMs, and ephemeral content are never ingested. Only aggregated, anonymized signals.
4. **No persistent member profiles.** CIM output does not build or maintain profiles of individual members.
5. **Admin-private only.** Members cannot access, request, or be shown module output.
6. **Retention limit.** Reports older than 90 days are soft-deleted (archived to cold storage, admin dashboard shows summary only).

### 12.2 What CIM Cannot Access

- Direct message content
- Clio FAB chat history
- Member profile data beyond AGGIL attributes
- Welfare flag details (Observer handles these separately)
- Any content marked as private or ephemeral

### 12.3 Audit Trail

Every module run logs:
- Which data sources were queried
- Which LLM was used
- Token count and cost
- Admin actions (approve/reject/defer)
- Cross-agent exchange transcript (if applicable)

### 12.4 Re-identification Risk & K-Anonymity

**The risk:** AGGIL config (age + gender + geography + interests + language) is highly identifying in small clusters. Example: "30-35, female, Bangalore, Quran study, Urdu" with 8 members could narrow to 1-2 individuals.

**Guardrail:** CIM applies a **k-anonymity threshold** before running inference:

| Cluster Size | AGGIL Granularity in Prompt |
|--------------|----------------------------|
| < 8 members | **Do not run CIM.** Insufficient population for pattern-level analysis. |
| 8-14 members | Aggregate: broad age band (±10 years), gender composition as ratio not individual identity, geography as region not city. |
| 15-24 members | Standard AGGIL config, but interests and languages are grouped where they would identify individuals. |
| 25+ members | Full AGGIL config permitted. |

**Additional protections:**
- For clusters 8-14, CIM skips Behavioural and Growth modules (network and cohort analysis require larger populations).
- For all clusters, CIM never outputs demographic intersections that could identify individuals (e.g., "the only female member from Hyderabad" is prohibited).
- The LLM prompt explicitly instructs: "Never infer or disclose the identity of specific members from demographic composition."

---

## 13. Conflict Resolution with Existing Systems

### 13.1 Sage Feature Intelligence

**Relationship:** CIM consumes Sage FI signal log as a data source.

**Boundary:**
- FI log is read-only for CIM. CIM never writes to FI log.
- CIM recommendations may suggest `skill_toggle` or `persona_adjust` → these route to admin approval → admin action updates Sage config → next FI log cycle picks up the change.
- No circular dependency.

### 13.2 Observer

**Relationship:** CIM reads Observer findings as a data source.

**Boundary:**
- CIM only reads non-welfare findings for its cluster.
- CIM does not produce findings that overlap with Observer's 10 domains. If Observer has already flagged something, CIM references it rather than duplicating.
- CIM runs in `events-medium` lane; Observer runs every 6h. No queue contention.

### 13.3 Admin Dashboard

**Relationship:** CIM is a new tab in the admin dashboard.

**Boundary:**
- Intelligence tab is separate from existing admin tools (moderation, member management, settings).
- CIM recommendations that require platform changes (e.g., `feature_create`) route through the existing tool proposal system.
- CIM does not replace any existing admin workflow.

### 13.4 Clio

**Relationship:** CIM may trigger cross-agent review with Clio.

**Boundary:**
- Clio participates in cross-agent review only. CIM never sends findings directly to members via Clio.
- Clio's FAB layer remains unchanged. CIM output does not affect Clio's behaviour toward members.

---

## 14. Example: Long Conversation Cluster

**Cluster:** Long Conversation (LC)
**Members:** 34
**Arc Phase:** D (active)
**AGGIL:** 36-50, Any gender, Bangalore, Deeper conversations, English

### Weekly Report (Vibe + Functional + Behavioural + Purpose)

**Vibe Module:**
```
Finding (pattern): "Warm but shallow. Members greet and encourage 
                   but avoid disagreement or depth."
Evidence: "Average thread depth = 2.1 posts. Disagreement markers 
          present in only 3% of threads."
Confidence: 0.89
Severity: info

Recommendation: skill_toggle — enable 'depth_prompt' for Sage
Risk: low
Auto-approve: YES (confidence 0.89 >= 0.80)
```

**Functional Module:**
```
Finding (opportunity): "Members frequently reference books and articles 
                       but have no shared reading list."
Evidence: "12 posts in 14 days mention books. No 'vault' or 'reading_list' 
          tool exists."
Confidence: 0.84
Severity: info

Recommendation: feature_create — shared reading list
Risk: medium
Auto-approve: NO (medium risk always requires admin)
```

**Behavioural Module:**
```
Finding (pattern): "Two sub-groups emerging: morning-active (7-10am) 
                   and evening-active (7-10pm). Minimal overlap."
Evidence: "Reply network shows two dense components with only 4 
          cross-component edges. No private language or exclusion signals."
Confidence: 0.91
Severity: info
Note: Sub-community surface-to-admin. No split recommended — cross-group 
      edges exist and both groups reference the cluster purpose.

Recommendation: persona_adjust — Sage should post at midday to bridge groups
Risk: low
Auto-approve: YES

Finding (pattern): "3 members are satisfied observers — read regularly, 
                     never post, no churn signals."
Evidence: "Consistent read receipts, no drop-off over 30 days."
Confidence: 0.85
Severity: info
Note: Lurker typology — satisfied observers. No action required.
```

**Purpose Module:**
```
Finding (pattern): "Cluster remains aligned with 'deeper conversations' 
                   purpose. No significant drift."
Evidence: "Topic coherence score: 0.78 (stable). Purpose-aligned posts: 82%."
Confidence: 0.93
Severity: info

No recommendations.
```

**Admin Dashboard View:**
- 4 findings (1 lurker observation, 1 sub-community surface, 1 vibe, 1 purpose), 2 auto-approved, 1 pending review, 1 info-only
- Auto-approved actions: enable depth_prompt skill, adjust Sage cadence to midday
- Pending: shared reading list feature (admin must decide)
- Testing: depth_prompt skill in 14-day testing phase (day 3 of 14)
- Stakeholder question: "Would a book club thread format serve this cluster?"

---

## 15. Implementation Checklist

### Phase 1: Core Infrastructure

- [ ] Create `cluster_intelligence_reports`, `intelligence_findings`, `intelligence_recommendations`, `intelligence_questions`, `intelligence_llm_comparisons`, `intelligence_introspection` tables
- [ ] Add RLS policies
- [ ] Add indexes
- [ ] Create `ClusterIntelligenceWeekly` BullMQ worker
- [ ] Create `ClusterIntelligenceBootstrap` BullMQ worker
- [ ] Add module selection logic to weekly scheduler

### Phase 2: Module Implementation

- [ ] Implement Behavioural module prompt + data assembly
- [ ] Implement Functional module prompt + data assembly
- [ ] Implement Vibe module prompt + data assembly
- [ ] Implement Purpose module prompt + data assembly
- [ ] Implement Growth module prompt + data assembly
- [ ] Implement structured extraction validator
- [ ] Implement cross-agent review trigger
- [ ] Implement introspection layer (Phase 2 pass: self-critique + perspective synthesis)
- [ ] Implement demography-calibrated prompt injection (AGGIL lens per module)

### Phase 3: Admin Dashboard

- [ ] Add "Intelligence" tab to admin dashboard
- [ ] Report list view
- [ ] Report detail view with findings, recommendations, questions
- [ ] Approve / Reject / Defer / Edit actions
- [ ] LLM comparison UI (with provider/model/timestamp/cost per inference)
- [ ] Introspection detail view (self-critique, blind spots, alternative perspectives)
- [ ] "Deep introspection" vs "Fast inference" toggle
- [ ] Notification settings for CIM

### Phase 4: Integration

- [ ] Wire Sage FI signal log as data source
- [ ] Wire Observer findings as data source
- [ ] Implement auto-approve flow for low-risk recommendations
- [ ] Implement implementation job queue
- [ ] Add CIM to platform observability (token usage, cost, report volume, introspection overhead)
- [ ] Implement inference versioning (hash + LLM metadata for every run)

### Phase 5: Validation

- [ ] Run bootstrap on 5 test clusters
- [ ] Run weekly cycle on 10 active clusters
- [ ] Validate anonymization (no member names in output)
- [ ] Validate RLS (admins only see their cluster)
- [ ] Validate auto-approve accuracy (low false positive rate)
- [ ] Stress test: 1,000 clusters × 5 modules = performance validation

---

*This document is a canonical architecture specification. Implementation details (exact prompt wording, database migration scripts, API endpoint definitions) are the responsibility of the coding agent and must not contradict any invariant defined here.*
