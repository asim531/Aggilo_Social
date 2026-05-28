# 🔮 Workflow 2: Cluster Creation

> Three paths to creating a cluster: Manual Wizard, Clio Conversation, or Scout Auto-Creation

`PRD — Aggilo Social Network`

> [!IMPORTANT]
> **Phase 1 Launch (until ~50k platform users):** Only **Path 2 (Clio conversation)** is the active user-facing creation path. The manual wizard (Path 1) is not exposed — no "Create Cluster" button exists in the UI. Clio offers to create a cluster when a user searches and finds nothing, or expresses an unmet need. The cluster form, AGGIL configuration fields, and Cluster Score view are not shown. At ~50k platform users, Path 1 (manual wizard) unlocks. See [`launch/phase_1/README.md`](file:///d:/Aggilo_Social/launch/phase_1/README.md).

---

## Three Paths to Cluster Creation

```mermaid
flowchart TD
    A["User wants a<br>new cluster"] --> B{"How?"}
    B -->|"Manual"| C["📝 4-Step Wizard<br>User fills AGGIL settings"]
    B -->|"Conversational"| D["🤖 Clio Agent<br>Natural language chat"]
    B -->|"AI-Discovered"| E["🔍 Scout Agent<br>Auto-creates trending clusters"]

    C --> F["🔍 Duplicate Check"]
    D --> F
    E --> F

    F --> G{"Similar cluster<br>exists?"}
    G -->|Yes| H["Show existing clusters<br>'Want to join instead?'"]
    H --> I{"User's choice"}
    I -->|"Join existing"| J["✅ User joins<br>existing cluster"]
    I -->|"Create anyway"| K["Discuss with Clio:<br>'What makes yours different?'"]
    K --> L{"Clio convinced<br>it's different?"}
    L -->|Yes| M["✅ Cluster Created"]
    L -->|No| N["Clio recommends joining<br>existing cluster instead"]
    G -->|No| M

    style A fill:#e94560,color:#fff
    style M fill:#4ecdc4,color:#000
    style J fill:#4ecdc4,color:#000
    style C fill:#1a1a2e,stroke:#e94560,color:#e0e0e8
    style D fill:#1a1a2e,stroke:#4ecdc4,color:#e0e0e8
    style E fill:#1a1a2e,stroke:#f9ca24,color:#e0e0e8
```

> [!WARNING]
> **⚡ Critical Rule — Duplicate Prevention:** Before ANY cluster is created (regardless of method), the system MUST check for existing clusters with similar AGGIL settings and topics. This prevents fragmentation and concentrates users into stronger communities.

---

## AGGIL Settings Configuration

Every cluster is defined by these dimensions. **Only Purpose, Name, and Description are required** — all AGGIL filters are available as advanced settings but not mandatory. Clio decides sensible defaults based on the user's demographics, interests, and interaction context.

| Dimension | Icon | Details |
|-----------|------|---------|
| **Purpose** | 💡 | Core reason for connection. Drives Scout discovery. **Required.** |
| **Language** | 🗣️ | 🌟 **Hero Feature.** Multi-language support. Primary + secondary. Soft match signal in Phase 1. |
| **Tags** | # | Multiple vibrant hashtags (Hooks). Captures emotions/needs. |
| **Age** | 🎂 | Year of Birth-based range. Manual or AI-suggested. *Optional — Clio suggests if needed.* |
| **Gender** | 👤 | Default: Anyone. Optional: restricted to specific gender. Privacy-gated. **Creator must match the selected gender if restricted.** *Optional — Clio suggests if needed.* |
| **Geography** | 📍 | Multiple Hyper-local locations (Building/Campus), Regional scope, GPS. *Optional — Clio suggests if needed.* |

---

## `MANUAL` Path 1: 4-Step Wizard

```mermaid
flowchart TD
    A["Tap 'Create Cluster' button"] --> B["Step 1: Purpose of Connection"]
    B --> C["Step 2: Add Tags<br>(multiple allowed)"]
    C --> D["Step 3: AGGIL Settings"]
    D --> D1["Age Range:<br>Manual entry OR<br>AI suggestion based on Year of Birth"]
    D --> D2["Gender:<br>Anyone (default)<br>Restricted to specific gender<br>(Creator must match)"]
    D --> D3["Location:<br>Hyper-local (Building/Street)<br>Named cities / areas<br>Region / state<br>GPS landmark + range"]
    D --> D4["Language:<br>Select supported languages"]
    D1 --> E["Step 4: Review + Cluster Score"]
    D2 --> E
    D3 --> E
    D4 --> E
    E --> F["Cluster Score: XX%<br>(quality indicator)"]
    F --> G["Tap 'Create'"]
    G --> H["🔍 Duplicate Check<br>(API call)"]
    H --> I{"Duplicates<br>found?"}
    I -->|No| J["✅ Cluster Created!<br>User is auto-joined as Founder"]
    I -->|Yes| K["Show similar clusters<br>'Join or create new?'"]

    style A fill:#e94560,color:#fff
    style J fill:#4ecdc4,color:#000
```

### Cluster Score — U-Shaped Intentionality Model

> [!IMPORTANT]
> **U-Shaped Scoring:** The Cluster Score rewards **intentionality**. Both hyper-narrow AND fully global clusters score HIGH — the muddled middle scores LOW. Clio coaches the creator toward deliberate choices through gamified prompts, never revealing the scoring mechanics.

| Factor | Weight | Description |
|--------|--------|-------------|
| Purpose Clarity & Vibrant Tags | 30% | Clear purpose + 3+ emotional/interest tags that tell a story |
| Intentionality Signal | 25% | U-shaped: hyper-narrow OR fully open = high; vague middle = low |
| Name + Description Quality | 20% | AI-assessed for clarity, uniqueness, and emotional resonance |
| Clio Confidence | 25% | How confidently Clio can serve this cluster — right people AND right content |

**Clio's Score Coaching (what the creator sees):**

| Score Zone | Clio's Response |
|-----------|----------------|
| 🔴 Low (0-40%) | *"This feels like it could be anything. What if you went sharper — or wider? Both work. The middle doesn't."* |
| 🟡 Medium (40-70%) | *"Getting there. Push it further and I'll find exactly the right people."* |
| 🟢 High (70-100%) | *"Now we're talking. I know exactly who to look for."* |
| 🟢🔥 Exceptional (90%+) | *"This is going to be a great cluster. I already have ideas for who should be here."* |

### UX Guidelines — Creation Wizard

> [!NOTE]
> **ℹ️ Progressive Disclosure:** Replace all inline "Note:" helper text throughout the creation flow with **ℹ️ info buttons** that expand on tap. The wizard should feel clean and uncluttered — details are available but not forced.
>
> **✕ Close Icon:** Replace the "Cancel" button with a **✕ icon** in the top corner. Tapping ✕ triggers a confirmation dialog: *"You have unsaved changes. Leave anyway?"* — preventing accidental abandonment of partially completed clusters.

---

## `CLIO` Path 2: Conversational Creation

```mermaid
sequenceDiagram
    participant U as 👤 User
    participant C as 🤖 Clio Agent
    participant DB as 🗄️ Database
    participant S as 🔍 Scout

    U->>C: "I want a cluster for people who love hiking near Hyderabad"
    C->>C: Extract intent: Interest=Hiking, Location=Hyderabad
    C->>DB: Search existing clusters (hiking + Hyderabad)
    DB-->>C: Found 1: "Trail Runners Hyd" (12 Connections)
    C->>U: "I found 'Trail Runners Hyd' with 12 Connections. Want to join, or create something different?"
    U->>C: "I want something specifically for weekend treks, not running"
    C->>C: Refine: Interest=Weekend Trekking (distinct from running)
    C->>U: "Got it! Let me set this up. A few questions:"
    C->>U: "1. Age range? I'd suggest 20-40 based on trekking activity patterns"
    U->>C: "Yes, that works"
    C->>U: "2. Open to all genders or specific?"
    U->>C: "All genders"
    C->>U: "3. Languages?"
    U->>C: "English and Telugu"
    C->>S: Get trending topics for trekking + Hyderabad + 20-40
    S-->>C: 3 trending topics found
    C->>U: "Here's what I've configured:<br>Name: Weekend Trekkers Hyderabad<br>Interest: Trekking, Hiking, Outdoors<br>Age: 20-40<br>Location: Hyderabad<br>Gender: All<br>Languages: English, Telugu<br>Cluster Score: 84%<br><br>I also found 3 discussions to seed:<br>1. Best monsoon treks near Ananthagiri<br>2. Gear checklist for Nallamala Hills<br>3. Safety tips for solo trekking<br><br>Ready to create?"
    U->>C: "Perfect, create it!"
    C->>DB: Create cluster with settings
    DB-->>C: Cluster created
    C->>U: "✅ 'Weekend Trekkers Hyderabad' is live! I've added 3 discussion starters. Share it to get your first Connections."
```

> [!NOTE]
> **🤖 Collaborative Clio:** Clio extracts AGGIL parameters from natural language and **deduces** the ideal settings. She then presents these for user acceptance or editing before proceeding to creation. The user remains the driver, with Clio providing deep-intelligence suggestions and seeding Scout-discovered topics.
>
> **Voice (per Character Bible):** Clio's conversational creation dialogue must follow `clio/SOUL.md` principles: she has *opinions* about cluster design ("I'd tighten the age range — broader sounds inclusive but it dilutes the signal"), she uses *specificity over warmth* ("Weekend treks, not running — that distinction matters"), and she gently *challenges* when duplicates are near-matches ("What makes yours different?"). She does NOT say "Got it!", "Amazing!", or manufacture urgency. Voice specifics are in the active `clio/personas/*/IDENTITY.md`.
>
> **Polite Deflection Rule (Conversational Path):** If the user asks Clio to do something outside her scope during creation (e.g., "write my cluster description for me" in a way that bypasses her voice), she must stay in character: *"I can draft it — but I'll need you to tell me why this group matters to you first. That's the part I can't guess."*
>
> **Scope constraint:** Clio will never use generic or template-sounding copy in cluster names or descriptions. Every field she fills must feel like it was written with knowledge of this specific group.

---

## `SCOUT` Path 3: AI Auto-Creation

```mermaid
flowchart TD
    A["Scout Agent<br>(runs every 6 hours)"] --> B["Crawl internet for<br>trending topics per<br>AGGIL segment"]
    B --> C["Score topics by<br>relevance to segment"]
    C --> D{"Relevance score<br>for user/segment?"}

    D -->|"≥90%"| E["Create cluster with<br>public shareable link"]
    E --> F["🔍 Duplicate Check"]
    F --> G{"Similar exists?"}
    G -->|Yes| H["Do NOT create.<br>Add topic as discussion<br>to existing cluster"]
    G -->|No| I["✅ Cluster created<br>with AI-seeded discussions"]
    I --> J["Appears in Dashboard<br>AGGIL Suggestions"]

    D -->|"<90%"| K["Show as suggestion card<br>on user's dashboard"]
    K --> L{"User taps<br>'Create this'?"}
    L -->|Yes| M["🔍 Duplicate Check"]
    M --> N{"Similar exists?"}
    N -->|Yes| O["Show similar clusters<br>User discusses with Clio"]
    N -->|No| P["✅ Cluster created<br>User is Founder"]
    L -->|No| Q["Card dismissed<br>or saved for later"]

    style A fill:#f9ca24,color:#000
    style I fill:#4ecdc4,color:#000
    style P fill:#4ecdc4,color:#000
    style H fill:#7b8cde,color:#fff
```

### Scout Auto-Creation Rules

| Rule | Detail |
|------|--------|
| Relevance ≥90% | Create cluster with public link. No user action needed. |
| Relevance <90% | Show as suggestion card. User decides. |
| Duplicate detected | Add the trending topic as a discussion to the existing cluster instead |
| No AI badge | AI-created clusters appear exactly like user-created ones. |
| No creator/founder | First active Connection can claim Founder status |

---

## 📍 Location Configuration — Deep Dive

```mermaid
flowchart TD
    A["Location Setting<br>during creation"] --> B{"Which mode?"}

    B -->|"Named"| C["Select specific cities/areas<br>e.g., Hyderabad + Bangalore"]
    B -->|"Regional"| D["Select state/country<br>e.g., Telangana or India"]
    B -->|"GPS"| E["Set landmark location<br>+ radius in km"]

    C --> F["Cluster visible to<br>all users in those cities"]
    D --> G["Cluster visible to<br>all users in that region"]
    E --> H["Cluster visible ONLY to<br>users who also share GPS<br>AND are within range<br>AND match demographics"]

    F --> I["✅ No special<br>privacy requirements"]
    G --> I
    H --> J["🔒 Mutual GPS opt-in<br>required from both sides"]

    style E fill:#f9ca24,color:#000
    style J fill:#e94560,color:#fff
```

> [!WARNING]
> **📍 GPS Landmark Rule:** The GPS range is measured from a *fixed landmark* (e.g., "Charminar" or "HITEC City"), NOT from the creator's live GPS position. Both cluster creator AND the visitor must have shared their GPS for the cluster to be visible.

---

## 🗣️ Language Configuration — Future Phase Spec

> [!NOTE]
> **Future Feature — not active in Phase 1.** The following documents the hard/soft language gate for a later release phase, when platform adoption supports the added cognitive complexity. In Phase 1, language is a soft-match signal only — it improves cluster ranking but never blocks visibility.

When this feature ships, each cluster will support a per-language hard/soft toggle:

| Gate Type | Behaviour | Use Case |
|---|---|---|
| **Hard** | Language is an eligibility requirement. User must speak this language to see and join the cluster. English does NOT bypass a hard gate. | Language is core to the cluster's identity — e.g., Telugu poetry circle, Marathi debate group |
| **Soft** | Language is a preference signal. Improves match ranking but does not block. | Most everyday clusters where language context is helpful but not defining |
| **Multiple hard (OR logic)** | User must speak at least one of the hard-gated languages. AND logic is never used — it would shrink eligible pools to near zero. | Broader communities serving any speakers of regional languages |

**Constraints:**
- Up to 2 languages per cluster
- Post-spawn: language gate tightening is blocked — same principle as age/gender (no retroactive harm to existing Connections)
- Engineer's Note #6 (language hard gate) is shown to founders the first time they set a hard language gate

**Phased activation trigger:** When product team judges that the platform's user base is mature enough that an additional gate in cluster creation won't create cognitive overload or reduce cluster formation rates.

---

## Cluster Properties & Rules

| Property | Value | Notes |
|----------|-------|-------|
| Clusters per user | **Unlimited** | No cap for free or premium users |
| Connections per cluster | **Unlimited** | No minimum or maximum |
| Cluster deletion | **Not allowed** | Once created, clusters persist forever |
| Connection removal | **Not allowed** | Creators cannot remove Connections |
| Interest tags | **Multiple** | Clusters can have many interest tags |
| Aging out | **Never** | Creator never ages out of own cluster |
| Age progression | **Dynamic** | Connection ages change as Year of Birth progresses; cluster persists |

---

## Post-Spawn Editing Rules

Once a cluster has Connections, the Founder enters **Window 2 (Post-Spawn)** refinement. The governing principle: **no change may retroactively harm, eject, or disadvantage a Connection who joined in good faith.** Clio enforces these rules automatically and will not process a disallowed change.

| Property | Allowed Post-Spawn? | Constraint |
|----------|--------------------|----|
| Description text & tone | ✅ Yes | No restriction |
| Seed questions | ✅ Yes | Full rewrite allowed |
| Interest tags — add / broaden | ✅ Yes | Can only expand discoverability, not restrict it |
| Cluster name | ✅ Yes | Clio notifies existing Connections of the change |
| Interest tags — narrow / remove | ❌ No | Would disadvantage Connections who joined for those tags |
| Age range — tighten | ❌ No | Would retroactively exclude current Connections |
| Gender filter — add restriction | ❌ No | Cannot apply to a cluster Connections joined as open |
| Core topic pivot | ❌ No | Changes the fundamental identity Connections agreed to |
| Geographic scope — tighten | ❌ No | May exclude Connections in previously valid zones |

> [!NOTE]
> **Clio's enforcement behaviour:** When a Founder requests a disallowed change, Clio explains the Connection-protection principle once, offers alternatives within the allowed scope, and stops. She does not lecture. Pre-spawn (Stages 01–02), all parameters remain fully editable — the constraint only applies after the first Connection joins.



## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `POST /api/cluster/create` | POST | Create a new cluster with AGGIL settings |
| `POST /api/cluster/check-duplicate` | POST | Check for similar existing clusters |
| `GET /api/cluster/score` | GET | Calculate cluster quality score |
| `POST /api/clio/chat` | POST | Send message to Clio for conversational creation |
| `GET /api/scout/suggestions` | GET | Get Scout-generated cluster suggestions |
| `POST /api/scout/claim-founder` | POST | Claim Founder status on an AI-created cluster |

---

*← [Registration](01_registration_onboarding.md) · [Next: Discovery & Joining →](03_cluster_discovery.md)*
