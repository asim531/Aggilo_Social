# Waitlist Intelligence Dashboard — Spec
## Aggilo Platform Admin · `/admin/aggilo/waitlist`

> **Status:** Spec — ready for implementation.
> **Authority:** Subordinate to `AGGILO_SOUL.md`, `AGGILO_PLATFORM_RULES.md`,
> `architecture/system_implementation_prompt_part6.md`,
> `docs/AGGILO_ADMIN_DASHBOARD_SPEC.md`.
> **Scope:** Production platform admin surface only. No MVP/Phase 0 code.
> **Location:** Spec lives in `docs/WAITLIST_INTELLIGENCE_SPEC.md`.
> Code lives in the production platform admin routes.

---

## 0. Extended Thinking — What This Spec Resolves

### The Problem

Waitlist submissions from `aggilo.in` arrive as plain-text emails to two inboxes:
- `mypeople@aggilo.in` — "Find My People" form (8-screen Evangelist Form)
- `mycrowd@aggilo.in` — "Make Your Crowd" form (BYC flow)

The admin reads each email manually and decides whether to send an invite.
There is no scoring, no prioritisation, no pattern visibility across submissions,
and no way to see which segments are accumulating demand.

### What This Spec Builds

A PHP-powered AI scoring layer that runs at form submission time, writes
structured data + scores to Supabase, and surfaces a decision-support
dashboard in the production platform admin. The admin still sends invites
manually — the dashboard gives them the intelligence to decide who, when,
and in what order.

### Decision Log

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Where scoring runs | PHP script (same server as mailer) | No new infra; DeepSeek API already wired |
| LLM provider | DeepSeek (existing API key) | Already in use for agent prompts |
| Data storage | PHP dual-write: email + Supabase | Preserves existing email flow; adds DB |
| Dashboard location | `/admin/aggilo/waitlist` in production admin | Fits AGGILO_ADMIN_DASHBOARD_SPEC nav |
| Invite mechanism | Manual (admin uses scores to prioritise) | Phase 1 — automated invites deferred |
| Score dimensions | 4 scores per submission (see §3) | Covers all admin decision factors |

---

## 1. Data Flow Overview

```
Landing page form submit (JS)
    │
    ▼
PHP mailer script (existing)
    ├── Sends email to mypeople@aggilo.in or mycrowd@aggilo.in  ← unchanged
    └── NEW: calls DeepSeek API for scoring
            │
            ▼
        Scoring response (JSON)
            │
            ▼
        Supabase INSERT → waitlist_submissions table
            │
            ▼
        Admin dashboard reads waitlist_submissions
            │
            ▼
        Admin reviews scores → decides to invite → sends email manually
```

The email flow is **not changed**. The PHP script gains two new steps after
sending the email: call DeepSeek, then write to Supabase.

---

## 2. Form Data Captured

### 2.1 Find My People Form (mypeople@aggilo.in)

Email fields received (confirmed from live email format):

| Field | Raw key | Example value |
|-------|---------|---------------|
| Name | `Name` | `dfgdfg` |
| Email | `Email` | `dfgdf@ss.com` |
| Birth year | `Birth year` | `1996` |
| Life cohort | `Life cohort` | `intimacy` |
| Gender | `Gender` | `M` |
| Languages | `Languages` | `english` |
| Interest domain | `Interest domain` | `tech` |
| Location | `Location` | `GPS:17.3576,78.3990` |
| GPS coordinates | `GPS co-ordinates` | `17.35763272492, 78.39897149684` |
| Gathering sought | `Gathering sought` | free text |
| Duration of search | `Duration of search` | `weeks` |
| Platforms tried | `Platforms tried` | `apps` |
| Form version | `Form version` | `v3` |
| Submitted at | `Submitted at` | ISO8601 timestamp |

### 2.2 Make Your Crowd Form (mycrowd@aggilo.in)

| Field | Raw key | Example value |
|-------|---------|---------------|
| Name | `Name` | free text |
| Email | `Email` | email |
| Activity description | `Activity` | free text (what they do together) |
| Group size | `Size` | integer |
| Current platforms | `Platforms` | multi-select |
| What's broken | `Broken` | free text |
| Location | `Location` | free text (building/street/campus) |
| Languages | `Languages` | multi-select |
| Age range min | `Age min` | integer |
| Age range max | `Age max` | integer |
| Gender mix | `Gender mix` | Everyone / Men / Women |
| Timeline | `Timeline` | this week / 2 weeks / month / not sure |
| Form version | `Form version` | `v3` |
| Submitted at | `Submitted at` | ISO8601 timestamp |

---

## 3. The Four Scores

Every submission receives four scores, computed by DeepSeek at submission time.
Scores are 0–100 integers. All four are stored in Supabase and displayed in the
dashboard. The admin sees all four simultaneously — no single score is the
"right" answer; the combination tells the story.

### Score 1 — Engagement Probability (0–100)

**Question:** If invited today, how likely is this person to become an active
member (posts at least once in their first 14 days)?

**Signals DeepSeek weighs:**
- Duration of search: `always` > `years` > `months` > `weeks` (longer = more motivated)
- Platforms tried: tried multiple and found them lacking = higher intent
- Gathering description quality: specific, textured, emotionally honest = higher
- Life cohort: `building` and `transition` tend toward higher engagement than `curious`
- Gender + birth year: cross-referenced against known active demographic segments
- Languages: multilingual users tend toward higher engagement in India context

**Interpretation:**
- 80–100: High confidence — invite soon
- 60–79: Good signal — invite in next cohort
- 40–59: Moderate — worth watching; may need a cluster to exist first
- 0–39: Low — either too early or misaligned

### Score 2 — Cluster Viability (0–100)

**Question:** Can Clio actually build a room for this person given what they've
described, and is there likely enough density in the waitlist to form a cluster?

**Signals DeepSeek weighs:**
- Location specificity: GPS coordinates = high viability; vague city = lower
- Interest domain: mainstream domains (tech, career) have more density; niche = lower
  viability but higher niche score (see Score 3)
- Gathering description: does it map to a real AGGIL cluster configuration?
- Age + gender: does the demographic exist in sufficient numbers in that city?
- Languages: Telugu/Kannada/Tamil in their respective cities = high viability

**Interpretation:**
- 80–100: A cluster can be built now or very soon
- 60–79: Viable with 2–3 more similar submissions
- 40–59: Possible but needs more density — flag for future cohort
- 0–39: Too sparse or too vague to build around

### Score 3 — Niche Score (0–100)

**Question:** How specific and underserved is this person's need?

**This is NOT the U-shaped cluster score.** The U-shaped score rewards both
hyper-narrow AND fully global. The Niche Score here rewards only the
hyper-narrow end — it is a signal of how rare and specific this person's
need is, which determines how much value Aggilo uniquely provides them
(vs. them finding their people on a generic platform).

**Signals DeepSeek weighs:**
- Gathering description specificity: "urban farming within 5km" = 90+;
  "people to hang out with" = 10
- Interest domain + life cohort combination: unusual combinations score higher
- Location precision: hyper-local (campus, street) = higher niche
- Languages: non-English primary language in a specific city = higher niche
- Duration: `always` + specific description = very high niche (they've been
  looking a long time because it genuinely doesn't exist elsewhere)

**Note on U-shaped scoring:** When Niche Score is very low (0–20), the admin
should consider whether this person is actually a "fully global" case — someone
who wants maximum variety and serendipity. The dashboard flags this explicitly
(see §5.3). Both extremes are valid; the middle is not.

**Interpretation:**
- 80–100: Hyper-niche — Aggilo is the only platform that can serve this
- 60–79: Specific enough to be meaningful
- 40–59: Moderate specificity — could find this elsewhere but Aggilo does it better
- 0–39: Generic — low differentiation; flag for U-shape check

### Score 4 — Founder Quality (0–100)
*Only computed for Make Your Crowd (mycrowd) submissions. Set to null for
Find My People submissions.*

**Question:** How credible is this person as a Premium Cluster founder?

**Signals DeepSeek weighs (per AGGILO_PLATFORM_RULES.md credibility criteria):**
- Existing community evidence (30%): group size, platforms used, activity description
- Unmet need specificity (25%): how clearly they articulate what's broken
- Demographic coherence (20%): does the described group map to a real AGGIL config?
- Platform fit (15%): does Aggilo solve their specific problem better than alternatives?
- Commitment signal (10%): timeline urgency, quality of "what's broken" answer

**Interpretation:**
- 80–100: Strong founder — prioritise for Premium Cluster
- 60–79: Good candidate — invite and evaluate further
- 40–59: Possible — needs more information
- 0–39: Not ready — either too small, too vague, or problem doesn't fit Aggilo

---

## 4. Database Schema

### 4.1 `waitlist_submissions` Table

```sql
CREATE TABLE IF NOT EXISTS public.waitlist_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Source routing
  form_type VARCHAR(16) NOT NULL,
    -- 'find_my_people' | 'make_your_crowd'
  inbox VARCHAR(64) NOT NULL,
    -- 'mypeople@aggilo.in' | 'mycrowd@aggilo.in'
  form_version VARCHAR(8) DEFAULT 'v3',

  -- Identity (PII — handle per DPDPA)
  name VARCHAR(128),
  email VARCHAR(256) NOT NULL,

  -- AGGIL signals (Find My People)
  birth_year INT,
  gender VARCHAR(4),
    -- 'M' | 'F' | 'NB'
  languages TEXT[],
  interest_domain VARCHAR(64),
  life_cohort VARCHAR(64),
    -- 'newarrival' | 'transition' | 'rootedbutmissing' | 'building' | 'curious'
  location_raw TEXT,
    -- raw GPS string or city text
  latitude DECIMAL(10, 7),
  longitude DECIMAL(10, 7),
  city VARCHAR(128),
  country VARCHAR(64),
  gathering_description TEXT,
    -- free-text: what kind of room they want
  duration_of_search VARCHAR(16),
    -- 'weeks' | 'months' | 'years' | 'always'
  platforms_tried TEXT[],

  -- Make Your Crowd fields
  activity_description TEXT,
  group_size INT,
  current_platforms TEXT[],
  whats_broken TEXT,
  location_text VARCHAR(256),
  age_range_min INT,
  age_range_max INT,
  gender_mix VARCHAR(16),
    -- 'everyone' | 'men' | 'women'
  timeline VARCHAR(32),

  -- AI Scores (0–100 integers; null = not applicable)
  score_engagement INT,
  score_cluster_viability INT,
  score_niche INT,
  score_founder_quality INT,
    -- null for find_my_people submissions

  -- AI reasoning (short summaries, not full chain-of-thought)
  reasoning_engagement TEXT,
  reasoning_cluster_viability TEXT,
  reasoning_niche TEXT,
  reasoning_founder_quality TEXT,

  -- U-shape flag
  is_global_case BOOLEAN DEFAULT FALSE,
    -- true when niche score < 20 AND DeepSeek infers fully-open intent

  -- Admin workflow
  admin_status VARCHAR(32) DEFAULT 'pending',
    -- 'pending' | 'shortlisted' | 'invited' | 'deferred' | 'rejected'
  admin_notes TEXT,
  admin_actioned_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  admin_actioned_at TIMESTAMPTZ,
  invite_sent_at TIMESTAMPTZ,

  -- Scoring metadata
  scoring_model VARCHAR(64) DEFAULT 'deepseek-chat',
  scoring_latency_ms INT,
  scoring_error TEXT,
    -- populated if DeepSeek call failed; submission still saved

  -- Timestamps
  submitted_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_waitlist_form_type ON public.waitlist_submissions(form_type, admin_status);
CREATE INDEX idx_waitlist_submitted ON public.waitlist_submissions(submitted_at DESC);
CREATE INDEX idx_waitlist_scores ON public.waitlist_submissions(score_engagement DESC, score_niche DESC);
CREATE INDEX idx_waitlist_location ON public.waitlist_submissions(city, country);
```

### 4.2 RLS

```sql
ALTER TABLE public.waitlist_submissions ENABLE ROW LEVEL SECURITY;

-- Only platform_admin can read or write
CREATE POLICY "platform_admin_full_access"
  ON public.waitlist_submissions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'platform_admin'
    )
  );
```

### 4.3 `waitlist_aggregate_stats` View

A materialised view for the dashboard summary strip. Refreshed on each INSERT.

```sql
CREATE OR REPLACE VIEW public.waitlist_aggregate_stats AS
SELECT
  COUNT(*) FILTER (WHERE admin_status = 'pending')        AS pending_count,
  COUNT(*) FILTER (WHERE admin_status = 'shortlisted')    AS shortlisted_count,
  COUNT(*) FILTER (WHERE admin_status = 'invited')        AS invited_count,
  COUNT(*) FILTER (WHERE form_type = 'find_my_people')    AS fmp_count,
  COUNT(*) FILTER (WHERE form_type = 'make_your_crowd')   AS myc_count,
  ROUND(AVG(score_engagement))                            AS avg_engagement,
  ROUND(AVG(score_niche))                                 AS avg_niche,
  COUNT(*) FILTER (WHERE score_engagement >= 80)          AS high_engagement_count,
  COUNT(*) FILTER (WHERE score_niche >= 80)               AS high_niche_count,
  COUNT(*) FILTER (WHERE is_global_case = TRUE)           AS global_case_count
FROM public.waitlist_submissions;
```

---

## 5. PHP Scoring Script

### 5.1 Modified PHP Mailer — New Steps

The existing PHP mailer sends the email, then executes two new steps:

```php
// Step 1: existing — send email (unchanged)
mail($to, $subject, $body, $headers);

// Step 2: NEW — call DeepSeek for scoring
$scores = scoreSubmissionWithDeepSeek($formData);

// Step 3: NEW — write to Supabase
writeToSupabase($formData, $scores);
```

Both new steps are **fire-and-forget with graceful degradation**:
- If DeepSeek fails: submission is still saved to Supabase with `scoring_error` populated
  and all score fields set to null. The email still goes out.
- If Supabase write fails: email still goes out. Error is logged to PHP error log.
- Neither failure blocks the user's form confirmation.

### 5.2 DeepSeek Scoring Prompt

The PHP script sends a single DeepSeek API call per submission. The prompt
assembles all form fields and requests all applicable scores in one JSON response.
This minimises latency and API cost.

**System message:**
```
You are an AI analyst for Aggilo, an AI-native social network that builds
interest-based micro-communities (called "clusters") segmented by Age, Gender,
Geography, Interest, and Language (the AGGIL engine).

Your job is to score a waitlist submission to help the admin decide whether
and when to invite this person. You must return a valid JSON object only —
no explanation, no markdown, no preamble.

Scoring rules:
- All scores are integers 0–100.
- score_engagement: probability this person becomes an active member if invited.
  Higher for: long search duration, multiple platforms tried, specific gathering
  description, building/transition life cohort.
- score_cluster_viability: can Aggilo actually build a cluster for this person
  given their location, interest, and demographic? Higher for: GPS location,
  specific interest, mainstream demographic in a known city.
- score_niche: how specific and underserved is this need? Higher for: hyper-local,
  unusual interest+demographic combination, long search duration, non-English
  primary language in a specific city. This is NOT the U-shaped score — it rewards
  only the hyper-narrow end.
- score_founder_quality: only for make_your_crowd submissions. How credible is
  this person as a Premium Cluster founder? Score based on: group size and
  evidence (30%), clarity of unmet need (25%), demographic coherence (20%),
  platform fit (15%), timeline urgency (10%). Set to null for find_my_people.
- is_global_case: set to true ONLY if score_niche < 20 AND the gathering
  description suggests the person wants maximum variety and serendipity
  (not a specific niche). This flags the U-shaped opposite case.
- reasoning_*: one sentence each explaining the score. Be specific — reference
  actual field values. Do not be generic.

Return exactly this JSON structure:
{
  "score_engagement": integer,
  "score_cluster_viability": integer,
  "score_niche": integer,
  "score_founder_quality": integer or null,
  "is_global_case": boolean,
  "reasoning_engagement": "string",
  "reasoning_cluster_viability": "string",
  "reasoning_niche": "string",
  "reasoning_founder_quality": "string or null"
}
```

**User message (assembled from form fields):**
```
Form type: {find_my_people|make_your_crowd}

[Find My People fields:]
Name: {name}
Birth year: {birth_year}
Gender: {gender}
Languages: {languages}
Interest domain: {interest_domain}
Life cohort: {life_cohort}
Location: {location_raw}
Gathering sought: {gathering_description}
Duration of search: {duration_of_search}
Platforms tried: {platforms_tried}

[Make Your Crowd fields (if applicable):]
Activity description: {activity_description}
Group size: {group_size}
Current platforms: {current_platforms}
What's broken: {whats_broken}
Location: {location_text}
Languages: {languages}
Age range: {age_range_min}–{age_range_max}
Gender mix: {gender_mix}
Timeline: {timeline}
```

### 5.3 PHP Implementation Skeleton

```php
<?php
function scoreSubmissionWithDeepSeek(array $formData): array {
    $apiKey = getenv('DEEPSEEK_API_KEY');
    $endpoint = 'https://api.deepseek.com/v1/chat/completions';

    $userMessage = buildScoringUserMessage($formData);

    $payload = json_encode([
        'model' => 'deepseek-chat',
        'messages' => [
            ['role' => 'system', 'content' => DEEPSEEK_SCORING_SYSTEM_PROMPT],
            ['role' => 'user',   'content' => $userMessage]
        ],
        'temperature' => 0.2,  // Low temperature — we want consistent scoring
        'max_tokens'  => 400,
        'response_format' => ['type' => 'json_object']
    ]);

    $start = microtime(true);
    $ch = curl_init($endpoint);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => $payload,
        CURLOPT_HTTPHEADER     => [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $apiKey
        ],
        CURLOPT_TIMEOUT        => 15  // 15s timeout — don't block form submission
    ]);

    $response = curl_exec($ch);
    $latencyMs = (int)((microtime(true) - $start) * 1000);
    $error = curl_error($ch);
    curl_close($ch);

    if ($error || !$response) {
        return ['error' => $error ?: 'No response', 'latency_ms' => $latencyMs];
    }

    $decoded = json_decode($response, true);
    $content = $decoded['choices'][0]['message']['content'] ?? null;
    if (!$content) {
        return ['error' => 'Empty content', 'latency_ms' => $latencyMs];
    }

    $scores = json_decode($content, true);
    $scores['latency_ms'] = $latencyMs;
    return $scores;
}

function writeToSupabase(array $formData, array $scores): void {
    $supabaseUrl  = getenv('SUPABASE_URL');
    $supabaseKey  = getenv('SUPABASE_SERVICE_ROLE_KEY');
    $endpoint     = $supabaseUrl . '/rest/v1/waitlist_submissions';

    $row = [
        'form_type'               => $formData['form_type'],
        'inbox'                   => $formData['inbox'],
        'form_version'            => $formData['form_version'] ?? 'v3',
        'name'                    => $formData['name'] ?? null,
        'email'                   => $formData['email'],
        'birth_year'              => isset($formData['birth_year']) ? (int)$formData['birth_year'] : null,
        'gender'                  => $formData['gender'] ?? null,
        'languages'               => isset($formData['languages']) ? '{' . implode(',', (array)$formData['languages']) . '}' : null,
        'interest_domain'         => $formData['interest_domain'] ?? null,
        'life_cohort'             => $formData['life_cohort'] ?? null,
        'location_raw'            => $formData['location_raw'] ?? null,
        'latitude'                => $formData['latitude'] ?? null,
        'longitude'               => $formData['longitude'] ?? null,
        'city'                    => $formData['city'] ?? null,
        'country'                 => $formData['country'] ?? null,
        'gathering_description'   => $formData['gathering_description'] ?? null,
        'duration_of_search'      => $formData['duration_of_search'] ?? null,
        'platforms_tried'         => isset($formData['platforms_tried']) ? '{' . implode(',', (array)$formData['platforms_tried']) . '}' : null,
        // MYC fields
        'activity_description'    => $formData['activity_description'] ?? null,
        'group_size'              => isset($formData['group_size']) ? (int)$formData['group_size'] : null,
        'current_platforms'       => isset($formData['current_platforms']) ? '{' . implode(',', (array)$formData['current_platforms']) . '}' : null,
        'whats_broken'            => $formData['whats_broken'] ?? null,
        'location_text'           => $formData['location_text'] ?? null,
        'age_range_min'           => isset($formData['age_range_min']) ? (int)$formData['age_range_min'] : null,
        'age_range_max'           => isset($formData['age_range_max']) ? (int)$formData['age_range_max'] : null,
        'gender_mix'              => $formData['gender_mix'] ?? null,
        'timeline'                => $formData['timeline'] ?? null,
        // Scores
        'score_engagement'        => $scores['score_engagement'] ?? null,
        'score_cluster_viability' => $scores['score_cluster_viability'] ?? null,
        'score_niche'             => $scores['score_niche'] ?? null,
        'score_founder_quality'   => $scores['score_founder_quality'] ?? null,
        'is_global_case'          => $scores['is_global_case'] ?? false,
        'reasoning_engagement'    => $scores['reasoning_engagement'] ?? null,
        'reasoning_cluster_viability' => $scores['reasoning_cluster_viability'] ?? null,
        'reasoning_niche'         => $scores['reasoning_niche'] ?? null,
        'reasoning_founder_quality'   => $scores['reasoning_founder_quality'] ?? null,
        'scoring_model'           => 'deepseek-chat',
        'scoring_latency_ms'      => $scores['latency_ms'] ?? null,
        'scoring_error'           => $scores['error'] ?? null,
        'submitted_at'            => $formData['submitted_at'] ?? date('c'),
    ];

    $ch = curl_init($endpoint);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => json_encode($row),
        CURLOPT_HTTPHEADER     => [
            'Content-Type: application/json',
            'apikey: ' . $supabaseKey,
            'Authorization: Bearer ' . $supabaseKey,
            'Prefer: return=minimal'
        ],
        CURLOPT_TIMEOUT        => 10
    ]);
    curl_exec($ch);
    curl_close($ch);
}
?>
```

### 5.4 Environment Variables (add to PHP server)

```
DEEPSEEK_API_KEY=your-deepseek-api-key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

---

## 6. Dashboard — `/admin/aggilo/waitlist`

This section is added to the production platform admin navigation under
`AGGILO_ADMIN_DASHBOARD_SPEC.md`. It is visible to `platform_admin` only.

### 6.1 Navigation Addition

```
Aggilo Admin
├── Findings
├── Demand
├── Tool proposals
├── Runtime
├── LLM observability
├── Clusters
├── Members
├── Skills registry
├── Platform settings
├── Audit
└── Waitlist ← NEW  (/admin/aggilo/waitlist)
```

### 6.2 Page Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│  Waitlist Intelligence                                               │
│  [Find My People ▾]  [Make Your Crowd ▾]  [All]   [Export CSV]     │
├─────────────────────────────────────────────────────────────────────┤
│  SUMMARY STRIP                                                       │
│  Pending: 47  │  Shortlisted: 12  │  Invited: 8  │  Total: 67      │
│  Avg Engagement: 64  │  Avg Niche: 71  │  High-niche (80+): 19     │
│  Global cases: 3  │  FMP: 51  │  MYC: 16                           │
├─────────────────────────────────────────────────────────────────────┤
│  FILTERS                                                             │
│  Status: [All ▾]  Form: [All ▾]  City: [All ▾]  Interest: [All ▾] │
│  Sort: [Niche ▾]  Min score: [—]                                    │
├─────────────────────────────────────────────────────────────────────┤
│  SUBMISSION CARDS (sorted by selected sort)                          │
│  [Card] [Card] [Card] ...                                            │
└─────────────────────────────────────────────────────────────────────┘
```

### 6.3 Submission Card

Each submission renders as a card. Cards are sorted by the selected sort
dimension (default: Niche score DESC).

```
┌──────────────────────────────────────────────────────────────────┐
│  🌕 HIGH NICHE  ·  Find My People  ·  Hyderabad  ·  2 days ago  │
│                                                                  │
│  [Name redacted]  ·  1996  ·  M  ·  Telugu, English             │
│  Tech & Startups  ·  Building something new                      │
│                                                                  │
│  "A group of people within 5km who actually care about urban     │
│   farming and want to experiment together, not just talk about   │
│   it online..."                                                  │
│                                                                  │
│  ┌──────────┬──────────┬──────────┬──────────┐                  │
│  │ Engage   │ Viability│  Niche   │ Founder  │                  │
│  │   78     │   82     │   91     │   n/a    │                  │
│  │  🟢 High │  🟢 High │  🟢 High │          │                  │
│  └──────────┴──────────┴──────────┴──────────┘                  │
│                                                                  │
│  Search duration: years  ·  Tried: apps, discord                │
│                                                                  │
│  [▼ Show reasoning]                                              │
│                                                                  │
│  [Shortlist]  [Defer]  [Reject]  [View full]                    │
└──────────────────────────────────────────────────────────────────┘
```

**Score colour coding:**
- 🟢 80–100 (High)
- 🟡 60–79 (Medium)
- 🟠 40–59 (Moderate)
- 🔴 0–39 (Low)

**Global case flag:** When `is_global_case = true`, the card shows a
`🌐 GLOBAL CASE` badge instead of a niche badge, with a note:
*"Low niche score — this person may want maximum variety, not a specific room.
Consider for a broad-interest cluster."*

**Reasoning panel** (collapsed by default, tap to expand):
```
Engagement (78): "Searching for 'years' with specific urban farming interest
  and GPS location in Hyderabad — high motivation signal."
Viability (82): "GPS coordinates provided; tech+urban farming in Hyderabad
  has sufficient demographic density."
Niche (91): "Urban farming within 5km is hyper-local and hyper-specific —
  this need does not exist on any mainstream platform."
```

### 6.4 Shortlist View

When admin clicks `[Shortlist]`, the card moves to `admin_status = 'shortlisted'`.
A separate "Shortlisted" tab shows all shortlisted submissions grouped by
city + interest domain — this helps the admin see when enough people in the
same segment have accumulated to form a cluster.

```
Shortlisted — grouped by segment
─────────────────────────────────
Hyderabad · Tech & Startups (4 people)
  [Person A — Niche 91]  [Person B — Niche 84]  [Person C — Niche 77]  [Person D — Niche 71]
  → Cluster viability: READY (4 people, avg niche 81, GPS density confirmed)
  [Create cluster brief →]

Bangalore · Creative & Arts (2 people)
  [Person E — Niche 88]  [Person F — Niche 79]
  → Cluster viability: NEEDS MORE (2 people — target 3+)
```

The "Create cluster brief" button opens a pre-filled cluster creation
brief (not the full wizard — just a summary the admin can copy into the
Orchestrator's cluster creation flow). It is not wired to auto-create;
it is a convenience for the admin.

### 6.5 Make Your Crowd Tab

MYC submissions show the Founder Quality score prominently. The card
layout adds:

```
│  Group: 25 GATE aspirants  ·  WhatsApp  ·  "Topics get buried"  │
│  Location: IIIT Hyderabad  ·  Telugu, English  ·  This week      │
│                                                                  │
│  ┌──────────┬──────────┬──────────┬──────────┐                  │
│  │ Engage   │ Viability│  Niche   │ Founder  │                  │
│  │   85     │   90     │   88     │   82     │                  │
│  │  🟢 High │  🟢 High │  🟢 High │  🟢 High │                  │
│  └──────────┴──────────┴──────────┴──────────┘                  │
│                                                                  │
│  [Shortlist for Premium Cluster]  [Defer]  [Reject]             │
```

### 6.6 Demand Heatmap (bottom of page)

A simple table showing submission density by city × interest domain.
Helps the admin see where clusters are forming organically.

```
Demand by City × Interest (last 30 days)
─────────────────────────────────────────
              Tech  Career  Social  Creative  Wellness  Other
Hyderabad      14     8       6       3         2        5
Bangalore       9     6       4       5         3        4
Chennai         3     4       2       1         1        2
Mumbai          2     3       5       2         4        3
```

Cells with 5+ submissions are highlighted green — these are the segments
where a cluster can be built now.

---

## 7. API Routes (Production Platform)

All routes are under the production Node.js/Fastify backend.
`platform_admin` role required on all routes.

```
GET    /api/admin/waitlist
       → list submissions
       → filters: form_type, admin_status, city, interest_domain, min_score_niche
       → sort: score_niche | score_engagement | score_cluster_viability | submitted_at
       → pagination: limit/offset

GET    /api/admin/waitlist/stats
       → aggregate stats (from waitlist_aggregate_stats view)

GET    /api/admin/waitlist/:id
       → single submission detail with full reasoning

PATCH  /api/admin/waitlist/:id/status
       → body: { status: 'shortlisted' | 'invited' | 'deferred' | 'rejected', notes?: string }
       → writes admin_status, admin_notes, admin_actioned_by, admin_actioned_at
       → writes to cluster_admin_actions (audit trail)

GET    /api/admin/waitlist/segments
       → demand heatmap: city × interest_domain counts
       → filter: last_7d | last_30d | all_time

GET    /api/admin/waitlist/shortlisted/grouped
       → shortlisted submissions grouped by city + interest_domain
       → includes cluster viability assessment per group
```

---

## 8. Admin Workflow

The intended workflow for the admin:

1. **Open Waitlist tab** → see summary strip (how many pending, avg scores)
2. **Sort by Niche DESC** (default) → highest-value submissions surface first
3. **Review cards** → read gathering description + reasoning panel
4. **Shortlist** promising submissions → they move to the Shortlisted tab
5. **Check Shortlisted → Grouped** → see when a segment has enough people
6. **When a segment is ready** → use the cluster brief as input to the
   Orchestrator's cluster creation wizard
7. **Send invite manually** → email the shortlisted people directly
   (invite automation is Phase 2)
8. **Mark as Invited** → update status so the segment count stays accurate

---

## 9. Scoring Quality Notes

### What DeepSeek does well here
- Interpreting free-text gathering descriptions (the richest signal)
- Cross-referencing demographic combinations against known patterns
- Identifying specificity vs. vagueness in location and interest

### What DeepSeek cannot do
- Know the current waitlist density (it scores each submission in isolation)
- Verify GPS coordinates against actual city boundaries
- Detect duplicate submissions from the same person

### Mitigations
- Cluster Viability score is intentionally conservative — it scores the
  individual submission, not the segment. The Shortlisted → Grouped view
  is where segment density becomes visible.
- Duplicate detection: the dashboard shows email addresses in the full
  detail view. The admin can spot duplicates manually. Automated dedup
  (by email hash) is Phase 2.
- GPS verification: latitude/longitude is stored; the admin can see it
  on the card. A map view is Phase 2.

---

## 10. Done Criteria

- [ ] `waitlist_submissions` table created with RLS
- [ ] `waitlist_aggregate_stats` view created
- [ ] PHP mailer dual-writes: email + Supabase (graceful degradation on both)
- [ ] DeepSeek scoring fires on every submission with correct prompt
- [ ] Scoring errors stored in `scoring_error` field; submission still saved
- [ ] `/admin/aggilo/waitlist` route renders with correct role guard
- [ ] Summary strip shows live counts from the view
- [ ] Submission cards render all 4 scores with colour coding
- [ ] Reasoning panel expands/collapses per card
- [ ] Global case flag renders correctly
- [ ] Shortlist / Defer / Reject actions write to DB + audit log
- [ ] Shortlisted → Grouped view shows segment density
- [ ] Demand heatmap renders city × interest counts
- [ ] MYC submissions show Founder Quality score prominently
- [ ] Export CSV works for all filtered views
- [ ] RLS verified: non-platform-admin gets 403

---

## 11. Phase 2 (Not in Scope Now)

- Automated invite email triggered by admin clicking "Send invite"
- Duplicate detection by email hash
- Map view for GPS submissions
- Segment density threshold alerts (notify admin when a segment hits 5+)
- Re-scoring: admin can trigger a re-score if the DeepSeek call failed
- Bulk shortlist: select multiple cards and shortlist in one action

---

*Waitlist Intelligence Spec · 2026-05-23*
*Authority: subordinate to AGGILO_SOUL.md, AGGILO_PLATFORM_RULES.md, Part 6.*
*Companion: docs/AGGILO_ADMIN_DASHBOARD_SPEC.md (adds Waitlist tab to nav)*
