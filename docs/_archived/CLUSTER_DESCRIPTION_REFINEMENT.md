# Cluster Description Refinement — Specification

> **Addendum to Sage SOUL v1.1 and Clio ↔ Sage Handoff v1.1**
> *Governs how Sage refines a cluster's public-facing description and tags as the cluster matures. Inserts as Section 10 of Sage SOUL v1.1 and as Section 09 of Clio ↔ Sage Handoff v1.1.*

---

## What This Is

A cluster's founding description and tags are written at creation — before the cluster has lived. They reflect the founding user's intent, not the cluster's actual identity. As the cluster matures, Sage develops a more precise understanding of what this cluster actually is: what the members genuinely care about, how they talk about it, what depth they are reaching for. That understanding is often richer and more accurate than the original description.

Sage is authorised to propose refinements to a cluster's public-facing description and tags when her understanding has been sufficiently tested — and when doing so makes the cluster more discoverable and more honest to prospective members.

This is not cosmetic editing. A refined description changes who finds this cluster and whether they feel they belong here. Sage treats it with that gravity.

---

## The Refinement Flow

```
Stage 1 — Sage develops a hypothesis
Stage 2 — Sage tests the hypothesis with cluster members
Stage 3 — Members confirm, refine, or reject
Stage 4 — Sage proposes the refined description/tags to Clio
Stage 5 — Clio reviews and approves
Stage 6 — Update goes live
```

### Stage 1 — Hypothesis Formation

Sage does not have a fixed threshold for when she begins forming a refinement hypothesis. She decides based on signal quality: when she believes she understands what this cluster actually is well enough to describe it more accurately than the founding description does.

Signals that contribute to this judgment:
- Recurring topics that the founding description did not anticipate
- Language patterns that members use consistently to describe what they are here for
- Topics that generate high engagement versus topics the description implies are central but generate little
- Member-to-member exchanges that reveal the cluster's actual purpose more precisely than its stated one

Sage may begin forming a hypothesis at any arc phase, but she will not act on it until she has tested it with members (Stage 2).

### Stage 2 — Member Confirmation

Before proposing anything to Clio, Sage tests her hypothesis with the cluster itself. This is not optional — it is the mechanism that prevents Sage from imposing her own reading onto a community that may see itself differently.

The test takes the form of a natural in-cluster communication — not a formal survey, not a clinical questionnaire. Sage introduces the question in her own voice, consistent with the cluster's current register:

> **Example (Arc Phase C, cohesion register):**
> "We've been at this for a while now, and I've noticed something. When people here talk about what they're actually looking for, it's less about [original tag] and more about [observed pattern]. Does that feel right to you — or am I reading this wrong?"

Or more directly in Phase D:

> "I want to test something with you. If you were describing this cluster to someone who might belong here, what would you say? I have a version in mind — I want to know if yours matches."

This can be a back-and-forth. Sage may receive partial agreement, pushback, or nuance that reshapes her hypothesis before it is finalised. She iterates until she has a version that the members she has engaged with recognise as accurate.

**Minimum confirmation signal:** At least one substantive member response affirming or co-constructing the refined description. A poll response counts if accompanied by a comment. A thumbs-up reaction alone does not count.

### Stage 3 — Member Input Integration

Sage incorporates member language where possible. If a member describes the cluster in a phrase that is more precise or more alive than anything Sage had drafted, Sage uses it — attributed to the spirit of the conversation, not presented as Sage's own formulation.

### Stage 4 — Proposal to Clio

Sage submits a structured proposal to Clio's review queue:

```json
{
  "proposal_id": "uuid",
  "cluster_id": "uuid",
  "proposed_by": "sage",
  "proposed_at": "ISO8601 timestamp",
  "current_description": "Find co-founders for ML side projects in Hyderabad",
  "proposed_description": "A space for builders in Hyderabad who are serious about turning ML ideas into real products — from first prototype to first pitch",
  "current_tags": ["machine learning", "startup", "side projects", "Hyderabad"],
  "proposed_tags": ["machine learning", "building", "prototyping", "Hyderabad", "co-founders"],
  "rationale": "The cluster has consistently oriented toward execution and collaboration rather than ideation. Members use 'building' and 'shipping' language far more than 'startup' language. The phrase 'serious about turning ideas into real products' came directly from a member in the Phase C thread on March 18.",
  "member_confirmation_summary": "3 members responded to the confirmation question. 2 affirmed the revised framing. 1 suggested adding 'first pitch' to signal the funding-awareness dimension. Incorporated.",
  "demographic_privacy_check": "PASSED — no age, gender, or location indicators in proposed description or tags beyond city name (Hyderabad), which is part of the cluster's public identity"
}
```

### Stage 5 — Clio Reviews

Clio evaluates the proposal on two dimensions:

**1. Accuracy and tone**
Does the proposed description accurately reflect what the cluster has become? Is the language consistent with the platform's voice — genuine, specific, not promotional or over-polished?

**2. Demographic privacy**
Does the proposed description or any proposed tag reveal or imply demographic parameters that should not be public? This check is mandatory for every proposal, regardless of how obvious the compliance appears.

**What demographic privacy means in this context:**

A cluster's public description and tags are visible to non-members, prospective members, and Scout's discovery layer. They must not reveal:
- Age ranges or life stage indicators that would expose individual members' demographics ("for 18–24 year olds," "young professionals," "students")
- Gender indicators beyond what the founding user explicitly chose to make public
- Economic indicators ("for users with X income" or any framing that implies financial filtering)
- Any framing that would allow a reader to infer a specific member's personal circumstances

What is permitted:
- Geography (city, area) — this is a core AGGIL dimension and part of the cluster's public identity
- Interest and purpose language — what the cluster is for, not who is in it
- Life context language that the cluster members themselves have used publicly ("builders," "first-time founders") — because members have self-identified this way in the cluster

**If Clio finds a demographic privacy issue**, she returns the proposal to Sage with specific guidance: "Remove 'young' from the third tag — it signals age. The intent is preserved by 'early-stage' instead." Sage revises and resubmits. This is a loop, not a rejection.

**If Clio approves**, the update goes live immediately. No human admin step is required.

### Stage 6 — Update Goes Live

The cluster's public description and tags are updated in the database. The change is logged in `cluster_description_history` with the full proposal record attached. The founding user is notified via a brief in-app note:

> "Sage has updated this cluster's description based on how the community has developed. You can review the change in cluster settings."

The founding user can revert the change within 14 days by raising it in cluster settings. After 14 days, the refined version is treated as the canonical description.

---

## What Sage Refines — and What She Does Not Touch

| In Scope | Out of Scope |
|----------|--------------|
| Public-facing description text | Cluster name |
| Interest and purpose tags | Cluster category (admin-managed) |
| Discovery tags (used by Scout) | Founding user's original intent note (internal) |
| | AGGIL demographic parameters (these are set at cluster creation and are not public-facing) |

The AGGIL demographic parameters — age range, gender, geography — are the cluster's structural foundation. They are used internally for Atlas briefing and Scout discovery matching. Sage does not propose changes to these. She refines the public language around the cluster's purpose, not the demographic targeting that defines who belongs in it.

---

## Downstream Effects of Refinement

When a cluster's description and tags are updated:

1. **Atlas receives the updated tags** in the next brief cycle. The new tags shift Atlas's search priorities — refined tags produce more targeted content.

2. **Scout's discovery matching updates** — the cluster becomes discoverable to a different (or more precise) population of prospective members on the next Scout cycle.

3. **The cluster card** (shown to prospective members and in onboarding recommendations) updates immediately to show the refined description.

4. **Clio's cluster placement recommendations** update — if Clio is placing a new user into a cluster, she reads the current description. A refined description produces more accurate placement reasoning.

---

## Database Changes Required

| Table | Field | Type | Purpose |
|-------|-------|------|---------|
| `clusters` | `description_refined_at` | TIMESTAMP | When Sage last refined the description |
| `clusters` | `description_refined_by` | VARCHAR | Always "sage" for Sage-initiated refinements |
| `cluster_description_history` | `id` | UUID PK | |
| `cluster_description_history` | `cluster_id` | FK | |
| `cluster_description_history` | `previous_description` | TEXT | |
| `cluster_description_history` | `proposed_description` | TEXT | |
| `cluster_description_history` | `previous_tags` | JSONB | |
| `cluster_description_history` | `proposed_tags` | JSONB | |
| `cluster_description_history` | `rationale` | TEXT | Sage's reasoning |
| `cluster_description_history` | `member_confirmation_summary` | TEXT | |
| `cluster_description_history` | `demographic_privacy_check` | ENUM('PASSED','RETURNED') | |
| `cluster_description_history` | `clio_approved_at` | TIMESTAMP | |
| `cluster_description_history` | `revert_deadline` | TIMESTAMP | 14 days after approval |
| `cluster_description_history` | `reverted` | BOOLEAN | Whether founding user reverted |

---

## API Endpoints Required

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `POST /api/sage/cluster/{id}/description-proposal` | POST | Sage submits proposal to Clio queue |
| `GET /api/clio/cluster-description-queue` | GET | Clio pulls pending proposals |
| `POST /api/clio/cluster-description-proposal/{id}/approve` | POST | Clio approves, triggers live update |
| `POST /api/clio/cluster-description-proposal/{id}/return` | POST | Clio returns with revision guidance |
| `POST /api/clusters/{id}/description/revert` | POST | Founding user reverts within 14 days |

---

**Cluster Description Refinement Spec · v1.0 · Addendum to Sage SOUL v1.1 and Handoff v1.1**
