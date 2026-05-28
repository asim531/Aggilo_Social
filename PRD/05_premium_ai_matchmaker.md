# 💎 Workflow 5: Premium & AI Matchmaker

> Subscription flow, AI-powered people matching, private clusters, and payment integration

> [!WARNING]
> **Phase 1 Constraint:** Premium tier, pricing, and all upsell UI are **NOT visible** to users until significant platform adoption (~100k users). No pricing information appears on the landing page, in the app, or in any Phase 1 marketing material. Premium features are built but not surfaced.

`PRD — Aggilo Social Network — MONETIZATION`

---

## Free vs Premium Comparison

### 🆓 Free — ₹0 forever
- ✅ Unlimited cluster creation
- ✅ Unlimited cluster joining
- ✅ Basic AI cluster suggestions (Scout)
- ✅ Basic Clio conversation for creation
- ✅ Timeline + DMs in all clusters (DM acceptance makes members into Connections)
- ✅ Direct messaging
- ✅ Text + image posts
- ❌ No private AI matchmaker chat
- ❌ No AI preference learning
- ❌ No private premium clusters
- ✅ Can *see* AI matchmaker questionnaires
- ✅ Can *see* AI matchmaker questionnaires
- ❌ Cannot join private premium clusters (Hits paywall)

### ⭐ Premium — ₹300/month
- ✅ Everything in Free
- ⭐ **Private AI matchmaker chat**
- ⭐ **AI learns your preferences** over time
- ⭐ **AI suggests relevant people** to connect with
- ⭐ **Create private premium clusters**
- ⭐ **Questionnaires** sent to potential matches
- ⭐ **Complete control** over AI chat settings
- ⭐ **Priority Scout discovery**
- ⭐ **Connection limits** — optional cap on cluster Connectionship
- ⭐ **Voice/video calling** — in-cluster voice and video calls between Connections
- ⭐ **Cluster templates** — pre-configured templates for common use cases (medical, professional, study groups, etc.)

> [!IMPORTANT]
> **🔑 Key Design Decision:** Free users CAN see questionnaires from premium users, but MUST upgrade to join the resulting private premium cluster. This hard paywall drives the upgrade funnel without letting Free users bypass the Premium value proposition.

---

## Subscription Flow

```mermaid
flowchart TD
    A["User sees premium<br>upsell prompt or<br>taps 'Go Premium'"] --> B["Premium Benefits Screen:<br>AI matchmaker, preference learning,<br>private clusters, priority discovery"]
    B --> C["Tap 'Subscribe ₹300/month'"]
    C --> D{"Payment method"}
    D -->|"UPI/Razorpay"| E["Razorpay payment page<br>UPI / Card / Net Banking"]
    D -->|"Google Play"| F["Google Play<br>in-app purchase"]
    E --> G{"Payment<br>successful?"}
    F --> G
    G -->|No| H["❌ Payment failed<br>Retry or choose<br>different method"]
    H --> D
    G -->|Yes| I["✅ Premium Activated"]
    I --> J["Badge: '⭐ Premium'<br>on user profile"]
    J --> K["AI Matchmaker chat<br>becomes available<br>in bottom nav"]

    style I fill:#f9ca24,color:#000
    style K fill:#4ecdc4,color:#000
```

### Subscription Management

| Event | Handling |
|-------|---------|
| Subscription active | Auto-renews monthly. User gets 24hr reminder notification before renewal. |
| Cancellation | Premium features remain until end of billing period. Private clusters stay accessible. |
| Payment failure | 3-day grace period with retry. After 3 days, downgrade to Free with data preserved. |
| Re-subscription | All premium data (preference learning, private clusters) is restored. |

---

## 🤖 AI Matchmaker — Complete Flow

> [!NOTE]
> **🎭 Identity Clarification:** The AI Matchmaker **is Clio** in premium mode — same character, same voice, same SOUL.md principles. Free users get Clio for cluster creation and platform questions (`cluster_creation` + `platform_qa` skills). Premium users get Clio with the `premium_matchmaker` skill activated: persistent memory, preference learning, person-to-person suggestions, questionnaire dispatch, and private cluster creation. There is **one AI** in Aggilo, not two. The Matchmaker label describes what she can *do* at premium tier, not who she *is*.

```mermaid
sequenceDiagram
    participant P as ⭐ Premium User
    participant AI as 🤖 AI Matchmaker
    participant DB as 🗄️ Database
    participant T as 👤 Target User (Free or Premium)

    P->>AI: "I want to find co-founders for a food tech startup in Hyderabad"
    AI->>AI: Extract: Purpose=Food Tech Startup, Age=22-30, Location=Hyderabad, Languages=English+Hindi
    AI->>DB: Query users matching AGGIL criteria
    DB-->>AI: Found 15 matching users
    AI->>AI: Score by preference alignment + activity level
    AI->>P: "I found 15 potential matches. I'll send them a questionnaire to gauge interest. Here's what I'll ask:"
    AI->>P: "1. Are you interested in food tech? 2. Have you considered co-founding? 3. What skills do you bring?"
    P->>AI: "Looks good, send it"

    AI->>T: Questionnaire notification (in-app push)
    Note over T: Target user can be Free OR Premium
    T->>AI: Fills questionnaire
    AI->>AI: Evaluate responses, rank by fit
    AI->>P: "8 of 15 responded. Top 3 matches: NicknameA (92% fit), NicknameB (87% fit), NicknameC (81% fit)"
    P->>AI: "Create a private cluster with top 3"
    AI->>DB: Create private premium cluster
    DB-->>AI: Cluster created
    AI->>T: "You've been invited to 'Food Tech Founders HYD' — a premium cluster"
    Note over T: Free users hit a paywall and must upgrade to join
    T->>DB: Upgrades & Joins cluster
    AI->>P: "✅ 'Food Tech Founders HYD' is live with 4 Connections"
```

---

## 🧠 AI Preference Learning (Premium Only)

```mermaid
flowchart TD
    A["Premium user<br>interacts with AI"] --> B["AI tracks<br>(generalized basis)"]
    B --> C["What topics they ask about"]
    B --> D["What age groups they prefer"]
    B --> E["What locations they target"]
    B --> F["What questionnaire responses<br>they liked/disliked"]
    B --> G["Which matches they<br>actually engaged with"]

    C --> H["Preference Model<br>(per user)"]
    D --> H
    E --> H
    F --> H
    G --> H

    H --> I["Over time, AI suggestions<br>become more accurate"]
    I --> J["Better cluster suggestions"]
    I --> K["Better people matches"]
    I --> L["More relevant trending topics"]

    style H fill:#f9ca24,color:#000
```

> [!NOTE]
> **⚡ Generalized Learning:** AI learns preferences on a *generalized basis* — it doesn't track browsing behavior or external activity. It only learns from interactions WITHIN Aggilo: chats, questionnaire preferences, cluster joins, purpose/topic tags.

---

## 🔒 Private Premium Cluster Rules

| Rule | Detail |
|------|--------|
| Created by | Premium users only (via AI matchmaker) |
| Visible to | Only invited Connections — never appears in search or suggestions |
| Who can join | Premium users only. Free users hit a paywall if invited via match. |
| Content | Same as regular clusters (feed + chat + DM) |
| Deletion | Cannot be deleted (same as regular clusters) |
| Connection removal | Cannot remove Connections (same as regular clusters) |
| If creator downgrades | Cluster remains accessible. No new private clusters can be created. |

---

## 📈 Free → Premium Conversion Triggers

```mermaid
flowchart TD
    A["Free User"] --> B{"Trigger Events"}

    B --> C["Receives questionnaire<br>from premium user"]
    B --> D["Sees premium badge<br>on interesting user"]
    B --> E["Push notification:<br>'You've been active 30 days.<br>Get AI matchmaking for ₹300/mo'"]
    B --> F["Wants to find specific<br>type of person<br>but can't initiate matchmaking"]

    C --> G["Attempts to join private cluster<br>(hits paywall)"]
    G --> H["Experiences FOMO over<br>targeted Premium match"]
    H --> I["Wants to access the specific match<br>and initiate their own"]
    I --> J["💎 Upgrades to Premium"]

    D --> I
    E --> I
    F --> I

> [!NOTE]
> **Conversion Trigger Messaging Rule:** The push notification trigger ("You've been active 30 days. Get AI matchmaking for ₹300/mo") must be rewritten to use Clio's voice:
> - ❌ Not this: *"Upgrade to Premium for AI-powered matchmaking."*
> - ✅ This: *"You've been showing up for 30 days. I've noticed the kind of connections you're after. I can do more — if you want me to."*
> Marketing and push notifications must never name the mechanism (AI matchmaker). They must describe the human outcome (finding the right person / finding your co-founder).

    style J fill:#f9ca24,color:#000
```

---

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `POST /api/premium/subscribe` | POST | Initiate premium subscription |
| `POST /api/premium/cancel` | POST | Cancel subscription |
| `GET /api/premium/status` | GET | Check subscription status |
| `POST /api/matchmaker/chat` | POST | Send message to AI matchmaker |
| `POST /api/matchmaker/questionnaire` | POST | Create + send questionnaire to matches |
| `POST /api/matchmaker/questionnaire/{id}/respond` | POST | Submit questionnaire response |
| `POST /api/matchmaker/private-cluster` | POST | Create private cluster from matched users |
| `POST /api/payment/razorpay/create-order` | POST | Create Razorpay payment order |
| `POST /api/payment/razorpay/verify` | POST | Verify Razorpay payment |
| `POST /api/payment/google-play/verify` | POST | Verify Google Play purchase |

---

*← [In-Cluster Experience](04_in_cluster_experience.md) · [Next: AI Agents →](06_ai_agents.md)*
