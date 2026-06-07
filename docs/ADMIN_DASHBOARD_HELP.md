# Admin Dashboard Help — Source of Truth

> **Role:** Master reference for all help text, tooltips, and UI copy. Every Genesis Engine control, token budget slider, escalation notification, and feature signal UI element derives from this document.
> **Update rule:** When any rule changes, update this document first. UI copy is then regenerated from it.

---

## 1. Genesis Engine

### What is the Genesis Engine?

> Help (top of Intelligence Tab):
> "The Genesis Engine automatically checks that every new cluster has the tools, topics, and calibration it needs for its declared purpose. It runs in two phases: first, it generates a detailed spec from the founder's intent; second, it validates that the live cluster matches that spec. You can review its findings and approve or reject any recommended changes."

> Tooltip (hover "Genesis Reports"):
> "Automated cluster configuration validation. Catches missing tools, mismatched settings, and calibration gaps before members notice them."

### Spec Generation (Cycle A)

> Help (report detail):
> "The Genesis Engine reads the approved cluster draft and generates a detailed configuration spec: which tools are enabled, what seed topics exist, how Sage is calibrated, and what the cluster's purpose statement means in practice. This spec is versioned and stored. If the engine detects a conflict with platform rules, it flags the conflict for your review instead of proceeding."

> Tooltip ("Spec Version"): "Versioned snapshot of the cluster's intended configuration. Each revision increments the version number."
> Tooltip ("Rule Conflict"): "The generated spec conflicts with an immutable platform rule. Human review required."

### Creation Validation (Cycle B)

> Help (validation report):
> "The Genesis Engine compares the live cluster against its generated spec. It checks: Are the right tools enabled? Do seed topics exist? Is Sage calibrated for the cluster's purpose? It automatically fixes low-risk gaps (e.g., missing seed topics) and surfaces medium/high-risk gaps to you for approval."

> Tooltip ("Auto-remediated"): "Low-risk gap fixed automatically. No admin action needed."
> Tooltip ("Pending Approval"): "Medium or high-risk gap requires your decision. Review the diff and click Apply All or reject individually."
> Tooltip ("Validation Failed"): "The live cluster could not be validated against the spec. Check the error log."

### Post-Launch Monitor

> Help (monitoring panel):
> "After a cluster goes live, the Genesis Engine continues to monitor it weekly. If it detects drift (e.g., a tool was disabled, topics went stale), it flags the gap. If the drift is so significant that it would change who the cluster is for, the engine proposes creating a new cluster instead of modifying the existing one."

> Tooltip ("Weekly Monitor"): "Runs every 7 days. One 8K-token check per cluster per week. Paused if inactive for 14 days."
> Tooltip ("Drift Detected"): "The cluster's live state has diverged from its intended spec. Review the diff."
> Tooltip ("New Cluster Proposed"): "The required changes are so significant they would alter the cluster's core audience. The engine recommends creating a separate cluster. Affected members will be notified."

---

## 2. Token Budget

### Core Rules

> Help (top of Token Budget tab):
> "Every cluster has a hard token budget for Genesis Engine operations. This prevents runaway LLM costs and infinite introspection loops. When a budget is exhausted, the operation stops and surfaces to you for a decision."

> Tooltip ("Standard"): "52K tokens / 6 LLM calls max. Suitable for most clusters."
> Tooltip ("Elevated"): "104K tokens / 12 LLM calls max. For premium clusters or high-stakes launches."
> Tooltip ("Maximum"): "156K tokens / 18 LLM calls max. For flagship, monetized, or first-10 clusters."

### Promotion

> Help (promotion dialog):
> "You can promote a cluster's token budget to give the Genesis Engine more room for complex configurations. Promotion is time-bounded (30 days by default) and requires a written justification. If the cluster becomes inactive for 14 days, the promotion auto-revokes to save costs. All promotions are logged for audit."

> Tooltip ("Justification"): "Briefly explain why this cluster needs more budget. Stored in the audit log."
> Tooltip ("Duration"): "How long the promotion lasts. You can renew before expiry."
> Tooltip ("Auto-Revoke"): "If no member posts or interacts for 14 days, the budget automatically returns to Standard."

### Escalation Gates

> Help (budget exhausted):
> "This cluster's Genesis Engine has used its full token budget. You have three options:
> 1. Approve manual action — You fix the gap yourself.
> 2. Request re-run — The Genesis Engine starts fresh with the same budget.
> 3. Promote budget tier — Give the cluster a larger budget and re-run.
> If you take no action within 7 days, the cluster is flagged for platform steward review."

> Tooltip ("Budget Exhausted"): "The cluster has hit its hard token cap. No more automated introspection until you act."
> Tooltip ("7-day window"): "After 7 days of no response, the Observer agent reviews the cluster for platform health."

### Anti-Loop Rules

> Help (Advanced accordion):
> "The Genesis Engine follows strict anti-loop rules:
> - No nested introspection. The engine never introspects its own output. One revision per gap, then it stops.
> - No CIM feedback loop. Cluster Intelligence Modules can read the Genesis spec but cannot trigger a new Genesis cycle.
> - Cooldown periods. If post-launch monitoring finds a gap and remediation fails, the monitor pauses for 14 days before checking again.
> - No budget borrowing. A cluster cannot use another cluster's tokens or the global daily pool."

> Tooltip ("Cooldown Active"): "A previous remediation failed. Monitoring resumes in [N] days."

---

## 3. Feature Signals

### What are Feature Signals?

> Help (Feature Signals panel):
> "Feature signals are organic needs captured from users. Clio records them during natural conversation — she never solicits features. Signals are deduplicated (same feature mentioned multiple times increments a counter) and reviewed by the Observer for platform rule compliance. They are one input among many for the Cluster Intelligence Modules."

> Tooltip ("Signal Count"): "How many times this feature has been mentioned across all conversations in this cluster."
> Tooltip ("Source: Agentic CLI"): "Captured organically from a user's 1:1 conversation with Clio."
> Tooltip ("Source: Sage Polling"): "Inferred by Sage from cluster-wide patterns."

### Privacy & Aggregation

> Help (privacy notice bar):
> "Feature signals are privacy-protected:
> - Individual signals (with user IDs) are never shown to any human or agent.
> - Only aggregated signals appear here: features mentioned 3+ times in clusters with 8+ members.
> - Clusters with fewer than 8 members are excluded from aggregation to protect member privacy.
> - Platform admins can query raw signals for debugging only, with full audit logging."

> Tooltip ("K-Anonymity Shield"): "This cluster has fewer than 8 members. Its signals are held privately until the cluster grows."
> Tooltip ("Aggregated Only"): "Individual mentions are hidden. You see the feature and its frequency, not who said it."

### Observer Review

> Help (Observer Review panel):
> "The Observer reviews feature signals monthly for platform rule conflicts. It does not judge whether a feature is good or bad — that is the Cluster Intelligence Module's job. The Observer only checks: Does this signal violate any immutable rule? Is it safe to aggregate? Does it disclose protocol?"

> Tooltip ("Observer Approved"): "Signal passed rule compliance check. Safe for CIM evaluation."
> Tooltip ("Observer Flagged"): "Signal conflicts with a platform rule or raises a safety concern. Review the note."

---

## 4. Cluster Type & Tools

### Generic vs. Premium

> Help (cluster creation flow):
> "Cluster type sets a non-negotiable baseline. Generic clusters get basic tools (threading, polls, @Sage). Premium clusters get advanced tools (document analysis, topic taxonomy, vault). The Genesis Engine enforces these baselines. A founder can tune above the baseline but cannot drop below it."

> Tooltip ("Generic"): "Standard community. Basic tools. No admin panel. Suitable for casual interest groups."
> Tooltip ("Premium"): "Advanced community. Full tool suite. Admin + Manager roles. Vault integration. Suitable for professional, academic, or faith-study groups."

### Type Override Protection

> Help (when admin tries to disable mandated tool):
> "This tool is required for all [Generic/Premium] clusters by platform policy. Disabling it would break the cluster type contract. If you believe this cluster truly does not need it, consider changing the cluster type instead."

> Tooltip ("Type-Mandated" lock): "Required by cluster type. Cannot be disabled individually."

---

## 4a. Demand Signals

### What are Demand Signals?

> Help (Demand Signals panel):
> "Demand signals are captured when a visitor arrives at a cluster preview but doesn't match the cluster's AGGIL (demographic fit). Clio politely asks what they were looking for and collects their email and basic demographics for the waitlist. The responses tell us what clusters are in demand, where, and by which demographics. When enough signals align on the same concept, the Observer proposes creating a new cluster. Waitlist users get priority access when the cluster is created."

> Tooltip ("Demand Map"): "Geographic heat map of where visitors are requesting clusters. Zoom to city level."
> Tooltip ("Demographic Breakdown"): "Age, gender, and interest distribution of visitors who submitted demand signals. K-anonymity protected."
> Tooltip ("Signal Volume"): "How many unique visitors requested this cluster concept in the last 30 days."
> Tooltip ("Auto-Proposal Threshold"): "20 unique signals for the same concept within 30 days triggers an Observer proposal for admin review."

### Admin Actions

> Help (proposal review):
> "The Observer has flagged that enough visitors are requesting a cluster like this. You can:
> 1. Approve → Genesis pre-spawn questionnaire sent to all signal submitters
> 2. Modify → Adjust the concept before sending the questionnaire
> 3. Reject → Dismiss the proposal. Signals remain for future review."

> Tooltip ("Approve Proposal"): "Creates a new cluster draft. Questionnaire sent to all visitors who submitted a demand signal for this concept."
> Tooltip ("Reject Proposal"): "Dismiss. Observer will not re-propose for 30 days unless signal volume doubles."

---

## 4b. Cluster Vibe

### What is Cluster Vibe?

> Help (Cluster Vibe panel):
> "The cluster vibe determines what kind of content this cluster expects: text discussions, mixed media, curated links, polls, or long-form essays. It is set automatically from the intake questionnaire and determines which composer features are available to members. As the cluster matures, the Observer may detect 'format drift' and propose adjustments."

> Tooltip ("Current Vibe"): "What the cluster is configured for. Example: 'Text discussions with occasional links.'"
> Tooltip ("Format Drift"): "Members are using features outside the cluster's expected format. Example: heavy image use in a text-discussion cluster."
> Tooltip ("Composer Controls"): "Which features are available in the post composer: images, polls, formatting, etc."

### Admin Actions

> Help (vibe adjustment):
> "You can request a vibe adjustment if you feel the cluster's content format no longer matches its purpose. This triggers a Genesis Engine re-validation. The Observer will review member behavior and propose composer control changes. Changes appear in the Prompt History panel for your review."

> Tooltip ("Request Vibe Adjustment"): "Triggers Genesis Engine re-validation. Observer reviews format coherence and proposes changes."
> Tooltip ("Vibe History"): "Record of all vibe changes, who requested them, and their impact on member engagement."

---

## 4c. Sage Feedback *(Phase0 graduation)*

### What is Sage Feedback?

> Help (Sage Feedback panel):
> "Members can rate Sage posts with thumbs up or thumbs down. This is the primary signal for whether Sage's prompt calibration is working. The Observer uses this data to compute a 'positive feedback rate' that feeds into prompt refinement decisions. Members can also report a post if it feels off-topic, incorrect, or insensitive — reports route to moderation and welfare review automatically."

> Tooltip ("Positive Feedback Rate"): "Percentage of member ratings that were thumbs up in the last 30 days. Below 40% triggers Observer review."
> Tooltip ("Feedback Trend"): "7-day vs 30-day comparison. Declining means members are less satisfied with recent posts."
> Tooltip ("Reports"): "Member reports on Sage posts. 3+ reports in 7 days triggers immediate admin review."

### Admin Actions

> Help (feedback detail):
> "Click a post to see its individual feedback breakdown. You can:
> 1. Review the post content and the feedback it received
> 2. Trigger immediate Observer introspection if the feedback pattern concerns you
> 3. Roll back the most recent Sage calibration change if feedback dropped after a specific prompt update"

> Tooltip ("Trigger Observer Review"): "Consumes 1 deep introspection from Pool B. Observer will analyze why feedback is low and propose a prompt adjustment."
> Tooltip ("Rollback Calibration"): "Reverts the most recent prompt change. Only available within 30 days of the change."

### Inline UI Snippets

| Element | Inline Text |
|---------|-------------|
| Panel header | "Member feedback on Sage posts" |
| Thumbs up count | "Members found this helpful" |
| Thumbs down count | "Members found this unhelpful" |
| Report badge | "Reported: [reason]" |
| "Trigger Review" button | "Ask Observer to investigate" |
| "Rollback" button | "Undo last prompt change" |
| Empty state | "No feedback yet. Sage will receive ratings as members engage." |

---

## 5. Phase 0 Boundary

> Help (Phase 0 context banner):
> "Phase 0 (pilot) clusters can reference the Genesis Engine and feature signal documentation to understand how clusters should be configured. However, Phase 0 does not run the Genesis Engine automatically, does not capture feature signals, and does not enforce token budgets. These are main-product features. Phase 0 admins configure clusters manually."

> Tooltip ("Phase 0 Pilot"): "Manual configuration. No automated Genesis validation. No token budgets."

---

## 6. Inline UI Snippets

### Genesis Reports Tab

| Element | Inline Text |
|---------|-------------|
| "Genesis Reports" tab | "Automated validation of cluster configuration" |
| "Spec Generation" status | "Creating the cluster's intended configuration from founder intent" |
| "Creation Validation" status | "Checking that the live cluster matches its intended spec" |
| "Gap Remediation" status | "Fixing missing tools, topics, or calibration" |
| "Apply All" button | "Approve all recommended changes at once" |
| "Reject" button | "Decline this recommendation. The gap remains." |
| "View Diff" link | "See exactly what the Genesis Engine found vs. what exists" |

### Token Budget Controls

| Element | Inline Text |
|---------|-------------|
| "Token Budget" sub-tab | "LLM usage limits for automated cluster validation" |
| Current budget | "Used [X]K / [Y]K tokens ([Z] calls)" |
| "Promote" button | "Increase this cluster's budget for complex configurations" |
| Justification placeholder | "Why does this cluster need more budget? (e.g., 'Flagship launch with 50 seed topics')" |
| Duration dropdown | "How long the promotion lasts" |
| "Auto-revoke" checkbox | "Return to Standard if cluster is inactive for 14 days" |
| Budget history header | "Past promotions and their outcomes" |

### Feature Signals Panel

| Element | Inline Text |
|---------|-------------|
| Panel header | "Organic feature needs captured from member conversations" |
| Feature name | "What members are asking for" |
| Frequency count | "How many times mentioned" |
| Source badge | "Where the signal came from" |
| "Send to CIM" button | "Add this signal to the Cluster Intelligence Module's evaluation queue" |
| "Dismiss" button | "Ignore this signal. It will not be evaluated by CIM." |
| K-Anonymity message | "This cluster is too small to show individual signals. Signals will appear when the cluster reaches 8 members." |

### Escalation Notifications

| Element | Inline Text |
|---------|-------------|
| "Budget Exhausted" title | "This cluster has used its full automated validation budget" |
| Alert body | "The Genesis Engine cannot continue without more tokens or your manual input." |
| "Approve Manual Action" | "I will fix this myself" |
| "Re-run Genesis" | "Start validation fresh with the current budget" |
| "Promote & Re-run" | "Increase the budget and restart validation" |
| "Dismiss for 7 days" | "Remind me again in 7 days if I haven't acted" |

### Post-Launch Monitor

| Element | Inline Text |
|---------|-------------|
| "Drift Detected" title | "The cluster's configuration has drifted from its intended spec" |
| Body | "Review the diff to see what changed and approve fixes." |
| "New Cluster Proposed" title | "Significant changes would alter this cluster's core audience" |
| Body | "Instead of modifying this cluster, the Genesis Engine recommends creating a new one. Affected members will be invited." |
| "Create New Cluster" | "Start a new cluster with the proposed changes" |
| "Modify Existing" | "Apply changes to this cluster anyway (not recommended)" |

---

## 7. Complete Condition Checklist

Use this to verify admin dashboard implementation:

### Genesis Engine
- [ ] Spec generation: max 2 LLM calls, 16K tokens
- [ ] Introspection: max 1 call, 8K tokens
- [ ] Creation validation: max 1 call, 8K tokens
- [ ] Gap remediation: max 1 call (auto-only), 4K tokens
- [ ] Post-launch monitor: max 1 call/week, 8K tokens
- [ ] Total per cluster: 6 calls / 52K tokens (Standard)
- [ ] Total per cluster: 12 calls / 104K tokens (Elevated)
- [ ] Total per cluster: 18 calls / 156K tokens (Maximum)
- [ ] No nested introspection
- [ ] No CIM → Genesis feedback loop
- [ ] 14-day cooldown after failed remediation
- [ ] No budget borrowing across clusters
- [ ] Demographic-change detection triggers new cluster, not modification
- [ ] Genesis Engine cannot retroactively narrow demographics

### Token Budget
- [ ] Standard is default for all new clusters
- [ ] Promotion requires justification text
- [ ] Promotion is time-bounded (default 30 days)
- [ ] Auto-revoke on 14-day inactivity
- [ ] Audit log of all promotions/demotions
- [ ] Budget exhaustion routes to admin (premium → cluster admin, generic → platform admin)
- [ ] 7-day response window before Observer review
- [ ] Admin can: approve manual, request re-run, or promote budget

### Demand Signals *(Phase0 graduation)*
- [ ] Anonymous visitor can submit intent on public cluster preview when AGGIL mismatch
- [ ] Waitlist email + demographics collected with opt-in consent
- [ ] `concept_hash` deduplication: same concept increments counter
- [ ] 20 unique signals in 30 days → Observer proposes new cluster
- [ ] Admin can approve (triggers Genesis questionnaire), reject (30-day cooldown), or modify
- [ ] Approved signals auto-send pre-spawn questionnaire to all waitlist emails
- [ ] Geographic and demographic heat maps available in admin dashboard
- [ ] K-anonymity: individual emails never shown, only aggregated counts

### Feature Signals
- [ ] Clio never solicits features
- [ ] Clio distinguishes individual vs. cluster vs. cross-cluster needs
- [ ] Raw signals (with user_id) never surfaced to humans or agents
- [ ] Only aggregated signals shown (frequency ≥ 3 OR cluster ≥ 8 members)
- [ ] K-anonymity: clusters < 8 members skip aggregation
- [ ] Observer reviews monthly for rule compliance only (not merit)
- [ ] No forced pipeline feeding into tool proposal chain

### Sage Feedback *(NEW — Phase0 graduation)*
- [ ] Members can thumbs up / thumbs down any Sage post
- [ ] Members can report a Sage post (routes to moderation + welfare)
- [ ] Feedback is cluster-scoped and per-post
- [ ] Observer consumes unprocessed feedback every 6h cycle
- [ ] `sage_positive_feedback_rate` computed from `sage_post_feedback` table
- [ ] Positive rate < 40% → +15 Observer priority score
- [ ] 3+ reports in 7 days → +25 Observer priority score (immediate admin review)
- [ ] Admin can trigger Observer introspection from feedback panel (consumes 1 deep)
- [ ] Admin can rollback last prompt change within 30 days
- [ ] Reports are PII-free in Observer digest (only counts, not user IDs)

### Cluster Type
- [ ] Type sets non-negotiable tool baseline
- [ ] Founder can tune above baseline but not drop below
- [ ] Type-mandated tools show lock icon, cannot be disabled
- [ ] Changing cluster type is the only way to remove a mandated tool

### Prompt History *(NEW)*

> Help (top of Prompt History sub-tab):
> "This panel shows every prompt calibration change made to your cluster's AI agents. You can see what changed, why it changed, and whether it helped. All summaries are human-readable — you never see raw system instructions."

> Tooltip (hover "Prompt History"):
> "Track how Sage and Clio's tone, formality, and behavior have been adjusted for your cluster. Rollback any change within 30 days."

> Tooltip (hover "What Changed"):
> "The agent (Sage or Clio), the aspect (register, formality, interjection frequency, citation mode), and the direction (increased, decreased, shifted)."

> Tooltip (hover "Why"):
> "The trigger that caused the change: Genesis Engine validation, CIM behavioural analysis, member feedback, admin request, or automatic Observer detection."

> Tooltip (hover "Impact"):
> "Measured 7 days after the change: thread depth, member reply rate, engagement delta. 'Pending' means not enough time has passed."

> Tooltip (hover "Rollback"):
> "Reverts the prompt to its previous state. Available for 30 days after the change. Cannot be undone — but you can roll forward again."

> Help ("Request Review" button):
> "If Sage or Clio feels 'off' to you or your members, click this to trigger an immediate Observer introspection. This uses 1 deep introspection from your cluster's monthly Pool B allowance and guarantees a priority review within 6 hours."

> Inline help (quota meter):
> "Prompt refinement quota: X deep / Y standard remaining this month. Generic clusters get 2 deep + 4 standard. Premium clusters get 4 deep + 8 standard. Unused quota rolls over 1 month."

### Phase 0
- [ ] Phase 0 references docs but does not implement Genesis
- [ ] Phase 0 does not capture feature signals
- [ ] Phase 0 does not enforce token budgets
- [ ] Phase 0 clusters are manually configured

### Constraints
- [ ] Layer 1 (Soul) never modified by Genesis, signals, or tool economy
- [ ] Welfare protocol always routes to human
- [ ] No member individually identified in CIM or signal output
- [ ] No protocol disclosure to users
- [ ] AGGIL post-spawn protections enforced
