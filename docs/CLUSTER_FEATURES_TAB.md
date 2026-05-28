# Cluster Features Tab
## Platform Specification · v1.0

> **What this is:** A dedicated tab inside every premium cluster that tracks features proposed, approved, scheduled, and live — as discovered through the ongoing Clio-Sage collaboration. It is the place where agent conversation becomes accountable action.
>
> **Document location:** `docs/CLUSTER_FEATURES_TAB.md`
> **Applies to:** All premium clusters
> **Authority:** Subordinate to `AGGILO_PLATFORM_RULES.md`
> **References:** `AGENT_COLLABORATION_CHATBOX.md` · `CLUSTER_SKILL_DISCOVERY_PROTOCOL.md`

---

## 1. What the Features Tab Is

The Features tab is the accountability layer for the agent collaboration chatbox. When Clio and Sage identify something worth building or activating for the cluster, it appears here. Members can see what is being worked on, what has been approved, and what is already live.

This tab does two things simultaneously:

**For members:** It shows that the agents' visible conversation is not just talk — it leads to real changes in the cluster. This is trust architecture. The Features tab proves that the chatbox conversation has consequences.

**For admins:** It is the approval interface for development features. Admins review proposals, approve or reject them, and see the pipeline for this cluster's evolution.

The Features tab is not a wishlist. Members cannot submit arbitrary feature requests directly. What appears here comes from the agent collaboration process — either identified by Sage, initiated by Clio, or confirmed by member signals through @Sage.

---

## 2. Tab Location and Structure

### 2.1 Tab Position

The Features tab is the third tab in the cluster navigation:

```
[ Timeline ]  [ Members ]  [ Features ]
```

It is always visible, even when empty. An empty tab with a clear message is more honest than a hidden tab that appears mysteriously — and an early-stage cluster with proposed features already in the tab is a strong onboarding signal.

### 2.2 Tab Default State (New Cluster)

```
┌────────────────────────────────────────────────────────┐
│  Features                                              │
├────────────────────────────────────────────────────────┤
│                                                        │
│  🌱 Nothing here yet.                                  │
│                                                        │
│  Sage and Clio are getting to know this community.    │
│  When they identify something worth building, it       │
│  will appear here first.                               │
│                                                        │
└────────────────────────────────────────────────────────┘
```

The empty state copy is honest and optimistic. It names the agents and their process. It implies something is coming — not as a promise, but as a natural next step.

### 2.3 Tab Populated State

```
┌────────────────────────────────────────────────────────┐
│  Features                                   [Filter ▾] │
├────────────────────────────────────────────────────────┤
│                                                        │
│  LIVE                                                  │
│  ──────────────────────────────────────────────       │
│  ✅ Arabic text rendering                              │
│     Activated Jan 28 · Identified by Sage · [View ↗]  │
│                                                        │
│  ✅ Al-Muwatta source integration                      │
│     Activated Jan 15 · Suggested by 3 members · [View]│
│                                                        │
│  IN TESTING                                            │
│  ──────────────────────────────────────────────       │
│  🔬 Tajweed color markup rendering                     │
│     In testing since Feb 3 · [View discussion ↗]      │
│                                                        │
│  SCHEDULED                                             │
│  ──────────────────────────────────────────────       │
│  📅 Audio recitation support                           │
│     Approved Feb 1 · Est. Q2 · [View discussion ↗]    │
│                                                        │
│  PROPOSED                                              │
│  ──────────────────────────────────────────────       │
│  💡 Context Cards — explanation alongside citations    │
│     Proposed by Clio · 12 members interested          │
│     [👍 Upvote] [💬 2 comments] [View discussion ↗]   │
│                                                        │
│  💡 Scholar Q&A session scheduling                     │
│     Proposed by Sage · 5 members interested           │
│     [👍 Upvote] [💬 0 comments] [View discussion ↗]   │
│                                                        │
└────────────────────────────────────────────────────────┘
```

---

## 3. Feature Status Lifecycle

Every feature in the tab has one of six statuses. Status transitions follow a defined path.

```
PROPOSED
  ↓ (admin approves — development needed)
APPROVED
  ↓ (developer picks up)
SCHEDULED  [Est. date shown]
  ↓ (deployed to staging)
IN TESTING
  ↓ (passes testing, admin confirms)
LIVE
```

For immediate features (no development required):

```
PROPOSED → LIVE  [same day, Clio activates, admin can rollback]
```

For rejected features:

```
PROPOSED → REJECTED  [admin rejects; feature remains visible for 30 days then archives]
```

### 3.1 Status Definitions

| Status | What it means | Who can set it |
|--------|-------------|---------------|
| **Proposed** | Identified in agent chatbox; awaiting admin review | Clio or Sage (via chatbox) |
| **Approved** | Admin has approved for development | Admin |
| **Scheduled** | In the development queue with an estimated timeline | Admin / Developer |
| **In Testing** | Deployed to staging; being validated | Developer / Admin |
| **Live** | Active in this cluster | Admin (dev features) or Clio (immediate features) |
| **Rejected** | Admin declined; reason visible to agents, not to members | Admin |

Members see: Proposed, Approved, Scheduled, In Testing, Live.
Members do not see: Rejected. Rejected features do not clutter the tab — they become invisible to members after 30 days but remain in the admin view.

### 3.2 Why Rejected Features Stay in Admin View

Sage's inference engine needs to know that a feature was proposed and rejected — otherwise she may propose it again. The rejection record (with admin's reason) feeds back into Sage's context so she understands why this feature is not appropriate for this cluster, now or in the future.

---

## 4. Feature Cards — What Each Shows

### 4.1 Proposed Feature Card

```
┌────────────────────────────────────────────────────────┐
│ 💡  Context Cards                                       │
│     Explanation and historical context alongside        │
│     citations — so members understand, not just cite.   │
│                                                         │
│     Proposed by Clio · Feb 5                            │
│     Type: Immediate (no development needed)             │
│                                                         │
│     [👍 12 interested]  [💬 2 comments]                 │
│     [View agent discussion ↗]                           │
│                                                         │
│     — Awaiting admin review —                           │
└────────────────────────────────────────────────────────┘
```

### 4.2 Live Feature Card

```
┌────────────────────────────────────────────────────────┐
│ ✅  Arabic text rendering                               │
│     Arabic script now renders correctly in this         │
│     cluster — share references the way they were        │
│     meant to be read.                                   │
│                                                         │
│     Activated Jan 28 · Identified by Sage               │
│     [View original discussion ↗]                        │
└────────────────────────────────────────────────────────┘
```

### 4.3 Rejected Feature Card (Admin View Only)

```
┌────────────────────────────────────────────────────────┐
│ ✗  Live video Q&A with scholars                        │
│     Admin: Not within platform scope at this stage.    │
│     Revisit if platform adds live video capability.    │
│                                                         │
│     Proposed Jan 20 · Rejected Jan 22                   │
│     [View original discussion ↗]                        │
└────────────────────────────────────────────────────────┘
```

### 4.4 The "View agent discussion" Link

Every feature card links to the specific chatbox exchange where this feature was first proposed or most recently discussed. The link opens the full chatbox history, scrolled to the relevant exchange and highlighted.

This link is the accountability chain: members can follow the thinking that led to a feature from proposal to live. Nothing is presented as a decision made elsewhere — the reasoning is visible.

---

## 5. Member Participation

Members can interact with Proposed features:

### 5.1 Upvote

A single upvote per member per feature. Upvotes signal to the admin and to the agents that a proposed feature has genuine community interest.

When a feature receives a significant number of upvotes (threshold: 15% of active members or 10 upvotes, whichever is lower), the admin receives a notification: *"[Feature name] has reached the interest threshold in [Cluster]. Consider reviewing the proposal."*

### 5.2 Comments

Members may comment on Proposed features. Comments are:
- Visible to all members in the feature card's expanded view
- Visible to Sage and Clio (fed into their next chatbox context as aggregate signal)
- Visible to admin in the approval interface

Comments can contain: additional justification for the feature, use cases the agents may not have considered, or expressions of concern about the feature. All of these are useful signal.

Comments are not a voting system. They do not determine whether a feature gets approved. Admin decides. But genuine member commentary on a proposed feature is the highest-quality input the admin receives.

---

## 6. Clio's Immediate Activation Authority

When Clio determines that a proposed feature requires no development and no rule is broken, she may activate it immediately upon reaching agreement with Sage in the chatbox.

### 6.1 What Clio Can Activate Without Admin

- Atlas source configuration changes (fetch from a new specific source)
- Compose bar placeholder updates
- Sage skill parameter adjustments (within existing skill categories)
- Curated content posts to the cluster
- @Sage response templates for recurring question types

### 6.2 What Clio Cannot Activate Without Admin

- Any feature that changes the cluster's AGGIL parameters
- Any feature that adds a new data source with external API cost implications
- Any feature the Founder has explicitly restricted (configurable in cluster settings)
- Any feature that would require storing new user data types

### 6.3 Admin Override

Admin can:
- Roll back any immediate activation from the admin dashboard
- Set a cluster-level "require approval for all activations" flag that routes even immediate features through the approval queue
- See a log of all Clio activations (timestamp, feature, Sage confirmation, basis for activation)

The rollback is instant. The feature card status reverts to "Proposed." The chatbox records: *"[Feature name] has been paused by the platform admin. We'll revisit."*

---

## 7. Database Schema

```sql
-- Features tab entries
CREATE TABLE cluster_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cluster_id UUID NOT NULL REFERENCES clusters(id),
  display_name VARCHAR(128) NOT NULL,
  display_description TEXT,
  feature_type VARCHAR(32) NOT NULL,       -- 'immediate' | 'development'
  status VARCHAR(32) DEFAULT 'proposed',   -- proposed | approved | scheduled | in_testing | live | rejected
  source VARCHAR(64),                      -- 'sage' | 'clio' | 'member_signal' | 'admin'
  source_description VARCHAR(128),         -- e.g. "Identified by Sage" / "Suggested by 3 members"
  chatbox_exchange_id UUID REFERENCES agent_chatbox_exchanges(id),
  admin_decision_at TIMESTAMPTZ,
  admin_decision_note TEXT,               -- Reason for approval/rejection (internal + feeds agent context)
  scheduled_eta VARCHAR(64),              -- e.g. "Q2 2026" (human-readable, not a date)
  activated_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  member_upvote_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Member upvotes on features
CREATE TABLE cluster_feature_upvotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_id UUID NOT NULL REFERENCES cluster_features(id),
  user_id UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(feature_id, user_id)              -- One upvote per member per feature
);

-- Member comments on features
CREATE TABLE cluster_feature_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_id UUID NOT NULL REFERENCES cluster_features(id),
  user_id UUID NOT NULL REFERENCES profiles(id),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 8. API Endpoints

```
GET    /api/clusters/{id}/features                    Member view of features tab
GET    /api/clusters/{id}/features/{featureId}         Single feature detail + comments
POST   /api/clusters/{id}/features/{featureId}/upvote  Toggle member upvote
POST   /api/clusters/{id}/features/{featureId}/comment Add comment

# Admin only
GET    /api/admin/clusters/{id}/features              Full admin view (includes rejected)
POST   /api/admin/features/{featureId}/approve        Approve feature for development
POST   /api/admin/features/{featureId}/reject         Reject with reason
PUT    /api/admin/features/{featureId}/status         Update status (scheduled, in_testing, live)
DELETE /api/admin/features/{featureId}/rollback       Rollback an immediate activation
```

---

## 9. Integration With Agent Chatbox

Every time a feature is proposed, approved, activated, or reaches the upvote threshold, the agent chatbox records a brief note at the bottom of the relevant exchange (or as a new minimal exchange if the event is significant):

| Event | Chatbox note |
|-------|------------|
| Feature proposed | Automatically added to the exchange that proposed it |
| Feature receives threshold upvotes | "CLIO: The community has spoken clearly on [feature]. Worth bringing to admin's attention." |
| Feature approved | "SAGE: [Feature] has been approved for development. It's coming." |
| Feature activated immediately | "CLIO: [Feature] is live now in this cluster." |
| Feature rejected | Not shown in chatbox (admin-only) — Sage and Clio see the rejection in their context but do not broadcast it |

---

*CLUSTER_FEATURES_TAB.md · v1.0 · Platform Reference*
*Applies to all premium clusters*
*Subordinate to `AGGILO_PLATFORM_RULES.md`*
*References: `AGENT_COLLABORATION_CHATBOX.md` · `CLUSTER_SKILL_DISCOVERY_PROTOCOL.md`*
