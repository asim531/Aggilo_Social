# Aggilo — Screen Inventory (Phase 1)

> Complete screen catalog from `Revised_Screen_Prompts/mobile_screen_prompts_phase1.md`.
> Every screen must handle: Loading, Empty, Error, Offline, and Accessibility states.

## Flow 0: Walkthrough

| ID | Screen | Purpose | Key Components | Data Deps | Agent Deps | Permission |
|----|--------|---------|----------------|-----------|------------|------------|
| 0.1 | Walkthrough | 4-slide Clio-narrated intro | Clio avatar, carousel, CTA button | None | Clio (narration) | None |

## Flow 1: Authentication (3 screens)

| ID | Screen | Purpose | Key Components | Data Deps | Agent Deps | Permission |
|----|--------|---------|----------------|-----------|------------|------------|
| 1.1 | Login/Signup | Phone/Email auth entry | Toggle tabs, input field, OTP button | None | Clio (micro, 16px) | None |
| 1.2 | OTP Verification | 6-digit code verification | 6 input boxes, timer, resend link | `auth.users` | Clio (micro, 16px) | None |
| 1.3 | Returning User Login | Welcome-back OTP | Nickname badge, OTP input | `profiles` | Clio (micro, 16px) | None |

## Flow 2: Registration & Onboarding (6 screens)

| ID | Screen | Purpose | Key Components | Data Deps | Agent Deps | Permission |
|----|--------|---------|----------------|-----------|------------|------------|
| 2.1 | YoB + Gender | Immutable profile fields (Step 1/3) | Year scroll wheel, gender pills (3), lock icons, progress dots | `profiles` | None (Clio absent) | JWT |
| 2.2 | Language Selection | Multi-language picker (Step 2/3) | Chip selector, search dropdown, primary language | `profiles` | None (Clio absent) | JWT |
| 2.3 | Nickname | Unique identity (Step 3/3) | Input with @ prefix, availability check, AI suggestions | `profiles` | None (Clio absent) | JWT |
| 2.4 | Location Permission | GPS opt-in | Map illustration, enable/skip buttons, privacy tooltip | `profiles.location_data` | None (Clio absent) | JWT |
| 2.5 | Profile Created Transition | Brief success moment | Clio (80px, Happy), checkmark, nickname | `profiles` | Clio (Happy) | JWT |
| 2.6 | Clio Welcome Conversation | First conversation | Chat bubbles, context card, chip selector (4 options), CTA | `profiles`, `clusters` | Clio (full conversation) | JWT |

## Flow 2B: Evangelist (2 screens)

| ID | Screen | Purpose | Key Components | Data Deps | Agent Deps | Permission |
|----|--------|---------|----------------|-----------|------------|------------|
| 2.6E | Evangelist Welcome | Accelerated welcome | Invite context card, cluster preview, CTA | `profiles`, `clusters` (pre-fetched) | Clio (contextual) | JWT |
| 3.1E | Evangelist Explore | Pre-loaded matches | Pre-loaded cards, no shimmer, Clio Resting | `clusters` (pre-fetched) | Clio (Resting) | JWT |

## Flow 3: Explore (4 screens)

| ID | Screen | Purpose | Key Components | Data Deps | Agent Deps | Permission |
|----|--------|---------|----------------|-----------|------------|------------|
| 3.1 | Explore (First Visit) | Clio-curated discovery | Insight pill, 3 shimmer skeletons, cluster cards (cover, badge, AGGIL chips, insight line, "Why this?"), Clio FAB (Processing) | `clusters`, `cluster_members` | Clio (curation, insights) | JWT |
| 3.2 | Explore (Return Visit) | Populated discovery | My Clusters strip (horizontal scroll), cluster cards, insight pill, "+" Create icon (after 2+ clusters) | `clusters`, `cluster_members` | Clio (curation) | JWT |
| 3.3 | Clio AMA Panel | Discovery calibration | Chat thread, calibration summary card (5 fields), confirm/adjust buttons | `clusters` | Clio (AMA mode) | JWT |
| 3.4 | Explore (Calibrated) | Calibrated results | Active indicator dot on Tune, calibrated insight pill (Relevance/Variety/Balanced), calibrated zero state | `clusters` (filtered) | Clio (curation) | JWT |

## Flow 4: In-Cluster Experience (7 screens)

| ID | Screen | Purpose | Key Components | Data Deps | Agent Deps | Permission |
|----|--------|---------|----------------|-----------|------------|------------|
| 4.0 | Cluster Loading | Transition shimmer | Skeleton cards (3, staggered), shimmer tab bar, Clio FAB (Thinking) | `clusters`, `posts` | Clio (Thinking) | JWT |
| 4.1 | Timeline Tab | Primary cluster surface | Compose bar (dynamic placeholder), mixed feed (member + Sage anchor posts with sage-green border), comments (inline expand, max 1 nesting), non-member read-only view with sticky Join bar, pull-to-refresh, new posts pill | `posts`, `comments`, `post_likes` | Sage (anchor posts), Clio (FAB, tips) | JWT/member |
| 4.2 | Members Tab | Member list + DM entry | Member rows (avatar, nickname, badge, shared interests), action sheet (Stage 1-2: View Profile only; Stage 3: View Profile + Message), DM request flow | `cluster_members`, `profiles` | Clio (FAB) | JWT/member |
| 4.2a | DM Request Flow | First-contact DM | Modal dialog, intro input (150 chars), accept/decline, Connection creation | `dm_threads` | None | JWT (Stage 3) |
| 4.3 | Messages Inbox | Per-cluster DM overview | Pending Requests section (amber accent), Active Threads section, empty state, cross-cluster DM rule (one thread per user-pair) | `dm_threads`, `dm_messages` | None | JWT (Stage 3) |
| 4.4 | Post Composer | Full-screen post creation | Identity row, title field, body (dynamic placeholder), content toolbar (Image/Video/Location/Link), auto-save draft, discard dialog | None | Clio (placeholder) | JWT/member |
| 4.5 | Cluster Info Sheet | Cluster metadata + actions | Bottom sheet (80%), cover image, AGGIL settings (read-only), Precision Score (founder-only), action list (Edit/Notifications/Share/Leave/Report), 10-Member Milestone modal | `clusters` | Clio (milestone) | JWT/member |
| 4.6 | Share Cluster Sheet | Cluster sharing | Mini-preview, share-to row (WhatsApp/Instagram/Twitter/Telegram), copy link, AGGIL eligibility note | `clusters` | Clio (micro, 16px) | JWT/member |

## Flow 5: Cluster Creation (6 screens)

| ID | Screen | Purpose | Key Components | Data Deps | Agent Deps | Permission |
|----|--------|---------|----------------|-----------|------------|------------|
| 5.1 | Initiation | Clio detects unmet need | FAB panel, user message bubble, Clio typing/searching | None | Clio (creation mode) | JWT |
| 5.2 | Similar Clusters | Duplicate detection | Up to 3 similar cluster cards (compact), Join button, "These don't fit" link | `clusters` (search) | Clio (duplicate check) | JWT |
| 5.3 | Disambiguation | Confirm novelty | Clio targeted question, user free-text reply, create/join-back buttons | None | Clio (disambiguation) | JWT |
| 5.4 | Creation Questions | 3 conversational questions | Sequential chat bubbles (Q1: purpose, Q2: locality, Q3: age range), no form, no progress bar | None | Clio (questionnaire) | JWT |
| 5.5 | Brief Confirmation | Review before creation | Brief card (title, tags, who, age, location, purpose), gender constraint (founder pre-selected + lock), age constraint (founder year marker, snap-back), adjust/create buttons | None | Clio (confirmation) | JWT |
| 5.6 | Creation Success | Cluster live confirmation | Modal card (Elevation 3), teal checkmark, "It is live." (no exclamation), Clio voice line, "Take me there" CTA | `clusters` (new) | Clio (success) | JWT |

## Flow 6: Activity Tab (2 screens)

| ID | Screen | Purpose | Key Components | Data Deps | Agent Deps | Permission |
|----|--------|---------|----------------|-----------|------------|------------|
| 6.0 | Activity Locked | Stage 1 — tab absent | No screen — Activity tab simply not in bottom nav (only Explore + You) | None | None | JWT (Stage 1) |
| 6.1 | Activity Feed | Notification centre (Stage 2+) | Sections grouped by time (Today/Yesterday/This Week), row types (cluster activity, Clio match, member joined, timeline update), swipe-to-dismiss, empty state | Aggregated events | Clio (match generation) | JWT (Stage 2+) |

## Flow 7: Profile / You (1 screen)

| ID | Screen | Purpose | Key Components | Data Deps | Agent Deps | Permission |
|----|--------|---------|----------------|-----------|------------|------------|
| 7.1 | You Tab | User profile + settings entry | Profile fields (nickname, YoB, gender, languages, location), settings entry points, Clio FAB | `profiles` | Clio (FAB) | JWT |

## Flow 8: Guided Tour (4 screens)

| ID | Screen | Purpose | Key Components | Data Deps | Agent Deps | Permission |
|----|--------|---------|----------------|-----------|------------|------------|
| 8.1-8.4 | Guided Tour | Clio-narrated UI tour | Tooltips on UI elements, sequential reveal | None | Clio (tour narration) | JWT |

## Flow 9: Shared Invite (4 screens)

| ID | Screen | Purpose | Key Components | Data Deps | Agent Deps | Permission |
|----|--------|---------|----------------|-----------|------------|------------|
| 9.1 | Invite Landing | Invite link landing | Cluster preview, eligibility status | `clusters` | None | None |
| 9.2 | Qualified | AGGIL match confirmed | Success state, signup CTA | `profiles` | None | None |
| 9.3 | Not Qualified | AGGIL mismatch | Explanation, alternative suggestions | None | None | None |
| 9.4 | Sign Up | Auth + auto-join | Auth flow, auto-join on completion | `auth.users`, `profiles`, `cluster_members` | None | None→JWT |

## Flow 10: Settings (1 screen)

| ID | Screen | Purpose | Key Components | Data Deps | Agent Deps | Permission |
|----|--------|---------|----------------|-----------|------------|------------|
| 10.x | Settings | App configuration | Privacy (Clio dwell-time kill switch), Notifications (per-cluster toggles), Account, About | `profiles` | Clio (FAB) | JWT |

## Flow 11: Member Profile (1 screen)

| ID | Screen | Purpose | Key Components | Data Deps | Agent Deps | Permission |
|----|--------|---------|----------------|-----------|------------|------------|
| 11.1 | Member Profile | View another member | Nickname, shared clusters, shared interests, active status | `profiles`, `cluster_members` | None | JWT |

## Flow 12: Admin Dashboard (multi-section)

| ID | Screen | Purpose | Key Components | Data Deps | Agent Deps | Permission |
|----|--------|---------|----------------|-----------|------------|------------|
| 12.x | Admin Dashboard | Platform administration | Critical/High/Medium/Low priority sections, By-Domain view (10 domains), Pending Approvals section | All tables | Observer (findings) | Admin |

---

## State Variants (Every Screen)

| State | Visual Treatment | Clio Behavior |
|-------|-----------------|---------------|
| **Loading** | Shimmer skeletons (#F0FDFA pulse), staggered 100ms cascade | Clio FAB: Processing (M2 eyes scan, glow pulse) |
| **Empty** | Contextual illustration + Clio message (never generic "No results") | Clio Prominent (80px, Curious), speech bubble with specific guidance |
| **Error** | Red inline text, retry button, no attempt counter displayed | Clio acknowledgment, never blames user |
| **Offline** | Cached last-known data, "You're offline" indicator, pull-to-refresh enabled | Clio FAB hidden or Resting (no false promises) |
| **Accessibility** | `role="status"`, `aria-live="polite"`, explicit `aria-label`, focus management, screen reader labels | Never interferes with screen reader announcements |
