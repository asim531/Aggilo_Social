# Aggilo Platform Rules & Guidelines

> **Aggilo** is an AI-native social network that creates interest-based micro-communities ("clusters") segmented by the **AGGIL** engine — **A**ge, **G**ender, **G**eography, **I**nterest, **L**anguage. This document is the single source of truth for all platform rules.

---

## 🧬 AGGIL ENGINE RULES

### Age (Year-of-Birth-Based Dynamic System)

| Rule | Detail |
|------|--------|
| **Year of Birth is source of truth** | Age limits derived from year of birth, not static numbers |
| **Immutable Year of Birth** | Once set during registration, year of birth cannot be changed |
| **Cluster ages up** | The cluster's age range shifts up as the years pass. A cluster for 25-35 year olds will automatically become a 35-45 year old cluster 10 years later. |
| **No aging out for creators** | A creator never ages out of their own cluster |
| **Manual or AI-suggested** | Creator sets age range manually OR AI auto-suggests based on year of birth (e.g., ±5 years) |
| **Agent evolves topics** | Scout adapts topic suggestions as members' ages change |
| **Minimum age** | Users must be 18+ to register (DPDPA compliance for Phase 1 college launch) |

### Gender

| Rule | Detail |
|------|--------|
| **Three options** | Male, Female, Non-Binary |
| **Default: Anyone** | Clusters open to all genders by default |
| **Flexible restriction** | Creator can restrict to any single gender, any combination of two genders, or all genders. A creator cannot exclude their own gender from a cluster they create. |
| **Visibility rule** | Users can only see clusters that include their gender in the cluster's gender setting. A "Male only" cluster is invisible to Female and Non-Binary users. A "Male + Non-Binary" cluster is invisible to Female users. An "All" cluster is visible to everyone. |
| **Immutable Gender** | Once set during registration, Gender cannot be changed |

### Geography (Three-Tier Location System)

| Mode | Example | Visibility Rule |
|------|---------|----------------|
| **Named locations** | Hyderabad + Bangalore | Visible to all users in those cities |
| **Regional scope** | Telangana, or India | Visible to all users in that region |
| **GPS + Landmark Range** | Within 10km of Charminar | Visible ONLY if both creator AND visitor share GPS AND visitor is within range |

**GPS Rules:**
- GPS sharing is **optional** — never required at registration
- GPS clusters require **mutual opt-in** — both parties must share GPS
- Range is measured from a **fixed landmark**, NOT from any user's live position
- **No creator privileges:** Any user (including the creator) must be physically within the GPS range to discuss in the cluster
- Users who don't share GPS simply cannot see GPS-gated clusters

**GPS Cluster Aging Rule:**
- Some GPS clusters are context-dependent (e.g., a cluster created near a college campus for 18–22 year-olds). Over time, the cluster's aging age range may no longer match the physical location's demographic.
- **Clio may intelligently transform a GPS cluster to a non-GPS cluster** when the location-bound demographic has demonstrably shifted (e.g., college/school clusters where the original cohort has graduated and moved). This is not automatic — Clio evaluates relevance based on cluster activity, member demographics, and location context.
- When transformation occurs, Clio notifies all current members: *"This cluster has grown beyond its original location. It's now discoverable by anyone in your demographic — not just people near [landmark]."*
- This rule applies only to location-sensitive clusters (e.g., campuses, schools) — not to general-purpose GPS clusters (e.g., neighbourhood meetups).

### Interest

| Rule | Detail |
|------|--------|
| **Multiple tags** | Clusters can have multiple interest tags |
| **Predefined + Custom** | Select from predefined categories or add custom tags |
| **No privacy gating** | Interest tags improve discoverability, never restrict access |
| **AI-enhanced** | Scout suggests trending interests based on AGGIL segment trends |

### Language — 🌟 Hero Feature

> [!IMPORTANT]
> **Language is elevated to a hero feature in AGGIL.** It is positioned at 2nd or 3rd priority in the AGGIL configuration, and featured prominently in discovery, cluster suggestions, and marketing. Language is one of the strongest signals for community fit — especially in India's multilingual landscape.

| Rule | Detail |
|------|--------|
| **Primary + Secondary** | Users set language preferences during registration |
| **Auto-detected** | Pre-populated from phone settings |
| **Cluster visibility (Phase 1)** | Language is a soft-match signal — clusters surface to users who share at least one language; no hard gate in Phase 1 |
| **Multi-language clusters** | A single cluster can support multiple languages |
| **English default** | English is always an implicit soft match unless a future hard gate is set |
| **Hard/soft gate (Future)** | A per-cluster hard gate can be set for specific languages — requires the language to be spoken for eligibility. OR logic applies when multiple hard languages are set. This feature activates in a later phase when platform adoption supports the added cognitive complexity. |
| **Hero positioning** | Language appears at 2nd or 3rd position in AGGIL settings UI. Clio proactively surfaces language context in cluster recommendations (e.g., *"This cluster mostly speaks Telugu — you'll feel at home."*) |

### AGGIL Privacy Hierarchy

Checks are applied in order. Any failure = cluster INVISIBLE:

```
1. Gender mismatch → INVISIBLE
2. Age out of range → INVISIBLE
3. GPS not shared (when cluster uses GPS mode) → INVISIBLE
4. GPS shared but out of landmark range → INVISIBLE
5. Language hard gate (future phase — when feature ships) → INVISIBLE if user does not speak any of the hard-gated languages
6. All checks pass → VISIBLE & JOINABLE
```

> **Phase 1 note:** Step 5 (Language hard gate) is not active in Phase 1. Language is a soft matching signal only — clusters are never invisibly blocked by language in the initial release.

---

## 👤 USER IDENTITY RULES

| Rule | Detail |
|------|--------|
| **Nickname identity** | Users are identified by nickname only across all clusters, posts, DMs, and chat. Real names are never exposed to other users. |
| **Real name collection (Future)** | Real name collection and a verification mark (✓) are on the roadmap for a future phase, following a defined verification process. No timeline set. When introduced, real name will only surface as a verification indicator — it will not replace the nickname in the UI. |
| **Uniqueness** | Nicknames must be unique across the entire platform |
| **AI-verified** | All nicknames checked for appropriateness by AI before acceptance |
| **3-20 characters** | Alphanumeric with underscores/hyphens only |
| **Limited changes** | Nickname can be changed but with restrictions (prevents abuse) |
| **Consistency** | Same nickname used across all clusters, posts, DMs, and chat |
| **No profile photos required** | Avatar/photo is optional |

---

## 🔵 CLUSTER RULES

### Creation

| Rule | Detail |
|------|--------|
| **Unlimited creation** | Any user (free or premium) can create unlimited clusters |
| **Three creation paths** | Manual 4-step wizard, Clio conversational, or Scout auto-creation |
| **Duplicate check required** | Before ANY cluster creation, system checks for similar existing clusters |
| **Age self-inclusion** | Creator's own age MUST fall within the cluster's age range — a 30-year-old cannot create an 18-25 cluster |
| **Gender self-inclusion** | Creator's own gender MUST match the cluster's gender filter if restricted — a Male cannot create a Female-only cluster |
| **Default age = creator year** | Age slider defaults to creator's own birth year; creator widens range as desired |
| **Filters are optional** | AGGIL filters (Age, Gender, Geography, Language) are available as **advanced settings** — not required for cluster creation. A cluster can be created with just a topic, name, and description. |
| **Clio decides defaults** | When creating via Clio conversation, filter defaults are **Clio's decision** based on the user's demographics, stated interests, and interaction context — not a blanket "open to all" default. Clio may suggest narrow or wide settings depending on the cluster's purpose. |

### Cluster Score (U-Shaped Intentionality Model)

> [!IMPORTANT]
> **U-Shaped Scoring — Founder Decision:** The Cluster Score rewards **intentionality**, not just specificity. Both extremes of the spectrum — hyper-narrow AND fully global — score HIGH, because both reflect a clear, deliberate purpose. The muddled middle scores LOW, because it reflects unclear thinking that makes it harder for Clio to deliver value.

**The U-Shaped Curve:**

| Cluster Type | Score Zone | Why It Works | Clio's Behaviour |
|-------------|-----------|-------------|-----------------|
| **Hyper-narrow** (e.g., born 1990, male, Pune, Telugu, badminton) | 🟢 **HIGH** | Extreme specificity = precise targeting. The creator knows exactly who they want. | Delivers hyper-relevant content, deep connections, niche community feel |
| **Fully global** (e.g., all ages, all genders, worldwide, all languages) | 🟢 **HIGH** | Maximum openness = variety and serendipity. The creator wants the broadest possible conversation. | Delivers diverse content, cross-cultural possibilities, wide discovery |
| **Mediocre middle** (e.g., 25-40, male+female, India, English, fitness) | 🔴 **LOW** | Neither specific enough to target nor broad enough for variety. Unclear purpose. | Clio can't differentiate — content and suggestions also go mediocre |

**Score Factors:**

| Factor | Weight | What Earns the Score |
|--------|--------|----------------------|
| **Purpose Clarity & Vibrant Tags** | 30% | Clear, specific purpose + 3+ emotional/interest tags that tell a story |
| **Intentionality Signal** | 25% | U-shaped: hyper-narrow OR fully open settings both score high; vague middle scores low |
| **Name & Description Quality** | 20% | AI-assessed for clarity, uniqueness, and emotional resonance |
| **Clio Confidence** | 25% | How confidently Clio can serve this cluster — can she find the right people AND the right content? |

**Gamified Creator Experience:**

The score is designed to **encourage**, not explain. The user should feel motivated to be deliberate — Clio guides them toward intentional choices without revealing the scoring mechanics.

- Maximum possible: **100.00%**
- Score is **visible during creation** as a live animated bar with count-up number — feels like levelling up
- Score is **visible to the cluster Founder** on the Cluster Info sheet (with "Only you can see this" note)
- Score is **NOT visible** on cluster cards in Explore/Search/Dashboard — used internally for ranking and suggestions
- Higher-scored clusters rank first in search results and AGGIL suggestions
- Color coding: 🔴 0-40% | 🟡 40-70% | 🟢 70-100%
- 🔥 flame icon appears **only** in the creation wizard's Live Precision Score display and Founder-only Cluster Info sheet — never on cluster cards

**Clio's Score Coaching (gamified prompts, not algorithm explanations):**

| Score Zone | Clio's Response |
|-----------|----------------|
| 🔴 Low (0-40%) | *"This feels like it could be anything. What if you went sharper — or wider? Both work. The middle doesn't."* |
| 🟡 Medium (40-70%) | *"Getting there. You're close to something specific — push it further and I'll find exactly the right people."* |
| 🟢 High (70-100%) | *"Now we're talking. I know exactly who to look for."* |
| 🟢🔥 Exceptional (90%+) | *"This is going to be a great cluster. I already have ideas for who should be here."* |

> The creator never sees weights, formulas, or factor breakdowns. They see the score going up as they make intentional choices, and Clio's commentary reinforces good decisions. The gamification is in the **feedback loop**, not the mechanic.

### Membership

| Rule | Detail |
|------|--------|
| **Unlimited members** | No minimum or maximum member count |
| **Unlimited joins** | Users can join unlimited clusters |
| **Age self-inclusion (join)** | Users cannot join clusters outside their own age range — enforced at AGGIL visibility + invite link gate |
| **No member removal** | Creators/founders cannot remove members from clusters |
| **Leave freely** | Users can leave any cluster at any time |
| **Rejoin freely** | Users can rejoin any cluster they previously left (no cooldown) |
| **Founder status** | Creator is auto-joined as Founder; AI-created clusters have no founder until first active member claims it |

### Persistence

| Rule | Detail |
|------|--------|
| **No deletion** | Once created, clusters persist forever |
| **No archiving by creators** | Clusters cannot be archived or hidden by their creators. Admin-level archiving is permitted based on real-world moderation needs (see PRD 07). |
| **Age progression** | The cluster's age bounds shift as the years progress (e.g. a 20-30 cluster becomes 30-40 after 10 years) |
| **Dormant clusters** | Inactive clusters remain discoverable and joinable |

### Editing (Post-Spawn)

Once a cluster has at least one member, the Founder enters the **post-spawn refinement window**. The governing rule applies to all edits: **no change may retroactively harm, eject, or disadvantage a member who joined in good faith.**

| Property | Allowed? | Rule |
|----------|----------|------|
| Description text & tone | ✅ Yes | No restriction |
| Seed questions | ✅ Yes | Full rewrite permitted |
| Interest tags — add or broaden | ✅ Yes | Can only expand, never restrict, discoverability |
| Cluster name | ✅ Yes | Clio notifies existing members of the rename |
| Interest tags — narrow or remove | ❌ No | Disadvantages members who joined for those tags |
| Age range — tighten | ❌ No | Retroactively excludes current members |
| Gender filter — add restriction | ❌ No | Cannot be applied to a cluster members joined as open |
| Core topic pivot | ❌ No | Changes the identity members originally agreed to |
| Geographic scope — tighten | ❌ No | May exclude members in previously valid zones |

> Clio enforces these rules automatically. Disallowed changes are blocked with a one-time member-protection explanation and an offer of permitted alternatives. Pre-spawn (before the first member joins), all parameters remain fully editable.

> [!IMPORTANT]
> **Language Hard Gate — Future Feature:** When language hard gates ship as a per-cluster feature, they can only be applied to **newly created clusters**. Founders who want a hard language gate on a topic that already has a cluster must create a new cluster with the gate enabled. A cluster is defined by its AGGIL parameters — even a single parameter difference (including a language gate) means a different cluster. Retroactive activation of a language hard gate on an existing cluster is prohibited under the post-spawn protection principle.



### AI-Created Clusters

| Rule | Detail |
|------|--------|
| **No AI badge** | Scout-created clusters appear identically to user-created clusters. Clio's icon and message are the only editorial signal when she speaks inside a cluster — no label, no distinction. |
| **Relevance threshold** | Auto-creation only when relevance score ≥ 90% |
| **Below 90%** | Shown as suggestion cards — user decides whether to create |
| **Duplicate injection** | If a similar cluster already exists, trending topic is added as discussion to existing cluster instead |
| **No founder claim** | Connecting the right people online is the goal. All members of an AI-created cluster are equal participants from the moment they join. |
| **Pre-seeded discussions** | AI-created clusters are seeded with 3-5 discussion starters |

### Premium Clusters ("Make Your Crowd") — Phase 1

> [!IMPORTANT]
> **Premium Clusters are a distinct cluster tier** for individuals with existing micro-communities. They solve the cold start problem by enabling Atomic Crowd Leaders — people who already have 10–500 people around a topic — to bring their pre-formed communities into Aggilo. "Premium" refers to the **evaluation standard**, not pricing. This feature is free in Phase 1. Full specification: [`PRD/12_premium_clusters.md`](PRD/12_premium_clusters.md).

| Rule | Detail |
|------|--------|
| **Creation path** | "Make Your Crowd" application on the landing page → Clio credibility evaluation → manual founder review → approval |
| **Credibility evaluation** | Assessed on: existing community evidence (30%), unmet need specificity (25%), demographic coherence (20%), platform fit (15%), commitment signal (10%). Score is **internal only** — never shown to applicant. |
| **Hard location required** | Premium Clusters must anchor to a real-world location: building name, street name, neighborhood, GPS landmark + radius, or named city. Members must be within that zone. |
| **Hard language gate (Phase 1)** | Unlike regular clusters where language is a soft signal in Phase 1, Premium Clusters can enforce hard language gates from Day 1. The existing community already speaks specific language(s) — the gate reflects reality. |
| **Founder admin rights** | Premium Cluster Founders have full admin authority: remove members, delete posts/comments, pin posts (max 3), mute members (24h/72h/7d). All admin actions are logged for platform monitoring. |
| **Founder recognition** | Visible Founder badge within the cluster. Clio acknowledges: *"This room was built by someone who brought their people here."* |
| **Platform moderation override** | Platform-level moderation (threats, CSAM, harassment) always supersedes Founder admin actions. Clio enforces this automatically. |
| **Admin abuse monitoring** | If a Founder abuses admin rights (e.g., removing members for disagreement rather than community harm), Clio flags the cluster for platform review. |
| **No pricing in Phase 1** | Premium Clusters are free. The "premium" is the credibility gate itself. |
| **Invite link onboarding** | Approved Founders receive a unique invite link → invitees see cluster preview → simplified registration → auto-join to cluster |

**Rules modified for Premium Clusters vs Regular Clusters:**

| Regular Cluster Rule | Premium Cluster Override |
|---------------------|------------------------|
| No member removal | ✅ Founder can remove members |
| No content deletion by creators | ✅ Founder can delete posts/comments |
| Language is soft match (Phase 1) | ✅ Hard language gate active from Day 1 |
| Geography is optional | ✅ Hard location required |
| No Founder special status | ✅ Recognized Founder with admin badge |

> **Premium Cluster Governance Principle:** A Premium Cluster Founder has earned admin authority by demonstrating a credible community need and populating their cluster with real members. This authority is a stewardship responsibility, not an ownership privilege. Abuse of admin rights triggers platform review and potential revocation of admin status — not cluster deletion.

---

## 💬 IN-CLUSTER EXPERIENCE RULES

> **Terminology:** All cluster participants are referred to as **"members"** throughout the platform. A member who has accepted a DM or connection request from another member becomes a **"Connection"** — this term signals a deeper, reciprocal relationship within the community.

### Timeline Tab (Instagram-Style)

| Rule | Detail |
|------|--------|
| **Content types** | Text posts, images (Phase 1); video, polls, events (Phase 2+) |
| **Chronological feed** | Posts shown newest-first within each cluster |
| **Reactions** | Like, comment, share within cluster context |
| **No algorithmic ranking** | MVP uses chronological order, no engagement-based sorting |

### Chat Tab (WhatsApp-Style) — Future Phase

> [!NOTE]
> The Chat Tab is deferred to a future phase. In Phase 1, all real-time communication happens via DMs (after a DM request/accept flow that establishes a Connection). When two members become Connections through DM acceptance, they gain full chat capability in their DM thread.

| Rule | Detail |
|------|--------|
| **Real-time messaging** | WebSocket-powered instant messaging |
| **All members participate** | Group chat open to all cluster members |
| **Nickname-only** | All messages display sender's nickname |
| **No message deletion by others** | Only the sender can delete their own messages |

### Direct Messaging (DM) — Request/Accept System

> [!IMPORTANT]
> **No cold DMs.** All first-time DMs between users who haven't previously messaged each other go through a **request/accept** flow. The recipient sees the request with the sender's nickname and shared cluster context. They can accept, decline, or ignore. Accepted requests open a full DM thread. This prevents unsolicited messaging between strangers.

| Rule | Detail |
|------|--------|
| **Available to all users** | Free and premium users can send DM requests |
| **Request/accept required** | First DM to any user requires acceptance — no cold messaging |
| **Request context** | DM requests show the sender's nickname + the cluster they share — recipient sees why they're being contacted |
| **Accepted = open thread** | Once accepted, the DM thread is open for ongoing conversation (no re-approval needed) |
| **Decline/ignore** | Recipient can decline (sender notified neutrally: *"They're not available right now"*) or ignore (no notification to sender) |
| **Context** | DMs initiated from within cluster context (tap nickname → message) |
| **Nickname-only** | DMs display nicknames, never real identity |

### Passive User Experience

| Rule | Detail |
|------|--------|
| **Lurking is valid** | Users can browse clusters, read posts and chat without posting |
| **No engagement pressure** | Platform never penalizes passive users |
| **Content still surfaced** | AI suggestions work based on stated interests, not posting activity |

---

## 🤖 AI AGENT RULES

### Scout Agent (Background Worker)

| Rule | Detail |
|------|--------|
| **Trigger** | Scheduled every 6 hours (frequency varies by segment size) |
| **Data source** | Aggregate internet trends (Google, Reddit, Twitter, news) — NOT personal browsing |
| **Privacy guarantee** | Scout analyzes what similar demographics are doing broadly, never individual user behavior |
| **Input** | User's stated profile preferences (year of birth, gender, location, interests, languages) |
| **Output** | Auto-created clusters (≥90%), suggestion cards (<90%), discussion injections (duplicates) |
| **Crawl priority** | Large segments (100+ users): every 6h / Medium (20-99): every 12h / Small (<20): every 24h / Premium users: every 6h (priority) |
| **Technology** | Data Acquisition Layer (Tier 1: structured APIs · Tier 2: SerpApi/Serper search proxies · Tier 3: Firecrawl/BrightData managed scraping). NEVER direct Puppeteer/Playwright crawling. Runs as a BullMQ worker on the Node.js Agent Runtime (Railway). LLM per [`11_llm_admin_routing.md`](PRD/11_llm_admin_routing.md) (initial default: Llama 3 on Groq). See `architecture/system_implementation_prompt_part1.md` §2.5 for the full prohibition. |

### Clio Agent (Conversational Assistant)

| Rule | Detail |
|------|--------|
| **Trigger** | User-initiated chat OR proactive stuck-moment behaviors |
| **Capabilities (Free)** | Ongoing individual presence, conversational cluster creation, platform questions, cluster search, proactive tips, activity summaries |
| **Capabilities (Premium)** | All free features + persistent conversations, preference learning, people suggestions |
| **Duplicate enforcement** | Clio MUST check for similar clusters before creating new ones |
| **Context injection** | Every Clio response uses: user's AGGIL profile, joined clusters, interests, platform rules, existing clusters |
| **Technology** | LLM per [`11_llm_admin_routing.md`](PRD/11_llm_admin_routing.md) (initial default: Kimi K2.5 via NVIDIA NIM) — routed through the Node.js Agent Runtime + Redis-backed BullMQ queue (lane: `clio-high`) |
| **Tone** | Helpful, conversational, never pushy — suggests but never forces |
| **Presence level** | User-configurable: Minimal (FAB only) / Moderate (default, contextual tips + idle nudges) / Active (proactive insights, summaries, encouragement) |
| **Proactive triggers** | Empty dashboard, zero search results, creation paused >30s, first visit to Explore/cluster, idle >15s on Clio-enabled screen |
| **Visual identity** | Peach mochi-sphere creature character with teal stubs — rendered as canvas animations in-app (see `clio/SOUL.md` for full visual spec) |
| **FAB position (cluster screens)** | TOP-RIGHT — 40px circle, 16px from edge, 8px below the cluster top bar. Panel expands downward-leftward. Header reads "Clio · Private" with TTL timer. **Outside clusters (Explore, Activity, Settings):** bottom-right, 48px (legacy position). See [`clio/CLIO_UNIFIED_CLUSTER_PRESENCE.md`](clio/CLIO_UNIFIED_CLUSTER_PRESENCE.md). |
| **Unified presence** | One Clio. Storage differs by context: persistent outside clusters (Supabase), ephemeral inside clusters (Redis, 12h TTL). The user never chooses between modes — the platform decides invisibly. |

### @Sage — Direct Member Interaction

| Rule | Detail |
|------|--------|
| **Always responds** | Any `@Sage` mention in a cluster always receives a response. This is unconditional. |
| **Feature-first evaluation** | Before responding, Sage evaluates whether the @mention reveals a cluster-level feature need (async — does not delay response). See [`sage/SAGE_FEATURE_INTELLIGENCE.md`](sage/SAGE_FEATURE_INTELLIGENCE.md). |
| **Deduplication** | Sage checks semantic similarity against past responses (90-day window) — points to past answer if similarity ≥ 0.85, augments past answer if ≥ 0.70, generates fresh response if < 0.70. See [`sage/SAGE_ANCHOR_PROTOCOL.md`](sage/SAGE_ANCHOR_PROTOCOL.md) §4.2. |
| **@Sage tip** | A one-time dismissible tip is shown to new cluster members introducing the @Sage feature. |
| **Queue priority** | @Sage responses use the `clio-high` lane. SLA: 30 seconds from mention to Timeline post. |
| **Title** | The label inside Timeline cards reads "Sage · Anchor". The earlier "Host" terminology is retired. |

### Agent Collaboration Chatbox

| Rule | Detail |
|------|--------|
| **Visibility** | Fixed panel in every premium cluster, between the compose bar and the Timeline. |
| **Minimizable** | Members can minimize; minimized state persists per user per device. |
| **Never deleted** | Chatbox history is permanent — it is cluster content and member reference, not transient agent chatter. |
| **Cadence** | Maximum frequency by member count — `<100`: 2h · `<300`: 4h · `<500`: 6h · `<750`: 8h · `<1000`: 10h · `1000+`: 12h. |
| **Wait-and-observe** | Either agent (Clio or Sage) may propose an observation period when there is nothing genuine to add. This is a valid honest response, not a failure. |
| **No welfare in chatbox** | Welfare signals are NEVER discussed in the chatbox — they are handled privately via the welfare-escalation pipeline. |
| **Feature activation authority** | Clio may activate **immediate features** (no development required) on agreement with Sage in the chatbox, subject to: no rule violations, no admin override flag for the cluster. Admin can override any activation from the dashboard. |
| **Source of truth** | [`docs/AGENT_COLLABORATION_CHATBOX.md`](docs/AGENT_COLLABORATION_CHATBOX.md). |

### Soul Manifestation (All Clusters)

| Rule | Detail |
|------|--------|
| **Invariant prohibitions** | The Soul's core convictions are immutable across all clusters: no manufactured warmth, no belief manipulation, no engagement optimisation, no PII exploitation, no silent character judgment, no protocol disclosure. These cannot be overridden by any `soul_manifestation_profile` or `cluster_persona_override`. |
| **Variable manifestation** | How the Soul shows up (register, scripture usage, silence expectation, vulnerability surface, conflict mode, celebration mode) is context-variable per cluster. See `architecture/SOUL_MANIFESTATION_CATALOG.md`. |
| **Genesis Engine inference** | The Genesis Engine infers the `soul_manifestation_profile` from cluster purpose, tags, demographic context, and admin questionnaire response. |
| **Admin override** | Admins may edit the `soul_manifestation_profile` via the Soul Manifestation Panel. Changes are audited in `soul_manifestation_audit`. |
| **Persona override governance** | Cluster-level persona overrides (`cluster_persona_overrides`) require admin approval and cannot introduce prohibited phrases or contradict Soul invariants. |
| **Observer monitoring** | The Observer evaluates "Manifestation Alignment" (Dimension 6) and proposes Tier 1 `soul_manifestation_shift` updates if cluster behaviour drifts from configured profile. |

### AI Matchmaker (Premium Only)

| Rule | Detail |
|------|--------|
| **Premium required** | Only available to ₹300/mo subscribers |
| **Preference learning** | AI learns user preferences on a generalized basis over time |
| **People matching** | Finds users with similar AGGIL profiles and interests |
| **Questionnaires** | AI creates targeted questionnaires for potential matches |
| **Private clusters** | Creates private clusters where matched individuals interact |
| **All participants premium** | Everyone in a private premium cluster must be a premium subscriber |
| **No personal data exposure** | Matching uses stated preferences and activity patterns, never reveals real identity |

---

## 💎 PREMIUM vs FREE RULES

### Free Tier (₹0)

- Create unlimited clusters
- Join unlimited clusters
- Basic AI cluster suggestions (Scout batch)
- Text + image posts in clusters
- Public cluster Timeline + DMs (DM acceptance makes members into Connections with chat capability)
- Basic Clio for cluster creation and platform questions
- All push notifications

### Premium Tier (₹300/month)

> [!NOTE]
> **Phase 1 Constraint:** Premium tier, pricing, and all upsell UI are **NOT visible** until significant user adoption (~100k platform users). No pricing information appears on the landing page or anywhere in the Phase 1 app.

Everything in Free, plus:
- **AI Matchmaker** — preference learning + people discovery
- **Private premium clusters** — matched people, all premium
- **Persistent Clio** — remembers past conversations, learns preferences
- **Priority Scout** — 6-hour crawl frequency for user's interests
- **Questionnaires** — AI-generated for potential matches
- **Member limits** — optional cap on cluster membership (premium founders can set maximum members)
- **Voice/video calling** — in-cluster voice and video calls between Connections
- **Cluster templates** — pre-configured cluster templates for common use cases (medical communities, professional networks, study groups, etc.)

### Conversion Funnel Rules

| Rule | Detail |
|------|--------|
| **Questionnaire visibility** | Free users CAN see questionnaires sent by premium users |
| **Private cluster visibility** | Free users CAN see that private premium clusters exist |
| **Join restriction** | Free users CANNOT join private premium clusters until they upgrade |
| **Conversion prompt** | "Upgrade to Premium to join exclusive matching clusters" |
| **No feature removal** | Upgrading never removes existing free features |

---

## 🛡️ MODERATION RULES

### AI Moderation

| Severity | Action | Human Review |
|----------|--------|-------------|
| **Low** (mild language, borderline) | Flag for review, content stays visible | Optional |
| **Medium** (harassment, spam) | Content hidden pending review | Required within 24h |
| **High** (threats, CSAM, violence) | Content removed + user auto-banned immediately | Required within 1h |

### Moderation Principles

| Rule | Detail |
|------|--------|
| **AI-first** | All content screened by AI before human review |
| **No member removal by creators** | Only platform moderation can ban users |
| **Appeal system** | Banned users can appeal through in-app process |
| **Transparency** | Users notified when their content is moderated with reason |
| **Cultural sensitivity** | Moderation adapted for Indian cultural context and languages |
| **Report mechanism** | Any user can report content or users within clusters |

---

## 🔔 NOTIFICATION RULES

### Push Notifications (Firebase Cloud Messaging — Free)

| Trigger | Message Example | Frequency |
|---------|----------------|-----------|
| New post in user's cluster | "3 new posts in CSE Study Buddies" | Real-time (batched hourly) |
| AI trending topic | "Trending in your age group: 'Gate 2027 strategy'" | 1x daily max |
| New member joins cluster | "2 new people joined your cluster today" | Daily digest |
| Cluster qualification match | "New cluster you qualify for: 'Women in Data Science'" | When created |
| Premium conversion | "You've been active 30 days. Get AI matchmaking for ₹300/mo" | Once at Day 30 |

### Frequency Rules

| Rule | Detail |
|------|--------|
| **Daily cap** | Maximum 5 push notifications per user per day |
| **Batching** | Multiple events from same cluster batched into single notification |
| **User control** | Users can mute individual clusters or notification types |
| **Quiet hours** | No notifications between 11 PM and 7 AM (user-configurable) |
| **Escalation** | DM notifications always delivered; cluster notifications can be batched |

---

## 🔐 PRIVACY & SECURITY RULES — #1 Marketing Message

> [!IMPORTANT]
> **Privacy by Design is Aggilo's #1 marketing message.** Privacy here means **unlinking the user from their persona identity** — users get a deeply personal experience (Clio knows their interests, demographics, and needs) without ever tying that experience to their real-world identity. The promise: *"We know what you need. We don't need to know who you are."* Connection is the reward for trust; privacy is the foundation that makes the trust possible.

| Rule | Detail |
|------|--------|
| **Nickname anonymity** | Real identity never exposed to other users — persona identity is fully decoupled from real identity |
| **Phone number protection** | Phone number used for auth only, never displayed |
| **Personal without being personal** | Clio delivers a deeply personalized experience using behavioural signals and stated preferences — never real-world identity data |
| **DPDPA compliance** | Full compliance with India's Digital Personal Data Protection Act |
| **Data minimization** | Only collect data necessary for AGGIL matching and platform function |
| **GPS opt-in** | Location sharing is always optional and explicit |
| **No contact import** | Platform does not import phone contacts or social media connections |
| **Organic growth only** | All connections form through AGGIL matching, not external data |
| **Encrypted storage** | User data encrypted at rest |
| **Secure sessions** | 30-day session duration; auto-logout after 30 days of inactivity |
| **OTP authentication** | Phone OTP or Email OTP for signup and login (max 3 retry attempts, 5-min expiry) |

---

## 🏗️ INFRASTRUCTURE RULES

| Component | Technology | Hosting |
|-----------|-----------|---------|
| Mobile App | React 18 + Vite — Progressive Web App (PWA) | Vercel |
| Backend API | Node.js + Fastify (TypeScript strict) | Railway |
| Database | Supabase (PostgreSQL) | Supabase Cloud (free tier → Pro), secured via strict Row Level Security (RLS) policies |
| Real-time | Supabase Realtime | Supabase Cloud (DMs are pseudonymous, not E2E encrypted) |
| Agent Runtime | BullMQ workers on Node.js (3 priority lanes: `clio-high`, `events-medium`, `scout-low`) | Same Railway service as Backend API |
| Queue / Cache | Redis (ioredis client, BullMQ-compatible) | Railway Redis plugin |
| LLM (all agents) | Per [`11_llm_admin_routing.md`](PRD/11_llm_admin_routing.md) — admin-configurable | External (see routing table for providers) |
| Push Notifications | Firebase Cloud Messaging | Google Cloud (free) |
| Payments | Razorpay (UPI) + Google Play Billing | External |
| OTP / Email Code | WhatsApp Business API / SMS Gateway / Email (Resend SMTP) | External (~₹0.50/user for SMS) |
| Domain | aggilo.in | Registrar of choice |
| MVP (Sisters in Dua) — isolated exception | Next.js 14 App Router (TypeScript) | Vercel — NEVER imports from `apps/api/`, NEVER uses BullMQ or Fastify patterns |

> [!IMPORTANT]
> The "Yantra" naming has been retired in favour of **Agent Runtime** — implemented as BullMQ workers on the Node.js + Fastify backend. The architectural pattern is unchanged; only the name. See `architecture/system_implementation_prompt_part1.md` for the canonical specification. The `/yantra/` folder is retained as read-only legacy reference for the original routing-table and worker-pattern documentation.

---

## 🛡️ API RATE LIMITING

| Component | Limit | Behavior on Limit Reached |
|-----------|-------|--------------------------|
| **General API** | 60 requests / minute / IP | HTTP 429 Too Many Requests |
| **Authentication** | 5 requests / 5 minutes / IP | Temporary IP block (15 min) |
| **AI Agents (Clio)** | 10 requests / minute / User | "Clio is thinking..." delay response |
| **External LLMs** | Upstream limits (e.g., NIM free tier: ≤40 RPM) | Redis queue lane throttling to prevent 429s from NVIDIA/Groq |

---

## 📱 PLATFORM BEHAVIOR RULES

| Rule | Detail |
|------|--------|
| **Mobile-first** | All features designed for mobile experience first |
| **Registration flow** | Phone/Email OTP → Year of Birth + Gender → Language → Nickname + Interests → Dashboard |
| **Dashboard first-load** | AGGIL-matched cluster suggestions ready on first dashboard visit |
| **Cluster discovery** | **Non-members:** shareable cluster card link (the only external discovery channel). **Members:** Explore tab in Dashboard (AGGIL-matched cluster cards), Search (user-initiated topic/interest lookup), Clio recommendations via FAB. Cluster cards display description, tags, and demographic parameter labels. |
| **No content import** | Users create original content within the platform |
| **No follower system** | Connections happen through cluster membership, not followers |
| **No public profiles** | User profiles visible only within shared cluster context |
| **Event Brief** | Daily notification with trending topics and new cluster matches |

---

---

## 🪙 TOKEN BUDGET GOVERNANCE RULES (Part 8)

### Genesis Engine Token Caps

| Operation | Max LLM Calls | Max Tokens |
|-----------|--------------|------------|
| Pre-spawn questionnaire (Clio) | 1 | 8K |
| Cycle A: Spec generation | 2 (draft + 1 revision) | 16K |
| Cycle A: Introspection | 1 | 8K |
| Cycle B: Creation validation | 1 | 8K |
| Cycle B: Gap remediation | 1 (auto-only) | 4K |
| Post-launch monitor (weekly) | 1 | 8K |
| **Genesis total per cluster** | **6 calls max** | **52K tokens max (Standard)** |

### Budget Tiers

| Tier | Multiplier | Max Tokens | Who Can Set |
|------|-----------|------------|-------------|
| **Standard** | 1× | 52K | Default for all new clusters |
| **Elevated** | 2× | 104K | Platform admin (any); cluster admin (premium only) |
| **Maximum** | 3× | 156K | Platform admin only |

### Promotion Rules

- Promotion requires **written justification** logged in `cluster_token_budget_log`.
- Promotion is **time-bounded** (30 days default, renewable).
- **Auto-revoke** on 14-day cluster inactivity.
- **Audit trail:** Every promotion, demotion, and justification is logged.
- **No permanent unlimited budgets.** All promotions expire unless renewed.

### Escalation Gates

- Budget exhaustion routes to: cluster admin (premium clusters) or platform admin (generic clusters).
- **7-day response window** before Observer review.
- Admin options: approve manual action, request re-run, or promote budget tier.

### Anti-Loop Rules (Immutable)

1. **No nested introspection.** Genesis Engine never introspects its own output. One revision max.
2. **No CIM → Genesis feedback loop.** CIM may read `cluster_genesis_spec` but cannot trigger a new Genesis cycle.
3. **Cooldown periods.** Failed post-launch remediation → 14-day hold before next check.
4. **No budget borrowing.** A cluster cannot use another cluster's tokens or the global daily pool.
5. **Token-count enforcement.** Agent Runtime passes `max_tokens` to every Genesis LLM call.

### Prompt Refinement Quota Rules

- Prompt refinement receives a **dedicated budget pool** (Pool B) separate from general introspection (Pool A).
- Pool B quotas are **per-cluster-monthly**:
  - Generic clusters: 2 deep + 4 standard per month
  - Premium clusters: 4 deep + 8 standard per month
  - Elevated/Maximum token budget clusters: +2 deep bonus
- **No borrowing across pools.** General introspection cannot consume Pool B quota. Prompt refinement cannot consume Pool A quota.
- Unused allowance rolls over 1 month, then expires.
- Cluster admin can request manual review ("Sage feels off"), which consumes 1 deep introspection from Pool B with `prompt_quality_decline = 25` (admin override).
- **30-day rollback window.** Cluster admin can revert any prompt change within 30 days. Older changes require platform admin.

---

## 🧰 TOOL REGISTRY RULES (Part 9)

### Global Tool Library

- Tools are reusable **libraries**, not custom builds per cluster.
- One backend, many skins. Same code runs everywhere; cluster-specific UI/UX via `config_overrides`.
- Global tools live in `platform_tools`. Per-cluster imports live in `cluster_tool_enablements`.

### Auto-Promotion

- Observer scores **reusability** (0-100) on first tool build.
- **Score ≥ 80:** Auto-promote to global. Available to all clusters immediately.
- **Score < 80:** Keep cluster-private. Re-evaluate in 30 days.
- Admin can **veto** any auto-promotion retroactively.
- No concurrence requirement (waiting for 3 clusters is wasteful).

### Soft Retirement

- **90 days unused:** Status → `unused`. Hidden under toggle. Instant revival.
- **180 days unused:** Status → `archived`. Hidden from default view. Platform_admin can revive.
- **No active deletion.** Code stays in repo. Hiding is free.

### Compatibility

- `min_cluster_type` enforces generic/premium gating.
- `incompatible_tools` array prevents dangerous combinations.
- Config validated against JSON Schema on enablement.
- Version pinning protects existing clusters from breaking changes.

### Forking

- Forking allowed but discouraged. Config variations use `config_overrides`.
- Forked tools scored independently for global promotion.
- Every fork is logged and auditable.

---

### Member-Facing Framework Change Rule (NEW)

When a cluster's ecosystem type, success model, or progression model changes (a "hard pivot" per `CLUSTER_GENESIS_ENGINE.md` §10):

1. **Explicit communication is mandatory.** Sage/Clio MUST communicate the change using the 6-step protocol:
   - Acknowledge what the cluster was
   - State what has been observed (specific evidence, never surveillance language)
   - State what changes
   - State what stays the same (history, relationships, vault)
   - Invite feedback
   - Provide opt-out (pause or move to linked cluster)

2. **History is preserved.** Member posts, vault items, profiles, badges, and stage advancement history are never deleted. Old success model scores are archived. Old ecosystem specs are versioned in `ecospec_versions`.

3. **Rollback must be available.** Admin can one-click rollback to the prior ecosystem spec within 14 days of deployment. Members are automatically notified.

4. **No silent pivots.** A cluster may never change its fundamental framework without explicit member communication, even if the change is technically "low disruption."

5. **Opt-out is non-punitive.** Members who choose to pause or leave due to a framework change are not flagged as "churn." Their departure is recorded as `framework_mismatch_opt_out` — a signal that the pivot may have been premature.

6. **Guardian notification for minor clusters.** If the cluster serves minors (`has_minor_members = true`), the guardian MUST be notified alongside the minor for any hard pivot. The guardian receives the same 6-step communication as the minor, plus an additional "impact on your minor" summary. Guardian consent is required before deployment per `EVOLUTION_GOVERNOR.md` §3.1a.

---

### Minor Protection Rules (NEW)

These rules apply globally to any cluster, profile, or interaction involving a minor (13–17).

1. **Minimum age.** Platform registration requires age 13+. Users under 13 cannot register. Users 13–17 are classified as minors and require a linked guardian profile.
2. **Guardian linkage required.** A minor profile must have a `guardian_id` before joining any premium cluster. Generic clusters do not require guardian linkage in Phase 1; Phase 1.5 introduces optional guardian oversight for generic clusters.
3. **Minor profiles are never publicly discoverable.** Minor profiles do not appear in search, discovery, or cluster cards outside their joined clusters.
4. **No direct messaging from non-guardian adults.** A minor cannot receive direct messages from any adult who is not their linked guardian or an authorized adult in their cluster. Clio enforces this at the messaging layer.
5. **Minor posts are cluster-scoped.** A minor's posts and comments are visible only within the cluster they were posted in. No cross-cluster sharing, no public feeds, no aggregation into platform-wide content.
6. **Guardian data rights.** A guardian can request a full data export of their minor's activity and can request deletion of their minor's profile and data at any time. The platform must comply within 30 days.
7. **No targeted advertising or profiling.** Minor activity data is never used for advertising, profiling, or recommendation algorithms outside their explicit cluster memberships.
8. **Welfare escalation to guardian.** Any welfare alert involving a minor routes to the linked guardian within the 5-minute SLA, alongside the cluster Admin/Manager.

---

*This document serves as the authoritative guide for all Aggilo platform behavior. All AI agents (Scout, Clio, Matchmaker) and platform code must adhere to these rules.*
