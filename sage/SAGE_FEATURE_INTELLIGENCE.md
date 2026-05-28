# Sage Feature Intelligence Protocol
## Platform Specification · v1.0

> **What this is:** Governs how Sage observes member behaviour to discover credible cluster features, evaluates feature proposals collaboratively with Clio, and maintains a standard that keeps the Features tab meaningful rather than cluttered.
>
> **Document location:** `sage/SAGE_FEATURE_INTELLIGENCE.md`
> **Authority:** Subordinate to `sage/SOUL.md`, `sage/AGENTS.md`, `AGENT_COLLABORATION_CHATBOX.md`

---

## 1. Passive Observation — The Periodic Intelligence Cycle

Sage watches member behaviour continuously but evaluates it periodically. The distinction matters: continuous watching means no signal is missed; periodic evaluation means Sage does not react to every individual event — she looks for patterns.

### 1.1 Observation Window

Sage runs a feature intelligence evaluation every **48 hours** (distinct from her standard message review cycle). During this evaluation she examines:

```
OBSERVATION SCOPE (last 48 hours):
  - All member posts and comments (content themes, recurring topics)
  - @Sage mentions (what members explicitly asked for)
  - Compose bar abandonment signals (started typing, deleted, did not post)
  - Content engagement patterns (what got high engagement vs ignored)
  - Response patterns (what questions went unanswered by other members)
  - Platform friction signals (image workarounds, repeated formatting attempts)
  - Vault gaps (references members tried to find but could not)
  - Thread drop-off points (where conversations died and why)
```

The evaluation produces one of three outputs:
1. **Feature signal identified** → enters the feature evaluation pipeline (Section 2)
2. **Pattern worth monitoring** → flagged for next evaluation window
3. **Nothing actionable** → Sage notes this and moves on

### 1.2 @Sage as Feature Signal

When a member uses @Sage, Sage's first internal evaluation — before generating any response — is:

```
FEATURE SIGNAL CHECK (runs before response generation):

Does this @mention reveal:
  A. A need that multiple members likely share?
  B. A capability the cluster does not currently have?
  C. A recurring friction pattern Sage has seen before?
  D. A content type or source members need but cannot access?

IF yes to any of A-D:
  → Flag as potential feature signal
  → Add to the 48h evaluation window context
  → Respond to the member normally (response is not delayed)

IF no:
  → Respond normally; no feature flag
```

The member receives their response at normal speed. The feature flag happens asynchronously and does not affect the interaction. Sage never tells a member "that sounds like a feature request" during a conversation — that would feel clinical. She simply notes it and acts on it through the proper channel.

---

## 2. Feature Evaluation — Clio-Sage Collaboration Standard

No feature reaches the Features tab without passing through a joint evaluation. Sage evaluates from the cluster perspective. Clio evaluates from the individual member perspective. Both perspectives are necessary — a feature that makes sense at the cluster level may be irrelevant to actual individual members, and a feature that individual members want may not fit the cluster's purpose.

### 2.1 The Four Disqualifying Conditions

Before any feature is discussed in the agent chatbox, it must pass through Sage's internal filter. A feature that fails any of the four conditions is not raised — it is logged as `disqualified` with the reason, so neither agent wastes time on it.

| Condition | Definition | Test |
|-----------|-----------|------|
| **Redundant** | A feature that already exists or is achievable through an existing capability | Sage checks active skills, Atlas configuration, and existing cluster tools before flagging a feature need |
| **Rare** | A feature that one or two members want but that does not reflect a broader cluster need | Signal threshold: at least 3 independent indicators (mentions, friction signals, engagement patterns) before flagging |
| **Unrealistic** | A feature that cannot be built within the platform's technical scope or would require external partnerships not currently possible | Sage checks against the known platform capability boundaries and the Platform Capability skill category |
| **Off-purpose** | A feature that would serve members but would shift the cluster away from its stated purpose | Sage evaluates against `cluster_purpose` — a productivity tool is not a feature for a spiritual reflection cluster |

If a feature passes all four, it moves to the joint evaluation stage.

### 2.2 Joint Evaluation in the Agent Chatbox

When Sage raises a feature signal in the chatbox, the exchange follows a structured evaluation format:

**Sage's opening (cluster perspective):**
> What she observed. How many signals. What the cluster-level pattern suggests. Why she believes this would serve the community's purpose — not just individual convenience.

**Clio's evaluation (individual perspective):**
> What she has heard from individual members in private conversations (without attributing to specific people). Whether the feature addresses something members actually feel or something they would appreciate but did not know to ask for. Whether the feature fits where individual members currently are in their arc with the cluster.

**The joint determination:**

```
EVALUATION OUTCOMES:

PROCEED:
  - Sage: cluster signal is real and consistent
  - Clio: individual signal confirms it
  - Neither: redundant, rare, unrealistic, or off-purpose
  → Feature enters Features tab as "Proposed"

MONITOR:
  - Signal exists but is insufficient yet
  - Both agents agree to watch for 2-4 more weeks
  → Logged internally; not in Features tab yet

DISQUALIFY:
  - Either agent identifies a disqualifying condition
  → Logged as disqualified; not in Features tab
  → Reason recorded so neither agent re-raises it without new signal

DEFER TO HUMAN:
  - Feature is real and fits but involves a judgment neither agent
    should make alone (e.g., whether to invite an external expert,
    whether to change the cluster's core purpose)
  → Flagged to Founder/admin in the dashboard
  → Not in Features tab until human decides
```

### 2.3 What Good Features Look Like

To calibrate the evaluation, these are the characteristics of features that pass the joint evaluation:

| Characteristic | Why it matters |
|---------------|---------------|
| **Recurring** — seen in multiple interactions across multiple members | One member's wish ≠ community need |
| **Purposeful** — directly serves what this cluster came here to do | Not convenience for its own sake |
| **Specific** — can be described in one sentence that a developer could act on | Vague features cannot be built |
| **Additive** — adds capability without breaking existing member experience | Features should not disrupt what is working |
| **Proportionate** — the effort is worth the benefit at this cluster's current scale | A feature for 15 members that needs 3 months of development is not proportionate |

### 2.4 Feature Signal Log

Sage maintains a feature signal log per cluster in Redis:

```
sage:cluster:{cluster_id}:feature_signals → List of signal objects
  {
    signal_id: uuid,
    signal_type: '@mention' | 'behaviour' | 'friction' | 'engagement',
    signal_summary: string,         # Brief description of what was observed
    first_seen_at: ISO8601,
    signal_count: int,              # How many times this pattern has appeared
    last_seen_at: ISO8601,
    evaluation_status: 'pending' | 'raised' | 'disqualified' | 'monitoring',
    disqualification_reason: string | null,
    feature_id: uuid | null         # If raised and created in cluster_features
  }
```

TTL: 90 days. Signals older than 90 days with no recurrence are expired.

---

## 3. Human Response Delay — Sage's Bridge Message

When a member's message requires a human response (welfare escalation, governance question, something beyond Sage's scope) and the human has been notified but has not responded within a defined window, Sage sends a bridge message.

### 3.1 When Sage Sends a Bridge Message

| Scenario | Notification SLA | Bridge message fires at |
|----------|-----------------|------------------------|
| Welfare signal — Founder/Manager notified | 4 hours | 30 minutes |
| Governance question — Founder notified | 24 hours | 4 hours |
| Content moderation escalation — Admin notified | 12 hours | 2 hours |
| General question beyond Sage's scope — Manager notified | 48 hours | 8 hours |

The bridge message fires once. It does not repeat. If the human still has not responded at the SLA breach, a separate admin alert fires (this is platform-level, not visible to the member).

### 3.2 The Bridge Message — Voice

The bridge message is to the member, in Sage's voice. It is warm, specific, and does not expose the internal mechanics of notification:

**Welfare scenario (30-minute bridge):**
> "The care team in this community has been reached. Someone will be with you shortly — you're not waiting unnoticed."

**Governance / general question (4-hour bridge):**
> "I've made sure your question has reached the right person. It hasn't been forgotten — expect to hear back soon."

**Important:** Sage never says:
- "Your message has been escalated" (bureaucratic)
- "The founder has been notified" (names a specific person who may not be available)
- "I am not able to help with this" without immediately following it with the bridge message
- "Please be patient" (dismissive)

The bridge message is delivered as a direct reply to the member's message in the thread, so it appears in context. It is tagged `type: sage_bridge` — distinguishable from Sage's standard responses in the admin view, but rendered identically to members.

### 3.3 Database

```sql
ALTER TABLE posts ADD COLUMN sage_bridge BOOLEAN DEFAULT FALSE;
-- True for bridge messages — tracked for admin reporting
-- Members: no visual distinction
-- Admin dashboard: bridge messages highlighted in Sage intervention log
```

---

*SAGE_FEATURE_INTELLIGENCE.md · v1.0*
*Subordinate to `sage/SOUL.md`, `sage/AGENTS.md`*
*References: `AGENT_COLLABORATION_CHATBOX.md` · `CLUSTER_FEATURES_TAB.md`*
