# 🏠 PRD 12: Premium Clusters — "Make Your Crowd"

> **A fourth cluster creation path for individuals with existing micro-communities who want a purpose-built home on Aggilo.**
>
> `PRD — Aggilo Social Network`

> [!IMPORTANT]
> **Phase 1 Feature.** Premium Clusters are available from Day 1 via the "Make Your Crowd" tab on the evangelist landing page. They serve as Aggilo's primary cold start supply-side strategy — each approved Premium Cluster Founder seeds 20-50 community members into a purpose-built room, solving the empty-room problem before public launch.

---

## 1. Problem Statement

Aggilo's current cold start strategy relies on:
1. Waitlist signups → users arrive as individuals
2. Scout-seeded clusters → AI-generated content with zero real members
3. Clio suggesting clusters → clusters that may have no human activity

**The structural gap:** All six user archetypes (Masked Social, Transplant, Quietly Evolving, Vibe Scavenger, Ambitious Loner, Spontaneous Connector) are **demand-side** — people *seeking* connection. There is no supply-side archetype: the person who **already has a community** and wants a better home for it.

**The consequence:** New users arrive and see clusters with AI-generated discussion starters but zero real humans. They accurately identify this as a ghost town. Trust collapses before it forms.

**The solution:** Premium Clusters — a credibility-gated creation path for individuals with existing micro-communities. Each approved Founder brings their pre-formed social graph into Aggilo, producing real activity from Day 1.

---

## 2. The Seventh Archetype — The Atomic Crowd Leader

| Dimension | Profile |
|-----------|---------|
| **Identity** | Someone who already influences 10–500 people around a topic — not a traditional "influencer" but a natural convener |
| **Examples** | College senior with an informal study circle · Fitness enthusiast with a 30-person WhatsApp gym group · Local food blogger with 400 followers · Young professional who organizes chai meetups · Teacher creating a space for students |
| **Psychology** | They don't think of themselves as leaders. They think: *"I already have these people. I wish there was a better way to organize around what we care about."* |
| **What they want** | Not followers. Not reach. A **room with walls** — a space that is theirs, that matches their crowd's demographics, and that they can fill from their existing relationships |
| **Cold start value** | Each Atomic Crowd Leader brings 20–50 pre-existing members. 10–20 approved leaders = 200–1,000 users in genuinely active clusters before public launch |

---

## 3. What Makes a Premium Cluster Different

### 3.1 Regular Cluster vs Premium Cluster

| Dimension | Regular Cluster | Premium Cluster |
|-----------|----------------|-----------------|
| **Creation path** | Clio conversational (Phase 1) or Manual Wizard (post-50k) | "Make Your Crowd" application + credibility evaluation |
| **Creator profile** | Any registered user | Individual with an existing community and a credible unmet need |
| **AGGIL constraints** | Optional filters, soft language matching | **Hard location + Hard language** required — the defining features |
| **Evaluation** | Cluster Score (U-shaped) | Cluster Score + **Credibility Evaluation** |
| **Population model** | Wait for Clio, Scout, and organic discovery | Founder **brings their own initial members** via invite |
| **Founder admin rights** | No member removal, no comment deletion | **Full admin rights** — remove members, delete comments, manage content |
| **Governance model** | Clio-enforced platform rules only | Founder-governed with Clio oversight for platform-level violations |
| **Phase 1 availability** | ✅ | ✅ (via landing page "Make Your Crowd" tab) |
| **Cost** | Free | **Free** — "Premium" refers to evaluation standards, not pricing |

> [!WARNING]
> **"Premium" = premium evaluation standards, NOT premium pricing.** This feature is free in Phase 1. Charging before the platform has proven value would kill adoption. The premium is the credibility gate itself — it signals quality without requiring payment.

### 3.2 Premium Cluster Founder Admin Rights

> [!IMPORTANT]
> **This is a significant governance departure from regular clusters.** Regular cluster Founders cannot remove members or delete content (Platform Rules §Membership). Premium Cluster Founders have full admin authority over their cluster because they built and populated it — they are accountable for the community they brought.

| Admin Right | Scope | Constraint |
|------------|-------|-----------|
| **Remove members** | Can remove any member from their Premium Cluster | Removed member is notified neutrally: *"The Founder has adjusted this room's membership."* Member can request reinstatement via Clio. |
| **Delete comments/posts** | Can delete any post or comment in their cluster | Clio logs all deletions for abuse monitoring. Pattern of excessive deletion triggers Clio advisory. |
| **Pin posts** | Can pin important posts to top of Timeline | Max 3 pinned posts |
| **Mute members** | Can temporarily mute members (24h/72h/7d) | Muted member can still read but not post. Clio notifies them. |
| **Appoint Managers** | Can appoint up to 3 trusted members as Managers | Managers assist in reviewing Sage intervention flags and general governance. Founder can revoke status at any time. |
| **Edit cluster settings** | Standard post-spawn rules apply, with one exception: | Founder can tighten demographic settings if all current members still qualify after the change |
| **Recognized Founder status** | Visible Founder badge within the cluster | Clio acknowledges: *"This room was built by someone who brought their people here."* |

**Constraints on Admin Power:**
- Founder admin rights do **not** override platform-level moderation. Clio still enforces content safety rules (threats, CSAM, harassment → platform action, not Founder action).
- If a Founder abuses admin rights (e.g., removing members for disagreement rather than community harm), Clio flags the cluster for platform review.
- Founder cannot transfer admin rights in Phase 1. (Future: delegation to trusted members.)

---

## 4. Hard Location Constraints

Premium Clusters require a **hard location anchor** — the cluster is tied to a real-world place and members must be within that place's zone to participate.

### 4.1 Location Types Supported

| Type | Example | Visibility Rule |
|------|---------|----------------|
| **Named building / landmark** | "IIIT Hyderabad campus" | Visible only to users whose GPS confirms they are at or very near the building |
| **Street / micro-area** | "Road No. 12, Banjara Hills" | Visible to users on or near that street |
| **GPS radius** | "Within 3km of Charminar" | Standard GPS radius model — measured from landmark |
| **Named neighborhood** | "Jubilee Hills" | Visible to users in the neighborhood boundary |
| **Named city** | "Hyderabad" | Visible to all users in the city |

> [!NOTE]
> **Hyper-location is the differentiator.** Unlike regular clusters where geography is an optional filter, Premium Clusters can anchor to locations as specific as a single building. This creates communities that exist in a *place*, not just in an app — directly serving Brand Pillar 4 (Digital-to-Physical Bridge).

### 4.2 Location Rules

| Rule | Detail |
|------|--------|
| **Mutual GPS opt-in** | Both creator and member must share GPS for building/street/radius clusters |
| **Location verification** | Clio verifies that the named location exists and is coherent with the stated community |
| **No location broadening post-spawn** | A building-level cluster cannot be widened to city-level after members join (post-spawn protection) |
| **Location narrowing** | Allowed only if all current members still qualify after the change |
| **Multiple locations** | A Premium Cluster can anchor to up to 3 named locations (e.g., "IIIT Hyderabad + ISB Campus") |

---

## 5. Hard Language Constraints

> [!IMPORTANT]
> **Phase 1 exception for Premium Clusters only.** While regular clusters use language as a soft-match signal in Phase 1, Premium Clusters can enforce **hard language gates** from Day 1. This is because the Founder's existing community already speaks a specific language — the gate reflects reality, not aspiration.

| Rule | Detail |
|------|--------|
| **Hard gate available** | Premium Cluster Founders can require specific language(s) for membership |
| **OR logic** | If multiple languages are hard-gated, user must speak at least one |
| **English does NOT bypass** | A hard Telugu gate means English-only speakers cannot see the cluster |
| **Post-spawn immutable** | Language gates cannot be tightened after members join |
| **Loosening allowed** | Adding additional accepted languages is permitted (expands, doesn't restrict) |

---

## 6. Credibility Evaluation Framework

### 6.1 The Core Evaluation Question

> *"Could this person's need be met by an existing platform (WhatsApp group, Discord server, Instagram community, Telegram channel)? If yes — why do they believe Aggilo serves them better?"*

### 6.2 Credibility Scoring Dimensions

| Dimension | Weight | What It Measures | Signal Source |
|-----------|--------|-----------------|---------------|
| **Existing Community Evidence** | 30% | Does this person actually have people to bring? | Self-reported size + willingness to share invite link |
| **Unmet Need Specificity** | 25% | Is the need genuinely unserved by existing platforms? | Free-text explanation evaluated by Clio |
| **Demographic Coherence** | 20% | Do the AGGIL constraints match a real, identifiable group? | Location + age + language alignment with stated community |
| **Platform Fit** | 15% | Does what they want align with Aggilo's soul — connection, not broadcasting? | Clio behavioral assessment of described activities |
| **Commitment Signal** | 10% | Will they actually follow through on populating the cluster? | Form completion quality + specificity of timeline answers |

### 6.3 Credibility Score — Internal Only

> [!IMPORTANT]
> **The credibility score is NEVER shown to the applicant.** The applicant experiences Clio's coaching messages ("This is looking strong" / "Tell me more about what's broken") — not a percentage. The evaluation should feel like a conversation with Clio, not a test.

### 6.4 Approval Tiers

| Tier | Score Range | Response | Timeline |
|------|-----------|----------|----------|
| **Approved** | 70%+ | Clio: *"Your room is ready. Here's your invite link. Go fill it."* | Within 48 hours |
| **Needs Clarification** | 40–70% | Clio: *"I have a few more questions before I build your room."* → async follow-up | Within 72 hours |
| **Redirected** | <40% | Clio: *"I think what you're looking for might already exist on Aggilo. Let me find the right frequency for you instead."* → regular onboarding | Within 48 hours |

**No rejection language.** Low-credibility applicants are **repositioned** as users who would benefit from the regular discovery path, not told they failed an evaluation.

### 6.5 Examples

| ✅ Approved | Why |
|------------|-----|
| "I run a study group for 25 GATE aspirants in Hyderabad. We use WhatsApp but it's chaos — topics get lost in the scroll. I need a space where we can discuss by topic." | Clear community (25 people), named platform pain (WhatsApp topic loss), specific location, specific purpose |
| "I mentor 15 women in early careers in Bengaluru. They speak Kannada. There's nothing like this for us." | Existing mentoring relationship, language-specific need, demographic coherence, genuine gap |
| "Our Telugu film appreciation circle (40 people) has outgrown our Telegram group. We need threads, not chat." | Large existing community, named platform limitation, specific content format need |
| "I organize weekend chess meetups at Necklace Road. 30 regulars. No good way to coordinate timing." | Offline community with digital coordination gap, specific hyper-location |

| ❌ Redirected | Why |
|--------------|-----|
| "I want to make a fitness group" | No existing community, no specificity, generic need met by countless apps |
| "I want to be a community leader" | Supply-side aspiration without demand evidence |
| "Let me test this app with my friends" | No genuine community need — this is an explorer, better served by regular onboarding |
| "I want a cool club for cool people" | No unmet need, no demographic coherence, no platform gap |

---

## 7. "Make Your Crowd" Form — Landing Page Tab

### 7.1 Placement

New tab in the existing Clio Interaction Card on the evangelist landing page:

```
┌───────────────────────────────────────────────┐
│  [👤 Join Aggilo]   [🏠 Make Your Crowd]      │
│  ─────────────────────────────────────────────  │
│                                                 │
│  (Tab content changes based on selection)       │
│                                                 │
└───────────────────────────────────────────────┘
```

- **"Join Aggilo"** = Existing waitlist form (name → interests → situation → motivation → email)
- **"Make Your Crowd"** = Premium Cluster application form (below)

### 7.2 Form Steps

#### Step 1: The Hook
**Clio says:** *"You already have your people. Tell me about them."*

| Field | Type | Required | Internal Purpose |
|-------|------|----------|-----------------|
| "What do you do together?" | Textarea (2–3 sentences) | ✅ | Activity/interest core → cluster purpose |
| "How many people are we talking about?" | Number input | ✅ | Community size → existing community evidence |

**Clio coaching:** If number < 5: *"Small but mighty. Let me hear more about what you need."* If number ≥ 20: *"That's a real community. Let's give them a proper home."*

---

#### Step 2: The Need
**Clio says:** *"And where do you connect right now? Be honest — I need to know what's not working."*

| Field | Type | Required | Internal Purpose |
|-------|------|----------|-----------------|
| "Where do you connect right now?" | Multi-select chips: `WhatsApp` · `Telegram` · `Discord` · `Instagram` · `Offline only` · `Other` | ✅ | Real community evidence — if they use a platform, they have real people |
| "What's broken about it?" | Textarea (2–3 sentences) | ✅ | **The credibility core.** Clear articulation of platform pain = genuine unmet need |

**Clio coaching after "What's broken":**
- If answer is specific and actionable: *"That's exactly the kind of problem I was built to solve."*
- If answer is vague or generic: *"Can you tell me more? The more specific you are, the better the room I can build."*

---

#### Step 3: The Demographic
**Clio says:** *"Let me understand who these people are — so I can build the right room."*

| Field | Type | Required | Internal Purpose |
|-------|------|----------|-----------------|
| "Where are they located?" | Location input — supports: building name, street name, neighborhood, city, OR GPS pin + radius | ✅ | Hard location constraint definition |
| "What language(s) do you speak together?" | Language chips (auto-detected from browser + manual add) | ✅ | Hard language constraint definition |
| "Age range of your group" | Range slider (defaults to ±5 from detected/stated age) | ✅ | AGGIL age configuration |
| "Gender mix" | Chips: `Everyone` · `Mostly men` · `Mostly women` · `Mixed specific` | Optional | AGGIL gender configuration |

**Location input behavior:**
- Free text field with autocomplete suggestions
- Accepts: "IIIT Hyderabad", "Road 12, Banjara Hills", "Jubilee Hills", "Hyderabad", etc.
- If GPS pin is dropped: show radius selector (500m / 1km / 3km / 5km / 10km)
- If named location: Clio resolves to coordinates + reasonable boundary

---

#### Step 4: The Commitment
**Clio says:** *"Last thing. If I build this room for you — how fast can you fill it?"*

| Field | Type | Required | Internal Purpose |
|-------|------|----------|-----------------|
| "How would you invite your people?" | Multi-select chips: `Share link via WhatsApp` · `Post in existing group` · `Tell them in person` · `Social media post` · `Other` | ✅ | Commitment signal + readiness assessment |
| "When could you have your first 10 people here?" | Chips: `This week` · `Within 2 weeks` · `Within a month` · `Not sure` | ✅ | Time-to-activation signal |

---

#### Step 5: Contact
**Clio says:** *"I'm going to evaluate this personally. Give me a way to reach you."*

| Field | Type | Required | Internal Purpose |
|-------|------|----------|-----------------|
| "Your name" | Text input | ✅ | Creator identity |
| "Email" | Email input | ✅ | Primary contact channel |
| "Phone (optional)" | Phone input | Optional | Priority contact for high-credibility applications |

---

#### Confirmation
**Clio says:** *"I've got everything. I don't build rooms carelessly — give me a little time to make sure yours will be right. I'll reach out within 48 hours."*

```
div.pf-confirm-box
  div.pf-confirm-icon "🏠"
  p.pf-confirm-msg "You're in the queue. I'm reviewing this personally.
                     Expect to hear from me within 48 hours. 💫"
```

---

## 8. Post-Approval Flow

```
Application Submitted
  │
  ├── Clio automated credibility scoring (immediate)
  │
  ├── Founder manual review for top applications (within 48h)
  │
  └── Decision
        │
        ├── APPROVED (70%+):
        │     → Email from Clio: "Your room is ready."
        │     → Pre-created cluster with Founder's AGGIL settings
        │     → Hard location + hard language gates active
        │     → Founder receives unique invite link
        │     → Invite link → custom onboarding:
        │         Invitee clicks link → sees cluster preview (name, purpose, member count)
        │         → Simplified registration (phone OTP → birth year → nickname)
        │         → Auto-joined to cluster immediately after registration
        │     → Founder gets admin panel with member management tools
        │
        ├── NEEDS CLARIFICATION (40-70%):
        │     → Email from Clio: "I have a few more questions."
        │     → Async follow-up (email thread or in-app when they register)
        │     → Decision after follow-up
        │
        └── REDIRECTED (<40%):
              → Email from Clio: "I think I can find something better for you."
              → Links to regular waitlist/onboarding
              → Positioned as "your need is already served" — never as rejection
```

### 8.1 Custom Invite Link Onboarding

When a Premium Cluster Founder shares their invite link, the invitee experiences a streamlined onboarding:

1. **Cluster preview** — Name, purpose, member count, Founder recognition
2. **Simplified registration** — Phone OTP → birth year + gender → language → nickname
3. **AGGIL gate check** — Must pass the cluster's hard constraints (location, language, age, gender)
4. **Auto-join** — Immediately placed in the cluster after registration
5. **Clio greeting** — *"Welcome. [Founder nickname] built this room for people like you. Take a look around."*

---

## 9. Impact on Existing Platform Rules

### 9.1 Rules That Apply Unchanged to Premium Clusters

| Rule | Status |
|------|--------|
| OTP authentication | ✅ Applies |
| Nickname-only identity | ✅ Applies |
| AI content moderation (threats, CSAM, harassment) | ✅ Applies — overrides Founder admin |
| No deletion of clusters | ✅ Applies |
| Age progression over time | ✅ Applies |
| Post-spawn expansion rules (can add tags, not remove) | ✅ Applies |

### 9.2 Rules Modified for Premium Clusters

| Regular Rule | Premium Cluster Override | Rationale |
|-------------|------------------------|-----------|
| **No member removal** | Founder can remove members | Founder brought these people — they are accountable for the community's health |
| **No content deletion by creators** | Founder can delete posts/comments | Same accountability principle |
| **Language is soft match (Phase 1)** | Hard language gate active from Day 1 | The existing community already speaks specific language(s) — the gate reflects reality |
| **Geography is optional** | Hard location required | Premium Clusters are anchored to real places by definition |
| **No Founder special status** | Recognized Founder with admin badge | The person who built and populated the cluster deserves visible stewardship |

### 9.3 New Platform Rule — Premium Cluster Governance

> **Premium Cluster Governance Principle:** A Premium Cluster Founder has earned admin authority by demonstrating a credible community need and populating their cluster with real members. This authority is a stewardship responsibility, not an ownership privilege. Platform-level moderation (threats, CSAM, harassment) always supersedes Founder admin actions. Abuse of admin rights triggers platform review and potential revocation of admin status — not cluster deletion.

---

## 10. Data Schema (Supabase Additions)

| Table | Column | Type | Notes |
|-------|--------|------|-------|
| `clusters` | `is_premium` | `boolean` | `false` default — `true` for credibility-approved clusters |
| `clusters` | `credibility_score` | `float` | Internal only — never exposed to users |
| `clusters` | `hard_location_type` | `enum('building','street','neighborhood','city','gps_radius')` | Premium clusters only |
| `clusters` | `hard_location_data` | `jsonb` | Coordinates, radius, or named boundary |
| `clusters` | `hard_language_gate` | `text[]` | Array of required languages — `null` for soft-match clusters |
| `premium_applications` | `*` | Various | Full application data, scoring dimensions, review status |
| `cluster_admin_actions` | `*` | Various | Audit log: member removals, content deletions, mutes |

---

## 11. Metrics & Success Criteria

| Metric | Target | Why It Matters |
|--------|--------|---------------|
| **Applications submitted** | 50+ pre-launch | Pipeline for cold start seeding |
| **Approval rate** | 30–50% | Quality bar is real — not everyone qualifies |
| **Members per approved cluster (30 days)** | ≥15 | Founder actually populated their cluster |
| **Cluster activity rate** | ≥3 posts/week at 30 days | The community is alive, not dormant |
| **Invitee → registered conversion** | ≥60% | The invite link onboarding is frictionless |
| **Regular user exposure to Premium Clusters** | ≥80% see one in Explore | Premium clusters provide social proof for all users |

---

## 12. Relationship to Existing PRDs

| PRD | Impact |
|-----|--------|
| [PRD 02 — Cluster Creation](02_cluster_creation.md) | Add "Path 4: Premium Cluster Application" to the creation flowchart |
| [PRD 03 — Cluster Discovery](03_cluster_discovery.md) | Premium Clusters appear in Explore with real activity — prioritized in AGGIL ranking |
| [PRD 04 — In-Cluster Experience](04_in_cluster_experience.md) | Founder admin tools (remove member, delete content, pin, mute) need UI spec |
| [PRD 07 — Moderation](07_moderation_admin.md) | Founder admin actions are logged and monitored — add admin abuse detection rules |
| [AGGILO_PLATFORM_RULES.md](../AGGILO_PLATFORM_RULES.md) | Add Premium Cluster governance section with modified rules |
| [Landing Page Spec](../launch/AGGILO_V3_REBUILD_SPEC.md) | Add "Make Your Crowd" tab to the Clio Interaction Card |

---

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `POST /api/premium-cluster/apply` | POST | Submit "Make Your Crowd" application |
| `GET /api/premium-cluster/status/{id}` | GET | Check application review status |
| `POST /api/premium-cluster/review` | POST | Admin: approve/clarify/redirect an application |
| `POST /api/cluster/{id}/admin/remove-member` | POST | Founder: remove a member (Premium clusters only) |
| `DELETE /api/cluster/{id}/admin/content/{postId}` | DELETE | Founder: delete a post/comment (Premium clusters only) |
| `POST /api/cluster/{id}/admin/mute/{nickname}` | POST | Founder: mute a member (Premium clusters only) |
| `POST /api/cluster/{id}/admin/pin/{postId}` | POST | Founder: pin a post (Premium clusters only) |
| `GET /api/cluster/{id}/admin/audit-log` | GET | Founder: view admin action history (Premium clusters only) |

---

*← [LLM Admin Routing](11_llm_admin_routing.md) · [PRD Index →](00_prd_index.md)*
