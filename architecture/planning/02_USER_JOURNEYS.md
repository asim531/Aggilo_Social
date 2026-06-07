# Aggilo — User Journey Map

> Derived from `Revised_Screen_Prompts/mobile_screen_prompts_phase1.md` and architecture docs.

## Journey 1: New User Registration & Onboarding (Path A)

**Start:** Unauthenticated, app not installed
**End:** Authenticated, profile created, on Explore with Clio-curated clusters
**Screens:** 0.1 → 1.1 → 1.2 → 2.1 → 2.2 → 2.3 → 2.4 → 2.5 → 2.6 → 3.1

| Step | Screen | API Calls | DB Writes | AI | Realtime |
|------|--------|-----------|-----------|-----|----------|
| Walkthrough | 0.1 | None | None | Clio narration | None |
| Login | 1.1 | `POST /api/auth/send-otp` | None | Clio micro-presence | None |
| OTP | 1.2 | `POST /api/auth/verify-otp` | `auth.users` | Clio micro-presence | None |
| YoB+Gender | 2.1 | `POST /api/profile/update` | `profiles` | None | None |
| Language | 2.2 | `POST /api/profile/update` | `profiles` | None | None |
| Nickname | 2.3 | `POST /api/nickname/check`, `POST /api/profile/update` | `profiles` | None | None |
| Location | 2.4 | `POST /api/profile/location` | `profiles.location_data` | None | None |
| Transition | 2.5 | None | None | Clio (Happy) | None |
| Welcome | 2.6 | `POST /api/clio/chat` | `clio_conversations` | Clio full conversation | None |
| Explore | 3.1 | `GET /api/clusters/search` | None | Clio curation | None |

**Failure States:** Invalid OTP (shake + red text), nickname taken (suggestions), age < 18 (rejection), network error (retry)
**Edge Cases:** Evangelist path (2.6E), returning user (1.3), location denied, language pre-pop from device

---

## Journey 2: Cluster Discovery & Joining

**Start:** On Explore screen
**End:** Member of cluster, viewing Timeline
**Screens:** 3.1/3.2 → 4.0 → 4.1

| Step | Screen | API Calls | DB Writes | AI | Realtime |
|------|--------|-----------|-----------|-----|----------|
| Browse | 3.1/3.2 | `GET /api/clusters/search` | None | Clio insight pills | None |
| View Cluster | 4.0 | `GET /api/clusters/:id` | None | Clio (Thinking) | None |
| Join | 4.1 | `POST /api/clusters/:id/join` | `cluster_members` | Clio confirmation | Presence (S1) |
| Timeline | 4.1 | `GET /api/clusters/:id/feed` | None | Sage anchor posts | Arrival (S3) |

**Failure States:** AGGIL mismatch, cluster full, network error
**Edge Cases:** Non-member read-only view, join confirmation card, first join triggers My Clusters strip + Sage introduction

---

## Journey 3: Cluster Creation (Clio Conversational)

**Start:** User expresses desire for new cluster
**End:** Cluster created, founder viewing new Timeline
**Screens:** 5.1 → 5.2 → 5.3 → 5.4 → 5.5 → 5.6

| Step | Screen | API Calls | DB Writes | AI | Realtime |
|------|--------|-----------|-----------|-----|----------|
| Initiation | 5.1 | `POST /api/clio/chat` | None | Clio intent capture | None |
| Similar Check | 5.2 | `GET /api/clusters/search` (semantic) | None | Clio duplicate detection | None |
| Disambiguation | 5.3 | `POST /api/clio/chat` | None | Clio disambiguation | None |
| Questions | 5.4 | `POST /api/clio/chat` (3 turns) | None | Clio questionnaire | None |
| Confirmation | 5.5 | None | None | Clio brief generation | None |
| Create | 5.6 | `POST /api/clusters` | `clusters`, `cluster_members` | Clio success | None |

**Failure States:** Duplicate exists, invalid AGGIL, creation quota exceeded
**Edge Cases:** User insists on duplicate, Clio determines need IS covered, refinement cycle

---

## Journey 4: In-Cluster Participation (Timeline)

**Start:** Inside cluster, Timeline tab
**End:** Ongoing participation
**Screens:** 4.1 (with compose, posts, comments)

| Action | API Calls | DB Writes | AI | Realtime |
|--------|-----------|-----------|-----|----------|
| View Feed | `GET /api/clusters/:id/feed` | None | None | None |
| Compose Post | `POST /api/clusters/:id/posts` | `posts` | Clio placeholder | Arrival (S3a) |
| Like | `POST /api/posts/:id/like` | `post_likes` | None | None |
| Comment | `POST /api/posts/:id/comment` | `comments` | None | None |
| Report | `POST /api/posts/:id/report` | `reports` | Moderation AI | None |
| @Sage | Mention in post | None | Sage response (30s SLA) | None |
| Pull-to-refresh | `GET /api/clusters/:id/feed` | None | None | None |

**Failure States:** Post failure, moderation flag, network drop
**Edge Cases:** Empty state (Atlas populating), non-member read-only, long-press actions, new posts pill

---

## Journey 5: DM Request & Conversation

**Start:** Stage 3 user, Members tab
**End:** Active DM thread with Connection
**Screens:** 4.2 → 4.2a → DM Thread

| Step | API Calls | DB Writes | AI | Realtime |
|------|-----------|-----------|-----|----------|
| View Members | `GET /api/clusters/:id/members` | None | None | None |
| Send Request | `POST /api/dm/request` | `dm_threads` | None | None |
| Accept/Decline | `POST /api/dm/respond` | `dm_threads` | None | None |
| Chat | `POST /api/dm/send`, `GET /api/dm/conversations` | `dm_messages` | None | Supabase RT |

**Failure States:** Request declined (silent), expired (30 days), blocked user
**Edge Cases:** Silent decline, 30-day pending expiry, Connection concept, cross-cluster thread merge

---

## Journey 6: Clio AMA / Discovery Calibration

**Start:** Explore, user taps Tune icon
**End:** Explore reloaded with calibrated parameters
**Screens:** 3.3 → 3.4

| Step | API Calls | DB Writes | AI | Realtime |
|------|-----------|-----------|-----|----------|
| Open AMA | None | None | Clio opening question | None |
| Describe Need | `POST /api/clio/chat` | None | Clio intent inference | None |
| Confirm | None | None | Clio calibration card | None |
| Reload | `GET /api/clusters/search` (calibrated) | None | Clio calibrated pill | None |

**Failure States:** Zero calibrated results, ambiguous intent
**Edge Cases:** Active indicator dot, "start fresh" reset, broader match fallback

---

## Journey 7: Activity Feed

**Start:** Stage 2+ user, Activity tab visible
**End:** Navigate to relevant cluster/DM
**Screens:** 6.1

| Action | API Calls | DB Writes | AI | Realtime |
|--------|-----------|-----------|-----|----------|
| View Feed | `GET /api/activity` | None | Clio match generation | None |
| Tap Item | Navigate to cluster/DM | None | None | None |
| Dismiss | Swipe left | None | None | None |

**Edge Cases:** Stage 1 locked (tab absent), bell dropdown for Stage 1, empty state

---

## Journey 8: Evangelist Accelerated Onboarding

**Start:** Invited user opens app
**End:** On Explore with pre-loaded matches
**Screens:** 2.6E → 3.1E

| Step | API Calls | DB Writes | AI | Realtime |
|------|-----------|-----------|-----|----------|
| Welcome | Invite payload validation | None | Clio contextual | None |
| Explore | `GET /api/clusters/search` (pre-fetched) | None | Clio (Resting) | None |

**Edge Cases:** No tour, no walkthrough, Clio goes straight to product

---

## Journey 9: Shared Invite Flow

**Start:** User taps shared cluster invite link
**End:** Authenticated, auto-joined to cluster
**Screens:** 9.1 → 9.2 → 9.4 → 4.1

| Step | API Calls | DB Writes | AI | Realtime |
|------|-----------|-----------|-----|----------|
| Landing | Invite link validation | None | None | None |
| Eligibility | AGGIL check | None | None | None |
| Sign Up | Auth + profile creation | `auth.users`, `profiles` | None | None |
| Auto-Join | `POST /api/clusters/:id/join` | `cluster_members` | None | None |

**Failure States:** AGGIL mismatch, expired link, cluster full
**Edge Cases:** Existing user vs new user path

---

## Journey 10: Admin Moderation & Observer Review

**Start:** Admin logged in, dashboard
**End:** Action taken on finding/report
**Screens:** Admin Dashboard sections

| Action | API Calls | DB Writes | AI | Realtime |
|--------|-----------|-----------|-----|----------|
| View Dashboard | `GET /api/admin/dashboard` | None | None | None |
| Review Finding | `GET /api/admin/observer/findings` | None | Observer generation | None |
| Approve/Reject | `POST /api/admin/observer/findings/:id/action` | `observer_findings` | None | None |
| Handle Report | `POST /api/admin/reports/:id/action` | `reports`, `user_bans` | None | None |

**Edge Cases:** Critical severity immediate action, veto windows for autonomous updates
