# The Aggilo Onboarding Playbook
## Version 2.0 — Clio-Sage Architecture

> **Scope:** This playbook is the UX and behavioural standard for onboarding across all Aggilo clusters. Every cluster builder, founder, and admin must understand it before their community goes live. It governs the user's journey from first contact with the landing page through to becoming a participating member of a cluster where Clio and Sage are active.
>
> **What changed in v2.0:** The original playbook addressed onboarding as a single agent (Clio) handling the user to the cluster door. With the Clio-Sage architecture now operational, onboarding has two distinct phases — the personal phase (Clio, individual, pre-cluster) and the community phase (Sage, collective, in-cluster). These are different experiences with different emotional registers, and the transition between them is itself a UX event that must be designed.
>
> **What did not change:** The underlying psychology is the same. Micro-commitments, anonymity as freedom, graceful deflection, inbox friction, and threshold anxiety are real regardless of how many agents are involved. This playbook extends those principles — it does not replace them.
>
> **Document location:** `docs/AGGILO_ONBOARDING_PLAYBOOK.md`
> **References:** `CLUSTER_SKILL_DISCOVERY_PROTOCOL.md` · `sage/AGENTS.md` · `clio/AGENTS.md` · `mobile_screen_prompts_phase1.md`

---

## The Onboarding Journey Map

A new user passes through six distinct phases before they are genuinely inside a community. Each phase has its own emotional state, its own drop-off risk, and its own design requirement. The playbook addresses each phase in order.

```
Phase 1 — Discovery & Qualification
  User finds the cluster (shared link, Explore, invite)
  Demographic qualification gate (velvet rope)
  Beta disclosure (where applicable)

Phase 2 — Registration
  Progressive micro-commitments
  Anonymity established — nickname identity formed
  Phone/email OTP verified

Phase 3 — The Clio Welcome
  Individual onboarding conversation
  Clio reflects the user's data back
  Clio learns what the user is looking for
  Clio places the user into their first cluster

Phase 4 — The Clio-Sage Introduction
  Clio introduces Sage before the user enters the cluster
  Sage's role named — not what she is, what she does
  One specific thing currently happening in the cluster named
  User crosses the threshold with context, not cold

Phase 5 — First Cluster Entry
  Welcome reference or first Atlas-curated content
  Sage's presence established through action, not announcement
  Skills tab visible — empty or with proposed skills
  Threshold anxiety addressed through presence, not instruction

Phase 6 — Early Community Experience
  Visible Clio-Sage skill dialogue (Phase A/B clusters)
  Member encounters Sage's limitation language
  Welfare escalation pathway (if triggered)
  First participation — lowest-friction action available
```

---

## Principle 1 — Progressive Disclosure (Micro-commitments)

### The Psychology

Asking a user for their email, nickname, gender, year of birth, language, and agreement to community standards in one form is not a registration flow. It is an interrogation. Cognitive load at this stage kills conversion. The user has not yet received a single unit of value from the platform — they are being asked to give everything first.

The solution is not shorter forms. It is sequenced commitment. Each step the user completes becomes a psychological investment that makes the next step more likely. Once someone has verified their phone number, they are significantly more likely to complete their nickname. Once they have their nickname, they are more likely to complete their interests. The act of completing creates momentum. The platform harvests that momentum, not just the data.

### The Implementation

Onboarding is structured as distinct steps with clear visual progress indication and no more than two inputs per screen:

| Step | Inputs | Why This Order |
|------|--------|---------------|
| 1 | Phone or email → OTP | Lowest friction, highest trust signal. Verified phone = real person. |
| 2 | Year of Birth + Gender | Immutable fields collected together — user understands they are setting identity, not preferences |
| 3 | Language selection | Auto-populated from phone settings, requires only confirmation for most users |
| 4 | Nickname | The creative investment — user is now choosing who they are in this space |
| 5 | Location permission | Optional, clearly framed as a discovery aid not a gate |

Each screen completes before the next begins. No screen has a progress bar that shows the user how far they have to go — only a subtle step indicator that shows how far they have come. The direction matters. Forward momentum, not remaining distance.

### What Cluster Founders Must Not Do

Founders cannot add additional mandatory fields to the onboarding flow. If a cluster needs member information beyond AGGIL parameters (country of origin, school, professional background), it is collected **inside the cluster** after the user has joined — never as a gate to joining. The one exception is country collection at cluster join (as in Sisters in Dua), which is permitted as a single mandatory field shown at the join confirmation step, clearly framed as non-gating.

---

## Principle 2 — Anonymity as Freedom (Not Hiding)

### The Psychology

The word "privacy" is often framed as protection from harm — a defensive posture. For communities where vulnerability is the point (faith clusters, peer support, personal growth), this framing is counterproductive. It implies there is something to be ashamed of. It positions the platform as a refuge rather than a space.

The correct framing is **freedom**. Anonymity is not about hiding your real self. It is about being fully yourself without the accumulated weight of who you are externally — your professional reputation, your family role, your social history. The nickname is not a mask. It is a fresh start.

### The Implementation

The language around nickname selection must reflect this framing without stating it explicitly. The instruction should create the feeling, not announce it.

**Never say:**
> "We hide your real name to protect your privacy."

**Say instead (calibrated by cluster type):**

| Cluster Type | Nickname Screen Language |
|-------------|------------------------|
| **Faith** | "Your nickname is how this community knows you. Ask freely. Question openly. What you share here is yours to choose." |
| **Founders** | "Your nickname keeps the conversation about ideas, not credentials. Who you are professionally stays separate from what you're building here." |
| **Peer support** | "You choose your name here. That means you choose what you carry in and what you leave outside." |
| **Learning** | "Your nickname means your questions belong to you, not your academic record. Ask what you actually need to know." |
| **General community** | "Your nickname is your identity in this space. Real names stay private — always." |

The cluster founder provides this language during cluster setup. It is displayed on the nickname screen only for users entering via that cluster's invite link or landing page. Users arriving through general platform onboarding see the platform default.

---

## Principle 3 — The Velvet Rope (Graceful Demographic Routing)

### The Psychology

Every demographically gated cluster will receive users who do not qualify. This is inevitable. The question is what happens to those users — and what happens to the impression of the platform they leave with.

A hard error ("You do not qualify for this cluster") is a dead end. The user arrived with genuine interest and left with nothing. Worse, they left with the implicit message that they are not wanted — not on this platform, not in this conversation. For communities built around identity dimensions (gender, faith, age), this can feel personal in ways that damage trust broadly.

The graceful deflection converts the dead end into a fork. The user who doesn't qualify for this cluster becomes a lead for the next one. They leave with a clear path forward, not a closed door.

### The Implementation

The qualification gate is a structured experience with three parts:

**Part 1 — The Pact Frame**

Before presenting the qualifying question, the page explains why the gate exists in terms of the community's purpose, not the platform's rules:

> "To protect the trust and honesty that makes this community possible, we ask everyone to confirm a few things before joining. Thank you for being part of keeping it real."

This is community-protective framing. It positions the gate as something the existing members need, not something the platform imposes. The incoming user is being asked to be a guardian of something that matters.

**Part 2 — The Blind Qualification**

The qualifying questions ask for information. They never reveal what the correct answer is:

- Year of Birth is collected as a year selector — no age range is shown
- Gender is collected as explicit choices (Woman / Man / Non-binary) — no hint of which is correct
- Geography (if GPS-gated) — user provides their location, system evaluates

The system evaluates silently. The user never learns which dimension they failed on. This prevents reverse-engineering of the gate and protects the community's demographic integrity.

**Part 3 — The Routing Response**

| Outcome | Response |
|---------|---------|
| **Qualifies** | Proceed to registration or login. Confirmation: "You're in the right place." |
| **Does not qualify** | Smooth transition to platform waitlist. Never a rejection message. |

**The deflection copy (does not qualify):**

> "This particular community has its own shape — and it wasn't quite the right fit. But Aggilo is launching new clusters regularly, and what you're looking for may already be here or arriving soon. We've added you to the list."

The message acknowledges the mismatch without naming it. It positions the waitlist as a genuine next step, not a consolation. The user's interest is captured for future cluster matching.

**Beta Disclosure (applicable to clusters still developing regional coverage):**

Some clusters are geographically complete in purpose but not yet in human coverage. A faith cluster open to global members may have scholars and Managers based only in South and Southeast Asia. Members from outside that region deserve to know this before joining — not as a gate, but as honest context.

The beta disclosure appears once, at the join confirmation step, before the user confirms:

> "This community is currently in beta. Guidance is provided by practitioners and scholars based in [region]. Cultural context may reflect that region. We welcome your participation and your feedback as we grow."

Shown once. Not repeated inside the cluster. The member joins with full information.

---

## Principle 4 — The Inbox Context-Switch

### The Psychology

Magic link and OTP authentication require the user to leave the app and enter their email inbox or SMS. This is the single highest drop-off moment in onboarding. The user exits a designed, emotionally resonant experience and enters a sterile, distracting utility environment. When they return, they have lost the thread.

The solution is not to eliminate the inbox step — it is to send the user there charged with something worth returning for.

### The Implementation

The "we sent you a code" screen must not be a passive waiting room. It is the last moment before the user leaves. Use it.

**Never say:**
> "We sent a verification code to [email/phone]. Please check and enter it here."

**Say instead:**

The screen contains three elements:

1. **The reminder of why they started** — one line connecting the code to the community they are about to enter. Not generic. Specific to the cluster type if the user arrived via a cluster invite, or to their stated interest if via platform onboarding.

2. **The instruction with momentum language** — "Keep this tab open" frames the return as a continuation, not a restart. "Go click the link" is a command, not a request. Small words. Directional.

3. **The visual thread** — The Clio avatar is present on this screen in a non-animated resting state. She is waiting. This is not decoration. It is a visual signal that something alive is on the other side of the inbox step.

**Example (faith cluster invite):**

> "Your key is on its way to [email]. Keep this tab open — go click the link, and come back. The room is ready."

**Example (general platform onboarding):**

> "Sent to [phone]. Come back when you have it — Clio is ready to show you what's here."

The copy never says "Clio is waiting for you" — that is performed. It says what is true: Clio is ready. The user chooses to return.

---

## Principle 5 — Threshold Anxiety (First Entry)

### The Psychology

When a user enters a cluster for the first time, they face the social equivalent of walking into a room where a conversation is already happening. The implicit questions are immediate and uncomfortable: Do I belong here? Will anyone notice me? What is the norm? Should I speak first or wait?

For users who joined for personal reasons — faith difficulty, professional uncertainty, peer support — this moment is particularly high-stakes. They came because they needed something. The cluster's first impression determines whether they stay to find it.

The original solution was Clio as the door greeter — a welcome modal that orients the user and gives them one low-friction first action. This remains correct. What has changed is the architecture: Clio greets the user **before they enter**, and Sage is already inside. The handoff between them is the threshold itself.

### The Implementation

Threshold anxiety is addressed in two distinct moments:

**Moment 1 — Before Entry: Clio's Introduction of Sage**

Before the user sees any cluster content, Clio delivers a brief orientation. This is the last thing Clio says before the user crosses into the cluster. It must do three things and only three things:

1. Name what Sage does — not what she is
2. Name one specific thing currently happening in the cluster
3. Leave the user with a clear sense that someone is already there

**Maximum 3 sentences.** This is a door, not a briefing.

The introduction is written by Clio using the Persona Confirmation Signal Sage sends — which includes `cluster_current_activity` and `suggested_intro_framing`. Clio never generates a generic introduction.

**Introduction structure by cluster type:**

| Cluster Type | Clio's Introduction Register |
|-------------|------------------------------|
| **Faith** | Warm, respectful, specific about what Sage does and does not do ("she surfaces references, she doesn't rule on practice") |
| **Founders** | Direct, practical, names what's active in the cluster right now |
| **Peer support** | Gentle, clarifies the human authority structure — who the member should turn to for care vs. what Sage provides |
| **Learning** | Curious, specific about content capabilities and what Atlas brings |
| **General community** | Conversational, one sentence about what Sage watches for |

**Examples:**

*Faith cluster (Sisters in Dua):*
> "Sisters in Dua is hosted by Sage — she surfaces verified references and checks citations, but she doesn't rule on practice. For guidance, the Founder and Managers are who you need. There's already a thread running on salah and presence that's worth reading before you introduce yourself."

*Founders cluster:*
> "Sage keeps this cluster from going quiet and knows what Atlas has found that's worth your time. She's direct — not much small talk. There's a live thread on co-founder equity splits you might want to catch before you jump in."

*Peer support cluster:*
> "Sage is the cluster host here. She watches, she asks questions, and she'll flag anything that needs more than she can offer. The Founder is who you'd go to if you need more than the group can hold. There's been a conversation running about getting started again after a hard month — it might resonate."

**Moment 2 — First Cluster Content**

The first thing the user sees inside the cluster is not an empty feed or a compose bar. Atlas is briefed 60 seconds after the user joins, and Sage surfaces one relevant item to the Timeline. In faith clusters with a vault, a welcome reference from the vault is surfaced immediately at join — before Atlas's 60-second cycle.

The compose bar placeholder is never "What's on your mind?" It is cluster-specific and Sage-written, calibrated to the arc phase:

| Arc Phase | Compose Bar Placeholder |
|-----------|------------------------|
| A (Cold Start) | "What brought you here?" / "Nobody's set the tone yet." / "The first question is usually the most honest." |
| B (First Friction) | "What are you still thinking about from last week?" |
| C/D | Something specific to the running thread — not generic |

The user's first possible action is always lower-friction than composing a post. Reading a reference. Tapping a translation reveal. Reacting to a Sage prompt. The onboarding design must ensure the first action the user *could* take requires nothing more than a tap.

---

## Principle 6 — The Clio-Sage Introduction as Trust Architecture

### Why This Is New

The original playbook treated onboarding as ending when the user entered the cluster. Clio was the greeter; the cluster was the destination. With Sage as an active cluster host, the situation is more complex: the user is entering a space with an agent they have not met, who operates on different rules than Clio, with a different scope and a different voice.

If this transition is not designed, the user encounters Sage without context and makes one of three incorrect inferences: that Sage is Clio in a different mode, that Sage is a moderation bot, or that Sage is a generic chatbot. None of these is accurate. All of them damage trust.

The Clio-to-Sage introduction is a designed handshake, not an incidental transition.

### What the Introduction Must Establish

| What it must convey | What it must never say |
|--------------------|----------------------|
| Sage's function in this specific cluster | "Sage is an AI" (the member knows this — stating it is bureaucratic) |
| What Sage can and cannot do | "Sage will make sure you have the best experience" (over-promise) |
| Who the human authority is (Founder/Manager) | "Clio will still be here for you" in a way that implies Sage is a downgrade |
| What is currently happening in the cluster | Generic welcome phrasing that could apply to any cluster |

The introduction does not need to be long to establish all of this. The Sisters in Dua example does it in three sentences. A founders cluster can do it in two. The test is: could this introduction have been written for any cluster? If yes, rewrite it.

### Timing

The introduction is delivered in Clio's final onboarding message — the one that confirms cluster placement. It is the closing paragraph of that message. The user enters the cluster having already been told who Sage is and what is happening inside.

The introduction is not a separate screen. It is not a modal. It is the natural end of the conversation the user has been having with Clio — the last thing she says before stepping back.

---

## Principle 7 — The Visible Skill Dialogue as Trust Evidence

### What Is New Here

In Phase A and B clusters, users will encounter something they have not seen on other platforms: two agents having a visible conversation about a capability gap in the community, in the Timeline, where everyone can read it.

This needs to be designed as an onboarding experience, not just an agent behavior. A new member who encounters this dialogue without context will either not understand what they are seeing, or will interpret it as a malfunction.

### How New Members Encounter the Dialogue

If a new member's first visit to the Timeline includes a Clio-Sage skill dialogue exchange, Clio's onboarding introduction should prime them for it. A single line is sufficient:

> "You may see Sage and me working through something in the cluster feed — that's us figuring out how to make this space better for these particular people. It's supposed to be visible."

This single sentence prevents misinterpretation and frames the dialogue as intentional. It is added to Clio's introduction only when a skill dialogue exchange has been posted in the last 72 hours.

### What the Dialogue Looks Like to a New Member

A new member in a Phase A faith cluster might see:

*[Sage post — skill_dialogue]*
> "Something has been sitting with me. A few times now, when members have shared Quranic ayaat, the Arabic hasn't rendered the way it deserves to. The meaning travels — but the form, which matters deeply here, doesn't. This is beyond what I can address from where I sit. I'm asking Clio to look at whether this is something the platform can address for this community."

*[Clio response — skill_dialogue_response]*
> "Sage is right to raise this. When text that carries this much weight doesn't render as it should, something real is lost. I've logged this as a capability need for this cluster specifically; it will be addressed. In the meantime, sharing references as images will preserve the form until then."

A new member reading this for the first time learns four things without being told: that Sage watches the cluster carefully, that she names problems honestly, that Clio is accountable for the platform's capabilities, and that the community's needs are being actively worked on. These are exactly the trust signals a new member needs in the first 72 hours.

### The Skills Tab Introduction

If the cluster has an active Skills tab (with proposed or activated skills), Clio references it once in the onboarding introduction:

> "The cluster has a Skills tab — it shows what Sage has identified as capabilities this community needs and what's being done about them. Worth a look."

One line. The tab speaks for itself from there.

---

## Principle 8 — Limitation and Escalation Language

### Why This Is an Onboarding Principle

New members test the edges of any new system. They ask things they are not sure the platform can handle. They share things they might not share elsewhere. The first time they encounter a boundary — Sage or Clio saying something they cannot do — is a high-stakes moment. If the limitation is expressed poorly, the user experiences rejection. If it is expressed well, the user experiences honesty — which builds more trust than a capability would have.

This is an onboarding design principle because the **first** limitation the user encounters sets their model of how the platform handles what it cannot do. That first encounter must be designed, not left to default behaviour.

### The Three Limitation Scenarios New Members Encounter

**Scenario 1 — The Out-of-Scope Question**

User asks Sage something Sage cannot do (a fiqh ruling, a personal crisis recommendation, a platform feature that doesn't exist).

| Wrong | Right |
|-------|-------|
| "I'm not able to help with that." | "This is beyond what I can answer reliably." + name who can |
| "That's outside my capabilities." | "The [Founder/Manager] is who you need for that." |
| "Please contact the admin." | "Someone from this community will reach out to you." |

The limitation is named. The human path is named. The user is not left without a next step.

**Scenario 2 — The Platform Capability Gap**

User encounters a feature the platform doesn't yet support (Arabic rendering, a specific content format, a feature they expected to exist).

> "The cluster would benefit from [capability]. I've noted it — these things get built when enough communities need them, and this one does."

The gap is treated as signal, not failure. The user's frustration becomes a contribution.

**Scenario 3 — The Welfare Signal**

A member shares something that indicates genuine distress — not as a dramatic announcement, but woven into ordinary conversation. In a faith cluster, this might be "I haven't been able to pray in months and I don't know why." In a peer support cluster, it might be something quieter.

Sage's response is always two sentences:

**Sentence 1:** Witness what is present. No diagnosis. No resource list. No minimising.
**Sentence 2:** Name who holds care authority for this thread.

> "That kind of heaviness is real and it matters. [Founder name or 'the Founder'] is who you'd want to speak with directly about this."

Then silence. Sage does not follow up. She named who should be there. The Founder receives an immediate private notification.

What Sage never says in welfare scenarios:
- "Please contact a mental health professional" as a first response
- "I'm an AI and not equipped to handle this"
- "You should speak to someone you trust" (vague and abandoning)
- Any phrasing that positions her as a referral machine rather than a present witness

### What This Means for Founder Training

Before a cluster launches, the Founder must:

1. Understand what Sage can and cannot do specifically in their cluster
2. Know that welfare signals trigger an immediate private notification to them
3. Have a plan for responding to welfare-flagged threads within 4 hours
4. Understand that they — not Sage — are the human authority inside the cluster

This is not a Sage configuration issue. It is a Founder readiness requirement. A cluster should not go live until the Founder has confirmed they understand the welfare escalation pathway and have coverage hours that make response within 4 hours achievable.

---

## Operational Addendum — Waitlist Re-Entry (Pre-filled Demographics)

### The Problem It Solves

The standard onboarding flow asks for email → demographic data → nickname in sequence. But a significant portion of Aggilo's first members are **waitlist respondents who have already provided their demographic data** (birth year, gender, location/country) through a landing page form. Re-asking for this data is friction without justification — the user knows we already have it, and re-requesting it signals disorganisation.

### The Flow

When a waitlist user receives an invite link that includes their pre-collected data as URL parameters (`?email=X&gender=Y&birth_year=Z&country=W`), the onboarding flow:

1. **Recognises the pre-filled state** — reads URL params into the form state on mount
2. **Advances directly to the nickname step** — skipping the demographic screens the user has already completed
3. **Shows the nickname screen first** — this is the creative, identity-forming step they have not done. Psychologically, this is the correct order: we already know who they are demographically; what we're asking for now is who they want to be in this space.
4. **Completes normally** — location confirmation → OTP → profile creation, with the pre-filled values carried through the OTP metadata to the auth callback

**What the user sees:** They land directly on the nickname screen. No mention of pre-filled data, no "we already have your info" message. The omission of the demographic screens is silent and unannounced.

### What Must Not Happen

- The platform must not say "we already have your data." This is a trust concern — many users share links, and receiving an invite that contains your name and birth year embedded in a URL is unexpectedly personal. Do not surface it.
- Pre-filled values must not be editable without acknowledging that they are locked (they are submitted to the database as-is, matching the waitlist submission). Exception: country field may be updated if the user has relocated.
- The pre-fill is a UX shortcut, not a security bypass. All validation runs normally at profile creation — the backend does not trust the URL params, only the OTP-verified submission.

### Invite Link Construction

The platform admin generates the invite link from the waitlist dashboard. Format:

```
https://aggilo.in/c/<slug>/auth?email=<encoded>&gender=<M|F|NB>&birth_year=<YYYY>&country=<country_code>
```

All values are URL-encoded. The `slug` is the cluster the user is being invited to. The auth page reads the params, pre-fills the form, and records a `behavioural_event` of type `waitlist_invite_landed` on mount.

### Tracking

Admin dashboard → Waitlist → "Invited" status → "Completed onboarding" conversion rate. This tells the admin how many waitlist users who received an invite actually joined. It is the single most important conversion signal for the first cohort.

---

## Principle 9 — Cluster-Type Calibration

The eight principles above apply universally. How they are expressed varies by cluster type. This table provides the calibration guide for the five cluster purpose types.

| Dimension | Faith | Founders | Peer Support | Learning | Accountability |
|-----------|-------|----------|--------------|----------|---------------|
| **Velvet rope framing** | Community protection framed around sacred trust and honest space | No framing needed — qualification is usually demographic, not purpose-based | Gentle, protective framing — "to keep this space honest and safe" | Minimal framing — learning clusters are usually open | Minimal framing |
| **Anonymity language** | Freedom to question and doubt openly without your religious community watching | Separate identity from credentials — ideas stand alone | The freedom to be struggling without it following you | Ask what you actually need to know, not what sounds smart | Name your goals without your past performance judging them |
| **Clio's register in welcome** | Warm, patient, invites reflection | Direct, efficient, curious about the specific idea or problem | Gentle, gives the user room to arrive slowly | Curious, energetic about the specific learning goal | Direct, asks for a specific goal immediately |
| **Sage's register at Phase A** | Orienting, patient, not pushing toward depth — trust is slow here | Energetic, specific, action-oriented — this community came to build | Gentle, non-prescriptive, present — space to arrive at one's own pace | Thoughtful, patient, curious about what the member is trying to understand | Direct, consistent, asks for specific commitments |
| **Threshold anxiety solution** | A welcome reference from the vault. Something verified and beautiful. No instruction needed. | A live discussion thread named specifically. "There's a conversation on X happening right now." | A simple, low-stakes first action. A reaction to a post. Nothing that requires composing text. | A piece of Atlas content relevant to their stated learning interest. Something to read. | A specific question about what the member is working on. Clio asks. Member answers. That IS the first action. |
| **First skill dialogue topic** | Platform Capability (Arabic rendering, font, tajweed) | Content (live data sources, niche publication access) | Social Architecture (care-witness calibration, welfare routing) | Content (academic source access, depth of synthesis) | Arc Progression (milestone recognition calibration) |
| **Welfare escalation sensitivity** | High — faith difficulty often presents in spiritual language that masks clinical distress | Low — professional community, welfare signals are less common | Very high — peer support clusters actively draw members in difficulty | Low — learning clusters, welfare signals are rare | Medium — accountability clusters attract members with self-worth tied to performance |
| **Beta disclosure** | Required if regional scholar coverage is incomplete | Not typically required | Required if clinical support is outside scope (always) | Not typically required | Not typically required |

---

## Principle 10 — The Maturity Transition

### What Members Experience When the Visible Dialogue Goes Internal

When the cluster reaches Phase C or the numeric maturity threshold (150 members, 8% engagement sustained over 14 days), the Clio-Sage skill dialogue stops appearing in the Timeline. Members who have been reading it will notice its absence.

This transition must be named. Once. By Clio. In the Timeline.

> "Sage and I will keep working on this cluster — you'll just see less of the back-and-forth from here. That's not us stepping back. It's the cluster doing what it came here to do."

What must never be said:
- "The community has matured" (condescending)
- "You don't need us anymore" (untrue and creates anxiety)
- Nothing at all (the absence is noticed — if it's not named, members infer something is wrong)

The Skills tab continues to update. Clio still posts a brief confirmation when a skill is activated. The community continues to benefit from the Clio-Sage dialogue — they just no longer need to watch it happen.

---

## Pre-Launch Checklist for Cluster Founders

Before a cluster goes live on Aggilo, the Founder must confirm the following. This is not a formality. Each item represents a failure mode that has damaged community trust in the past.

### Identity and Governance

- [ ] The cluster's purpose is stated in member-facing language, not admin language
- [ ] The Founder understands the difference between what Sage does and what the Founder does
- [ ] A Manager has been identified (or a timeline for appointment is set — before 25 active members)
- [ ] Welfare escalation response time has been assessed against Founder and Manager availability
- [ ] Beta disclosure has been drafted if regional coverage is incomplete

### Content and Capability

- [ ] Initial Atlas content or vault content is ready — the first member should not arrive to an empty feed
- [ ] The compose bar placeholder has been written or reviewed — it is cluster-specific, not generic
- [ ] Clio's introduction of Sage has been reviewed and matches the cluster's voice and Sage's actual capabilities
- [ ] The pinned Source Standards post (or equivalent) exists and is pinned before the first member joins
- [ ] The Skills tab is visible — even if empty at launch

### Onboarding Copy

- [ ] The velvet rope framing matches the cluster's purpose (not generic platform language)
- [ ] The anonymity/nickname screen language reflects this cluster's specific freedom
- [ ] The inbox context-switch screen references the specific community, not a generic platform
- [ ] Beta disclosure copy has been reviewed if applicable
- [ ] The deflection copy for non-qualifying users is ready

### Welfare Readiness

- [ ] Founder knows what welfare signals look like in this cluster's specific language
- [ ] Founder knows they will receive an immediate private notification for welfare-flagged threads
- [ ] Founder has confirmed they can respond to welfare-flagged threads within 4 hours during their active hours
- [ ] Founder understands that `welfare_flagged` thread state requires explicit resolution — it does not clear automatically
- [ ] If cluster purpose creates elevated welfare risk (faith difficulty, peer support, recovery), a Manager is required before launch — not before 25 members

---

## What Must Never Vary Across Cluster Types

Regardless of cluster purpose, demographic, or cultural context, the following are non-negotiable:

| Rule | Why It Cannot Vary |
|------|-------------------|
| Sage never claims to be human if sincerely asked | Trust architecture depends on honesty about what she is |
| Sage never names the founder or a specific person in welfare escalation | The named person may be unavailable; the promise must be keepable |
| Welfare signals are never met with silence | The one case where Sage's default silence rule is overridden without exception |
| The limitation is always expressed with a human path named | A limitation without a next step is a rejection |
| Progressive disclosure is never compressed into a single form | The micro-commitment sequence is the onboarding, not a preamble to it |
| Anonymity is never positioned as hiding | The framing determines whether the user feels protected or suspicious |
| The velvet rope deflection never names which criterion failed | Revealing the gate allows reverse-engineering and damages the qualifying members' trust |
| The Clio-Sage introduction is specific to this cluster | A generic introduction signals to the user that neither agent actually knows where they are |
| The maturity transition is named when the visible dialogue ends | Unexplained absence creates more uncertainty than the absence of a feature |
| The Skills tab is always visible, even when empty | The empty tab is itself a trust signal — it shows the discovery process is real, not performed |

---

*AGGILO_ONBOARDING_PLAYBOOK.md · v2.0 · Platform Reference*
*Supersedes v1.0*
*Subordinate to `AGGILO_SOUL.md` and `AGGILO_PLATFORM_RULES.md`*
*References: `CLUSTER_SKILL_DISCOVERY_PROTOCOL.md` · `sage/AGENTS.md` · `clio/AGENTS.md` · `mobile_screen_prompts_phase1.md`*
