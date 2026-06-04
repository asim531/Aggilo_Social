# Research Circle MJ

> **MJ College Cluster · Generic Tier · Academic Depth · Mixed Gender**
> *A persistent space for faculty and researchers at Muffakham Jah College to share work, trace ideas across conversations, and keep documents connected to the threads that shape them.*

---

## 1. Concept and Thesis

Research Circle MJ exists because WhatsApp groups cannot sustain research collaboration.

The failure is structural: chat is ephemeral, scrollable, and unindexed. A document shared on Monday is unfindable by Wednesday. A topic that sparked 20 messages is buried under 50 new ones. The 5 people in Tasneem's WhatsApp group are not lacking motivation — they are lacking **persistence**. Their ideas get lost not because they are bad, but because the medium dissolves them.

This cluster is built on a single inversion: **the conversation is not the product. The indexed, retrievable body of knowledge is.** The chat is the mechanism; the topic-linked archive is the output.

### What Makes This Different from a WhatsApp Group

| WhatsApp | Research Circle MJ |
|----------|-------------------|
| Documents are attachments | Documents are indexed objects with titles, topics, and thread history |
| Topics dissolve into the scroll | Topics are persistent filters; click a chip, see every post and document |
| Threads branch and die | Threads auto-link to topics; new posts deepen existing topics |
| Search is global and noisy | Search is scoped to topics; find "ML in Healthcare" documents, not every mention of "healthcare" |
| No structured persistence | Every shared link, image, video, and document is retrievable by topic |

---

## 2. Cluster Tier & Founding Context

- **Tier:** Generic
- **Origin:** Cluster request submitted via intake form, May 2026.
- **Founding member:** Tasneem (tasneem.bano@gmail.com) — Faculty/researcher at MJ College, Hyderabad. Age 30-50 cohort.
- **Founding member role:** First Connection. Tasneem is the reason this cluster exists. She is not an admin — she is the first person Clio places here, and the first person Sage holds space for.
- **Discovery:** Discoverable via AGGIL matching. Clio surfaces it to members whose onboarding signals suggest the academic/research cohort — people at MJ College, English-primary, interest in writing or research.
- **Pre-Spawn Analysis:** This cluster was analysed by the Pre-Spawn Inference Module before creation. The intake form signal "topic get lost, document get disconnected" was classified as `content_orphaning` (confidence: 0.96). The `topic_document_linking` Platform Capability skill was pre-activated at cluster creation.

---

## 3. Target Audience & AGGIL Mapping

| Dimension | Setting | Rationale |
|---|---|---|
| **Age (A)** | All ages | Age is not a barrier. The cluster is scoped to the college, not a demographic cohort. Undergraduates, post-docs, faculty, and visiting researchers all welcome. |
| **Gender (G)** | Everyone | User stated. No restriction. |
| **Geography (G)** | Named location: "Muffakham Jah College of Engineering and Technology, Banjara Hills, Hyderabad" | Institution-scoped. Not GPS-gated (campus boundary is fuzzy); named-location mode is correct. |
| **Interest (I)** | `#AcademicWriting` `#Research` `#Education` `#Books` | Predefined + custom. `Books` is the closest predefined tag; `Academic Writing` and `Research` sharpen purpose. |
| **Language (L)** | English | User stated. English-only cluster. |

**User Archetypes:**
- Faculty at MJ College writing or collaborating on research papers
- Researchers who need to share drafts, track feedback, and maintain version context
- People who have tried WhatsApp groups for academic collaboration and found them structurally inadequate
- Members who need to find a document or discussion from 3 weeks ago without scrolling
- People who work across multiple research topics and need documents to live in more than one context

---

## 4. How Topics and Documents Work Here

### 4.1 The Topic-Document Linking System

This cluster ships with a pre-activated Platform Capability skill: **Topic Threads**.

**What it means in practice:**

- Every post can be tagged to one or more topics. Topics are persistent, clickable filters.
- Every document (PDF, DOCX, image, video, link) uploaded to the cluster is an indexed object — not just an attachment. It has a title, uploader nickname, upload date, linked topics, and a "discussed in" thread list.
- Sage infers topics from post content using a local LLM classifier. Members can override or add tags.
- Documents inherit tags from the post that shared them, but can be re-tagged independently.
- A single document or post can belong to multiple topics (many-to-many).
- When a thread evolves, Sage detects topic drift and proposes new links or topic creation.

### 4.2 Media Support

This cluster handles all research media types:

| Media Type | Handling | Topic Linkable |
|---|---|---|
| **Documents** | PDF, DOCX, TXT — indexed by filename + title; full-text search future phase | Yes |
| **Images** | Diagrams, charts, screenshots — indexed; thumbnail preview | Yes |
| **Videos** | Lecture recordings, demos — indexed; playable inline | Yes |
| **Links** | URLs shared in posts — extracted, title fetched, indexed; thumbnail preview | Yes |
| **Plain posts** | Text-only discussion — topic-tagged by Sage or member | Yes |

### 4.3 Thread-to-Topic Evolution

Threads are not static. As a discussion proceeds:

1. **Opening post** — Sage suggests 1-3 topic chips. Member confirms or overrides.
2. **Replies accumulate** — Sage monitors reply content. If ≥3 replies share a keyword/concept not in the opening post's topics, Sage proposes a new topic link.
3. **Document shared mid-thread** — Document inherits the thread's current topics. Member can add more.
4. **Topic merge** — If two threads converge on the same theme, Sage proposes merging their topic tags.
5. **Topic detail page** — `/cluster/:id/topics/:slug` shows every post and document linked to that topic, chronologically.

---

## 5. Aggilo System Integration

- **Cluster Arc Phase:** Starts at Phase A (seeding — Clio is the primary presence until the first 3 Connections have posted).
- **Atlas Content:** Atlas is configured with the `academic_research_india` content brief — pulling from sources relevant to Indian STEM academia: current research trends, funding announcements, methodological guides, and cross-disciplinary synthesis. Sources include: ArXiv India, ResearchGate, university press releases, and curated academic blogs.
- **Sage Management:** Guided by an Academic Librarian persona (see `SAGE_PERSONA.md`). Sage's priority is structural coherence — making sure documents remain findable and topics remain traceable. She is not a social host; she is infrastructure.
- **Clio's Onboarding:** Clio orients new members to the Topics tab, demonstrates document upload with topic linking, and explains how to find past discussions. See `CLIO_ONBOARDING.md` for full flow.
- **Welfare Protocol:** Standard platform welfare escalation applies. Research clusters typically have lower emotional disclosure than intimacy cohorts, but academic stress and impostor syndrome are real. Sage is calibrated to distinguish between healthy scholarly disagreement and genuine distress.
- **Conflict LLM:** Claude Opus triggers on personal attacks or harassment. It does NOT trigger on heated academic disagreement, methodological critique, or reviewer-style feedback — these are the cluster's subject matter.
- **Clio Persona:** Academic Momentum (30-50) with research-cohort register. See `CLIO_ONBOARDING.md`.

---

## 6. Seed Questions (Pre-Launch)

These are placed by Clio before the first member posts. They are invitations, not prompts.

1. *"What's the research question you're currently chasing — the one that keeps showing up in different forms across your work?"*

2. *"If someone in this college had already solved the problem you're stuck on, what would you want to ask them?"*

3. *"What's the document or paper you keep coming back to — the one that shaped how you think about your field?"*

4. *"Research often happens in isolation here. What's the conversation about your work that you wish you were having more often?"*

5. *"If every document and discussion in this group stayed findable forever, what would you share first?"*

---

## 7. Cluster Name Rationale

**"Research Circle MJ"** was chosen deliberately.

- **"Research"** — signals the activity. Not "chat", not "group" — research. This attracts the right people and repels the wrong ones.
- **"Circle"** — implies a closed, trusted space. Not a broadcast channel. A circle has a perimeter; members know who is in the room.
- **"MJ"** — institution-branded. This is not a generic research forum; it is scoped to Muffakham Jah College. That specificity is the point.

The name passes the Clio test: *does this make the person feel found?* A faculty member at MJ College who has been losing documents in a WhatsApp scroll reads "Research Circle MJ" — and feels, for the first time, like someone understood what they were actually missing.

---

*Cluster Description · Research Circle MJ · v1.0 · Internal · 2026-05-31*
