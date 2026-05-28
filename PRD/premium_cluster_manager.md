# Premium Cluster Manager — Onboarding Workflow

> **Feature Spec · Premium Tier**
> *Defines how Founders add Managers to premium clusters for human review and moderation assistance.*

---

## 1. What a Manager Is

A Manager is a trusted human appointed by a premium cluster's Founder to assist with cluster oversight. Managers provide the human review layer that complements Sage's AI moderation — especially critical for high-risk topic clusters (theology, politics, mental health).

**A Manager is NOT a moderator in the traditional sense.** They do not police conversation. They review Sage's interventions, flag content that AI moderation may have misjudged, and help refine the cluster's direction.

---

## 2. Manager Permissions

| Permission | Founder | Manager | Member |
|------------|---------|---------|--------|
| View cluster posts and Pulse | ✅ | ✅ | ✅ |
| Post in cluster | ✅ | ✅ | ✅ |
| Review Sage interventions (admin panel) | ✅ | ✅ | ❌ |
| Flag content for human review | ✅ | ✅ | ❌ |
| Adjust cluster description proposals (suggest to Clio) | ✅ | ✅ | ❌ |
| Add/remove Managers | ✅ | ❌ | ❌ |
| Change AGGIL parameters | ❌ | ❌ | ❌ |
| Override post-spawn immutability | ❌ | ❌ | ❌ |
| Access member private data (email, real name) | ❌ | ❌ | ❌ |
| View Sage intervention accuracy metrics | ✅ | ✅ | ❌ |
| Receive Observer findings for this cluster | ✅ | ✅ | ❌ |

---

## 3. Onboarding Flow

### Step 1 — Founder Initiates

Founder navigates to **Cluster Settings → Team → Add Manager**.

Clio confirms:
> *"Adding a Manager gives them access to Sage's intervention log and the ability to flag content for review. They won't be able to change the cluster's core parameters or see member private data. Who do you want to add?"*

### Step 2 — Founder Provides Contact

Founder enters:
- Manager's **email address** (must be a registered Aggilo user)
- Optional: a **one-line note** explaining why they're being added (visible to the Manager)

### Step 3 — Clio Validates

Clio checks:
- [ ] Email belongs to a registered Aggilo user
- [ ] User is not already a Manager of 5+ clusters (limit to prevent moderation fatigue)
- [ ] User is not currently flagged by Observer for safety concerns

If any check fails, Clio explains why and does not proceed.

### Step 4 — Invitation Sent

The invited user receives a Clio DM (not email — this stays within the platform):
> *"[Founder nickname] has invited you to be a Manager of [cluster name]. This means you'll help review how the AI works inside this cluster — flagging anything that doesn't feel right and keeping the conversation on track. You won't be able to change the cluster's rules or see anyone's private information. Interested?"*

Two options: **Accept** | **Decline**

### Step 5 — Manager Onboarding (on Accept)

Clio delivers a brief onboarding sequence (3 messages):

**Message 1 — Your Role:**
> *"As a Manager, you'll see Sage's intervention log — every post Sage has made, every poll, every re-engagement prompt. Your job isn't to review every one. It's to flag anything that feels off — a scriptural reference that's inaccurate, a tone that's wrong, or a moment where Sage should have intervened but didn't."*

**Message 2 — The Tools:**
> *"In the Manager panel you'll see: Sage's posts with timestamps, member engagement signals, and a one-tap 'Flag for Review' button. Flagged items go to the Founder and are logged for Sage's accuracy tracking."*

**Message 3 — The Boundary:**
> *"One thing to be clear about: you shape the cluster's direction by flagging and suggesting. You don't control conversations or members. If you see something that needs urgent attention — welfare concerns, safety — flag it immediately and Clio handles the rest."*

### Step 6 — Manager Active

Manager role is stored in `cluster_members` with `role: manager`. They now see the Manager panel in the cluster UI.

---

## 4. Manager Panel UI

The Manager panel is accessible via a subtle icon in the cluster header (visible only to Founders and Managers).

### Sections:

**Sage Intervention Log**
- Chronological list of all Sage posts in this cluster
- Each entry shows: timestamp, post content, arc phase at time of posting, engagement stats (replies, reactions)
- One-tap "Flag" button per entry → opens a dropdown: `Inaccurate Reference` | `Wrong Tone` | `Missed Intervention` | `Other`
- Flag includes optional free-text note

**Cluster Health Dashboard**
- Current arc phase + time in phase
- Sage accuracy rate (% of posts that received positive engagement vs flagged)
- Observer findings for this cluster (if any)
- Member count + activity trend (7-day, 30-day)

**Description Proposals**
- Active Sage description refinement proposals (if any)
- Manager can add comments/suggestions before Clio's scope test

---

## 5. Database Fields

| Table | Field | Type | Purpose |
|-------|-------|------|---------|
| `cluster_members` | `role` | ENUM('founder','manager','member') | Role within cluster |
| `cluster_manager_flags` | `id` | UUID PK | |
| `cluster_manager_flags` | `cluster_id` | FK | |
| `cluster_manager_flags` | `flagged_by` | FK (user_id) | Manager who flagged |
| `cluster_manager_flags` | `sage_post_id` | FK | The Sage post being flagged |
| `cluster_manager_flags` | `flag_type` | ENUM('inaccurate_reference','wrong_tone','missed_intervention','other') | |
| `cluster_manager_flags` | `note` | TEXT NULLABLE | Optional explanation |
| `cluster_manager_flags` | `created_at` | TIMESTAMP | |
| `cluster_manager_flags` | `resolved_at` | TIMESTAMP NULLABLE | When founder reviewed |
| `cluster_manager_invitations` | `id` | UUID PK | |
| `cluster_manager_invitations` | `cluster_id` | FK | |
| `cluster_manager_invitations` | `invited_by` | FK (founder user_id) | |
| `cluster_manager_invitations` | `invited_user_id` | FK | |
| `cluster_manager_invitations` | `status` | ENUM('pending','accepted','declined','revoked') | |
| `cluster_manager_invitations` | `created_at` | TIMESTAMP | |

---

## 6. Limits

- Maximum **3 Managers per cluster** (Founder is not counted toward this limit)
- A single user can be Manager of at most **5 clusters** (to prevent moderation fatigue)
- Manager role can be **revoked by Founder** at any time (instant, no approval needed)
- Manager flags are logged permanently for Sage accuracy calibration — even if the Manager is later removed

---

*Premium Cluster Manager · v1.0 · Internal Feature Specification*
