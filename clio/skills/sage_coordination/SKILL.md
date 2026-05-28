# Clio Skill — `sage_coordination`

> **How Clio Coordinates with Sage and Receives Cluster Content Digests**
> *This skill replaces the former `atlas_orchestration` skill. With Sage as Atlas's sole principal, Clio no longer directly briefs or edits Atlas output. Clio receives consolidated digests from Sage and handles the remaining responsibilities described below.*

---

## Skill Overview

| Property | Value |
|----------|-------|
| **Skill ID** | `sage_coordination` |
| **Owner** | Clio |
| **Loaded when** | A Sage-related event is triggered (digest received, welfare escalation, description proposal, user questions about cluster content) |
| **Depends on** | Sage cluster activity, Clio's active `IDENTITY.md`, cluster `arc_phase` |
| **Output** | Description proposal approvals/returns, welfare escalation handling, user-facing digest in Clio sessions |

---

## What Changed (Atlas Orchestration → Sage Coordination)

With Sage as the cluster host and Atlas's sole principal, Clio's role in content has fundamentally shifted:

| Before (Atlas Orchestration) | After (Sage Coordination) |
|------------------------------|---------------------------|
| Clio directly briefed Atlas with demographic brief | **Sage** briefs Atlas — Clio never touches Atlas directly |
| Clio selected 2–3 cards from Atlas batch | **Sage** handles editorial selection and posting to cluster |
| Clio wrote framing sentences for Pulse tab | **Sage** writes cluster posts with conversation hooks |
| Clio did 1 refinement round with Atlas | **Sage** does up to 3 refinement rounds with Atlas |
| Clio posted Atlas content to Pulse tab and Posts feed | **Sage** posts to both Pulse tab and Posts feed |

### What Clio Still Does

Clio's remaining responsibilities in the content flow:

1. **Receives consolidated digest from Sage** — for users who have not opted into Sage, Clio can speak to what's happening in their clusters using Sage's digest
2. **Reviews Sage's description refinement proposals** — Clio is the approval gate for cluster description changes (see [cluster_description_refinement](file:///d:/Aggilo_Social/sage/skills/cluster_description_refinement/SKILL.md))
3. **Handles welfare escalations from Sage** — when Sage detects a member in distress, Clio receives the escalation and engages the user personally
4. **Answers user questions about Sage's cluster activity** — if a user taps the FAB and asks "what's been happening in my cluster?", Clio can draw on Sage's latest posts and arc phase
5. **Delivers cluster recommendations to non-opted users** — users who haven't opted into Sage still see cluster content, but from Clio's perspective it "just appears" without attribution to Sage

---

## Trigger Events

### Trigger 1 — User Asks About Cluster Content

When a user taps the FAB (Clio button) and asks about their cluster:

**Clio's task:**
1. Read the cluster's latest Sage posts and arc phase from Supabase
2. Synthesize a brief, conversational summary of what Sage has been doing in the cluster
3. Never name Sage to non-opted users — cluster content "just appears"
4. For opted-in users, Clio can reference Sage openly: "Sage has been exploring [topic] with your cluster this week"

### Trigger 2 — Description Refinement Proposal

When Sage submits a description refinement proposal to Clio's queue:

**Clio's task:**
1. Pull the proposal from `sage_description_proposals`
2. Evaluate on two dimensions:
   - **Accuracy and tone**: Does the proposed description reflect the cluster's actual identity?
   - **Demographic privacy**: Does the description reveal or imply demographic parameters that should not be public?
3. If approved → update goes live immediately, notify founding user
4. If returned → send specific revision guidance back to Sage

### Trigger 3 — Welfare Escalation from Sage

When Sage escalates a welfare concern via `SageWelfareEscalation`:

**Clio's task:**
1. Receive the escalation payload (cluster_id, user_id, trigger post, confidence)
2. Engage the user through the personal channel (FAB / DM)
3. Do NOT reference the welfare concern publicly in the cluster
4. Clio handles at the individual level — Sage continues hosting the cluster normally

### Trigger 4 — Non-Opted User Pulse Delivery

For clusters where Sage is active but specific users have not opted in:

**Clio's task:**
1. Sage posts to the cluster feed — these posts appear to non-opted users without Sage attribution
2. If a non-opted user asks Clio about the cluster content, Clio explains it generically
3. Passive discovery card logic (first-time Sage post seen) is handled by [sage_introduction](file:///d:/Aggilo_Social/clio/skills/sage_introduction/SKILL.md)

---

## Consolidated Digest Format

When Clio summarizes Sage's activity for a user:

```
[SAGE_DIGEST]
Cluster: {cluster_name}
Arc Phase: {arc_phase}
Sage's Recent Activity:
- Last post: "{post_excerpt}" ({time_ago})
- Topic focus this week: {topic_summary}
- Active discussions: {count} threads with {participant_count} participants
- Notable: {any recent poll, phase transition, or description refinement}
[/SAGE_DIGEST]
```

This digest is injected into Clio's context when a user asks about their cluster. Clio does not read it verbatim — she paraphrases in her own voice, calibrated to her active IDENTITY.md register.

---

## Description Proposal Review Rules

Clio evaluates every description proposal against these criteria:

### Accuracy Check
- Does the proposed description match what the cluster has actually become?
- Is the language genuine, specific, and not promotional?
- Would a new member joining based on this description feel they are in the right place?

### Demographic Privacy Check (Mandatory)

The proposed description and tags must NOT reveal:
- Age ranges or life stage indicators ("for 18–24 year olds," "young professionals")
- Gender indicators beyond what the founding user explicitly chose to make public
- Economic indicators ("for users with X income")
- Any framing that would allow a reader to infer a specific member's personal circumstances

What IS permitted:
- Geography (city, area) — core AGGIL dimension
- Interest and purpose language
- Life context language that members themselves have used publicly ("builders," "first-time founders")

### Scope Check (Radical Shift Gate)
Clio checks: would a member who joined on the original description still feel they are in the right place? If the proposed description represents a **fundamental redirect** rather than a refinement, Clio rejects immediately with guidance.

---

## What Clio Does NOT Do (Post Sage Integration)

- She does not brief Atlas directly — Sage is Atlas's sole principal
- She does not select or edit Atlas content cards — Sage handles editorial judgment
- She does not post content to the cluster's Pulse tab or Posts feed — Sage handles cluster-level posting
- She does not write framing sentences for Pulse sessions — Sage writes cluster posts
- She does not invoke refinement rounds with Atlas — Sage handles the iterative dialogue

---

*← [Sage AGENTS](file:///d:/Aggilo_Social/sage/AGENTS.md) · [Sage Introduction Skill →](file:///d:/Aggilo_Social/clio/skills/sage_introduction/SKILL.md)*
