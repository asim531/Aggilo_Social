# MEMPALACE_ARCHITECTURE.md

> **MemPalace Integration Spec · Aggilo Knowledge Infrastructure**
> *The palace holds what the platform knows. Cluster is the room. Demographic is the lens. Content lives in the drawers.*

---

## Reference

MemPalace: https://github.com/mempalace/mempalace

This document defines how Aggilo uses MemPalace as its long-term knowledge store for content intelligence, cluster memory, and resource tracking. It is not a general MemPalace usage guide — it is Aggilo's specific implementation contract.

---

## Core Design Decision: Hierarchy

### What was considered (and rejected)

**Demographic as wing → Cluster as room → Content as drawer**

This organises the palace by who people are. It breaks when demographics change (age, location, gender) — which they do, on a 12–24 month cycle for most users. It also implies that content belongs to a demographic, when in reality the best content transcends any single demographic slice.

### What is implemented instead

**Cluster as Room → Content as Drawer (with demographic as retrieval filter)**

```
MemPalace
├── Room: ML Hyderabad Cluster (cluster_id: uuid)
│   ├── Drawer: "ML Research Papers — Applied" 
│   │   ├── Resource: link + metadata + demographic_relevance_scores
│   │   ├── Resource: link + metadata + demographic_relevance_scores
│   │   └── ...
│   ├── Drawer: "Co-founder Matching Frameworks"
│   │   └── ...
│   └── Drawer: "Community Discussions — Active Threads"
│       └── ...
├── Room: Women in Product — Hyderabad (cluster_id: uuid)
│   ├── Drawer: "Industry Reports — Product & Design"
│   └── ...
└── ...
```

Demographics are **tags on resources inside drawers**, not architectural walls. When Atlas retrieves for a specific cluster, it applies demographic filters at query time. When a user's location changes from Hyderabad to Bangalore, you update their user profile — not their room assignment.

---

## The Five Structural Layers

Wings are not a hierarchy above rooms. They are a **cross-cutting grouping layer** — demographic facets that tag rooms for admin navigation and Atlas cross-cluster content discovery. A room belongs to one or more wings simultaneously. Wings do not contain rooms. They reference them.

```
MemPalace
│
├── Wing: 22–28 · Hyderabad (demographic facet)
│   ├── → Room: ML Hyderabad Cluster
│   ├── → Room: Startup Founders Hyderabad
│   └── → Room: Women in Product Hyderabad
│
├── Wing: 28–35 · Bangalore
│   ├── → Room: Senior Engineers Bangalore
│   └── → Room: ML Hyderabad Cluster    ← same room, multiple wings
│
└── ... (rooms remain the primary structure; wings are read-only references)
```

Wings have two jobs:
1. **Admin navigation** — filter the palace by demographic affinity without restructuring rooms
2. **Atlas cross-cluster seeding** — when a new cluster's drawers are sparse, Atlas queries same-wing rooms for high-scoring resources to borrow as seed content

---

### Layer 0 — Wings (Demographic Facets)

Wings are created and maintained by Platform Intelligence (Domain 1). They are not created by agents. No agent writes a new wing autonomously.

```json
{
  "wing_id": "uuid",
  "wing_name": "22–28 · Hyderabad",
  "demographic_dimensions": {
    "age_range": [22, 28],
    "geography": "Hyderabad, India",
    "gender": null                  // null = wing spans all genders
  },
  "room_references": ["uuid1", "uuid2", "uuid3"],
  "room_count": 3,
  "last_updated_at": "ISO8601",
  "wing_status": "active | archived"
}
```

**Wing membership rules:**
- A room is added to a wing when its `demographic_profile` overlaps with the wing's dimensions by ≥ 60%
- A room can belong to multiple wings (e.g. a cluster spanning 24–30 in Hyderabad belongs to both the 22–28 and 28–35 Hyderabad wings)
- Wing membership is recalculated monthly when Platform Intelligence updates cluster demographic profiles
- Wings are never deleted — they are archived when no active rooms reference them

**What wings do not do:**
- Wings do not restrict which users can join a cluster
- Wings do not filter content delivery to users
- Wings do not create separate namespaces for resources
- Wings are not surfaced to end users — they are an admin and agent tool only

### Atlas Cross-Cluster Seeding via Wings

When Atlas is building content for a new cluster whose drawers have fewer than 5 resources:

```
1. Identify which wings the new cluster belongs to
2. Query all other active rooms in those wings
3. Retrieve resources with relevance_score ≥ 0.85 and times_surfaced ≥ 3 from those rooms
4. Score retrieved resources against new cluster's demographic_profile and arc_phase
5. Resources scoring ≥ 0.80 on both dimensions → added to new cluster's drawers as seed content
6. Seed resources are tagged source: "cross_cluster_seed" and wing_source: "wing_id"
7. Sage is notified: "Drawer seeded with N resources from similar clusters. Review before surfacing."
```

Sage reviews seeded content before it is surfaced to cluster members. She does not post seed content automatically.

---

### Layer 1 — Palace (Platform Instance)

One palace per Aggilo deployment. The palace is the top-level namespace.

```json
{
  "palace_id": "aggilo-prod",
  "created_at": "ISO8601",
  "total_rooms": 0,
  "total_drawers": 0,
  "total_resources": 0,
  "last_indexed_at": "ISO8601"
}
```

### Layer 2 — Room (Cluster)

Each active Aggilo cluster maps to exactly one room. Rooms are created when clusters are created. Rooms are archived (not deleted) when clusters are dissolved.

```json
{
  "room_id": "uuid",
  "cluster_id": "uuid",
  "cluster_name": "ML Hyderabad",
  "cluster_tags": ["machine learning", "hyderabad", "collaboration", "building"],
  "arc_phase": "B",
  "room_status": "active | archived | suspended",
  "created_at": "ISO8601",
  "archived_at": "ISO8601 | null",
  "demographic_profile": {
    "age_range": [22, 32],
    "gender_distribution": "mixed | predominantly_male | predominantly_female | null",
    "primary_geography": "Hyderabad, India",
    "secondary_geographies": ["Bengaluru", "Remote-India"]
  },
  "drawer_count": 4,
  "resource_count": 47
}
```

**Note on `demographic_profile`:** This is a cluster-level aggregate, not individual user data. It describes the room's composition, not its members. It is used by Atlas at query time to apply demographic filters to resource retrieval. It is updated monthly by Platform Intelligence Domain 1 (Health).

### Layer 3 — Drawer (Content Category)

Drawers organise resources within a room by topic category. Drawers are created by Atlas based on the content it curates. Sage can request new drawers when new content categories emerge in the cluster's arc phase.

```json
{
  "drawer_id": "uuid",
  "room_id": "uuid",
  "cluster_id": "uuid",
  "drawer_name": "Co-founder Matching Frameworks",
  "drawer_tags": ["co-founders", "collaboration", "team building"],
  "arc_phases_active": ["A", "B", "C"],
  "resource_count": 12,
  "last_updated_at": "ISO8601",
  "created_by": "atlas | sage | admin",
  "drawer_status": "active | stale | archived"
}
```

**Drawer naming convention:** Descriptive, human-readable. Not slugs. Not UUIDs. These names surface in the Aggilo admin dashboard and should communicate their content to a human reviewer at a glance.

### Layer 4 — Resource (Content Item)

A resource is any externally linked content item stored in a drawer. Resources are the atomic unit of MemPalace. Every resource has a canonical URL, metadata, demographic relevance scores, and a link health status.

```json
{
  "resource_id": "uuid",
  "drawer_id": "uuid",
  "room_id": "uuid",
  "cluster_id": "uuid",

  "content": {
    "title": "How to find technical co-founders in Tier 1 Indian cities",
    "url": "https://example.com/article",
    "canonical_url": "https://example.com/article",
    "source_domain": "example.com",
    "source_type": "article | research_paper | reddit_thread | 
                    linkedin_post | video | podcast | tool | other",
    "author": "paraphrased or null — never a person's name if PII risk",
    "published_at": "ISO8601 | null",
    "content_summary": "150-word paraphrased summary. Never verbatim. PII-free.",
    "conversation_hook": "Atlas-generated hook for Sage to use when surfacing this"
  },

  "scoring": {
    "relevance_score": 0.91,
    "demographic_relevance": {
      "age_22_28": 0.88,
      "age_28_35": 0.76,
      "gender_male": 0.72,
      "gender_female": 0.69,
      "geography_hyderabad": 0.94,
      "geography_bangalore": 0.81
    },
    "arc_phase_relevance": {
      "A": 0.60,
      "B": 0.92,
      "C": 0.84,
      "D": 0.70,
      "E": 0.45
    },
    "scored_by": "atlas",
    "scored_at": "ISO8601"
  },

  "link_health": {
    "status": "available | unavailable | paywalled | moved | unverified",
    "last_checked_at": "ISO8601",
    "last_available_at": "ISO8601",
    "redirect_url": "string | null",
    "paywall_type": "hard | metered | null",
    "user_facing_flag": "string | null"
  },

  "provenance": {
    "provenance_type": "original | cross_cluster_seed",
    "wing_source": "wing_id | null"
  },

  "resource_status": "active | stale | flagged | archived"
}
```

---

## Demographic Filtering at Retrieval

When Atlas retrieves resources for Sage's content brief, it applies demographic filters as query-time parameters — not as pre-filtered subsets.

### Retrieval Query Example

```json
{
  "query_type": "atlas_content_retrieval",
  "cluster_id": "uuid",
  "arc_phase": "B",
  "demographic_filter": {
    "age_range": [22, 28],
    "geography": "Hyderabad",
    "gender": null
  },
  "min_relevance_score": 0.80,
  "min_demographic_relevance": 0.75,
  "exclude_surfaced_within_days": 14,
  "limit": 10
}
```

Resources are sorted by a composite score:

```
retrieval_score = (relevance_score × 0.5) 
                + (demographic_relevance_match × 0.3) 
                + (arc_phase_relevance × 0.2)
```

Resources with `link_health.status != "available"` are excluded from retrieval results by default. Unavailable resources can be queried separately (for admin review) but are never surfaced to users.

---

## Link Health: The Validation Job

### MemPalaceValidationJob

This is the job that ensures users never hit dead ends without context.

**Trigger:** Weekly cron (Sunday 02:00)  
**Lane:** Low priority  
**TTL:** 180 seconds

```
For each resource in MemPalace where status = 'active':
    1. HTTP HEAD request to resource.url
    2. Follow redirects (max 3)
    3. Evaluate response:
       - 200 → status: available, last_checked_at: NOW()
       - 301/302 → status: moved, redirect_url: final_url, flag for admin review
       - 403 → status: paywalled (verify with content sniff), paywall_type: hard
       - 429 → retry after 24h, do not mark status yet
       - 404/410 → status: unavailable, last_available_at: previous last_checked_at
       - timeout → retry once; if second timeout → status: unverified
    4. Write link_status_flag to queue for CrawlWorker to canonicalise
    5. If status changed from 'available' → anything else:
       - Set user_facing_flag (see below)
       - Notify Atlas and Sage via signal
```

### User-Facing Flags

When a resource becomes unavailable, the user-facing flag appears in any cluster surface where the resource was linked:

| Status | User-Facing Flag |
|--------|-----------------|
| `unavailable` | "This resource was last accessible on [date]. It may have been removed." |
| `moved` | "This resource has moved. [Updated link]" |
| `paywalled` (hard) | "This resource is now behind a paywall." |
| `paywalled` (metered) | "This resource may require a subscription after a few free reads." |
| `unverified` | "We couldn't verify this resource is still accessible." |

**The user always knows.** A dead link with context is far less damaging to trust than a dead link with no explanation. The flag is the product feature, not just a maintenance task.

### Validation Prioritisation

Not all resources need weekly validation. Frequency scales with usage:

| Condition | Validation Frequency |
|-----------|---------------------|
| `times_surfaced >= 5` | Weekly |
| `times_surfaced 1–4` | Bi-weekly |
| `times_surfaced = 0` | Monthly |
| `resource_status = stale` | On-demand only |
| `source_type = reddit_thread` | Weekly (Reddit threads disappear frequently) |

---

## Scout Integration with MemPalace

Scout does not write content resources to MemPalace. Scout writes `scout_intelligence_reports` to Supabase. When an admin actions a Scout report (e.g. approves a new cluster), the resulting cluster creates a new Room in MemPalace automatically. Scout is upstream of MemPalace, not a direct writer to it.

The exception: `gap_intelligence` reports that identify specific internet resources (e.g. "this LinkedIn article is being widely shared in the target community") can be passed to Atlas as a `CuratedResourceSuggestion`. Atlas validates, scores, and writes to MemPalace if the resource passes the 0.80 threshold.

---

## Stale Room Management

When a cluster is dissolved or archived:
1. Room status → `archived`
2. All drawers → `archived`
3. All resources → `archived` (not deleted)
4. Link validation suspended for all resources in archived rooms
5. Room accessible to admin for retrospective analysis
6. Room data retained for 12 months, then purged unless flagged for long-term retention

A future cluster with similar interest tags can inherit archived room resources. Atlas checks archived rooms when building a new cluster's initial content pool — it avoids re-sourcing content that already exists and passed quality thresholds.

---

## Database Schema (Supabase)

```sql
CREATE TABLE mempalace_wings (
  id UUID PRIMARY KEY,
  wing_name VARCHAR(128),
  age_range INT4RANGE,
  geography VARCHAR(128),
  gender VARCHAR(32),              -- null = all genders
  room_references JSONB,           -- array of room UUIDs
  room_count INT DEFAULT 0,
  wing_status VARCHAR(32) DEFAULT 'active',
  last_updated_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE mempalace_rooms (
  id UUID PRIMARY KEY,
  cluster_id UUID UNIQUE NOT NULL,
  cluster_name VARCHAR(256),
  cluster_tags JSONB,
  arc_phase VARCHAR(4),
  demographic_profile JSONB,
  wing_references JSONB,           -- array of wing UUIDs this room belongs to
  room_status VARCHAR(32) DEFAULT 'active',
  drawer_count INT DEFAULT 0,
  resource_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  archived_at TIMESTAMP
);

CREATE TABLE mempalace_drawers (
  id UUID PRIMARY KEY,
  room_id UUID REFERENCES mempalace_rooms(id),
  cluster_id UUID,
  drawer_name VARCHAR(256),
  drawer_tags JSONB,
  arc_phases_active JSONB,
  resource_count INT DEFAULT 0,
  drawer_status VARCHAR(32) DEFAULT 'active',
  created_by VARCHAR(32),
  created_at TIMESTAMP DEFAULT NOW(),
  last_updated_at TIMESTAMP
);

CREATE TABLE mempalace_resources (
  id UUID PRIMARY KEY,
  drawer_id UUID REFERENCES mempalace_drawers(id),
  room_id UUID REFERENCES mempalace_rooms(id),
  cluster_id UUID,
  url TEXT NOT NULL,
  canonical_url TEXT,
  source_domain VARCHAR(256),
  source_type VARCHAR(64),
  published_at TIMESTAMP,
  content_summary TEXT,
  conversation_hook TEXT,
  relevance_score DECIMAL(3,2),
  demographic_relevance JSONB,
  arc_phase_relevance JSONB,
  link_status VARCHAR(32) DEFAULT 'unverified',
  last_checked_at TIMESTAMP,
  last_available_at TIMESTAMP,
  redirect_url TEXT,
  paywall_type VARCHAR(16),
  user_facing_flag TEXT,
  times_surfaced INT DEFAULT 0,
  last_surfaced_at TIMESTAMP,
  sourced_by VARCHAR(32),
  provenance_type VARCHAR(32),      -- original | cross_cluster_seed
  wing_source UUID,                -- wing_id if provenance_type = cross_cluster_seed
  resource_status VARCHAR(32) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE mempalace_validation_log (
  id UUID PRIMARY KEY,
  resource_id UUID REFERENCES mempalace_resources(id),
  checked_at TIMESTAMP,
  http_status INT,
  previous_link_status VARCHAR(32),
  new_link_status VARCHAR(32),
  status_changed BOOLEAN,
  redirect_detected BOOLEAN,
  redirect_url TEXT
);
```

---

## Summary: What Lives Where

| Data | Lives In | Owner |
|------|----------|-------|
| Demographic grouping facets | `mempalace_wings` (Supabase) | Platform Intelligence |
| Raw fetched content | `raw_crawl_cache` (Supabase) | CrawlWorker |
| Scored content cards | `atlas_content_cards` (Supabase) | Atlas |
| Growth intelligence | `scout_intelligence_reports` (Supabase) | Scout |
| Cluster knowledge rooms | `mempalace_rooms` (Supabase) | Platform/Admin |
| Curated content drawers | `mempalace_drawers` (Supabase) | Atlas |
| Linked resources | `mempalace_resources` (Supabase) | Atlas |
| Link health history | `mempalace_validation_log` (Supabase) | MemPalaceValidationJob |
| User longitudinal profiles | `clio_user_profiles` (Supabase) | Clio |
| Handoff packets | `clio_sage_handoffs` (Supabase) | Clio |

---

*← [SHARED_CRAWL_POOL.md] · [AGENTS.md (Scout)]*

*end of MEMPALACE_ARCHITECTURE v1.0*
