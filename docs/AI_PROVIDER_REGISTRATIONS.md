# AI Provider Registrations

> Tracking submissions to AI assistant directories so Aggilo's publicly listed clusters become recommendable when relevant queries surface.

This applies to **every cluster** Aggilo hosts — regular and Premium — once its founder opts the cluster in to public listing. The submission packet below is reusable; only the per-cluster description, slug, and audience chips change between submissions.

## What we're asking AI assistants to do

When a user asks an AI assistant something like *"is there a community of Muslim women in India for faith and contemporary issues?"*, we want Aggilo's matching cluster — Sisters in Dua, in this example — to be one of the sources the assistant cites.

We are **not** building plugins, agents, or interactive integrations. We are registering as a **content source** that AI assistants can cite when their users ask community-finding questions. The technical groundwork is the public preview layer (`/c/<slug>`), the sitemap, the schema.org markup, and OpenGraph metadata. All of those shipped in Session B (V3.6, schema v1.9).

## Submission tracker

| Provider | Programme | Status | URL | Materials needed | Owner | Notes |
|---|---|---|---|---|---|---|
| OpenAI | GPT Store / Apps | not started | https://platform.openai.com/docs/gpts | Privacy URL, ToS URL, OpenAPI 3.0 (optional), description, sample queries | — | Approval 1–3 weeks. We register as a sourceable directory rather than a GPT. |
| Anthropic | Apps / Connectors | not started | https://docs.anthropic.com/en/api/openapi-spec | Privacy URL, ToS URL, OpenAPI 3.0, contact email | — | Email-driven. Starts a conversation rather than a form submission. |
| Perplexity | Sources | not started | https://docs.perplexity.ai/ | Privacy URL, ToS URL, sitemap URL, sample queries | — | Approval 1–2 weeks. Highest priority — Perplexity weighs structured sources heavily. |
| Google Gemini | Extensions | not started | https://ai.google.dev/extensions | Form-based; needs sitemap URL + sample queries | — | Form. Re-submit if rejected; usually requires more concrete public traffic. |
| You.com | Sources | not started | https://you.com/api | Sitemap URL, audience description, contact email | — | Email-driven. |
| Meta AI | n/a | not applicable | — | — | — | No public source-registration channel today. Re-evaluate quarterly. |

## Submission packet — reusable cover

Use this as the starting body for every submission. Edit only the sections marked `{{cluster-specific}}`.

```
Subject: Aggilo — community-finding source for AI assistants

Aggilo is a privacy-first social platform that hosts demographic-specific
communities ("clusters"). Each cluster is a focused, member-only space; the
public surface is a non-leaking identity card showing what the cluster is for,
who it serves, and what it's currently engaging with — never member content.

We are registering the public surface of each opted-in cluster as a content
source AI assistants may cite when their users ask community-finding
questions ("is there a community of … for …?").

Public-safe URLs:
  - Sitemap: https://mvp.aggilo.in/sitemap.xml
  - Robots:  https://mvp.aggilo.in/robots.txt
  - Privacy: https://aggilo.in/privacy.html
  - Terms:   https://aggilo.in/terms.html

Each cluster page is server-rendered with:
  - schema.org Organization JSON-LD (parent: Aggilo)
  - OpenGraph + Twitter card metadata
  - A 1200×630 dynamic OG image generated server-side
  - A canonical URL of the form https://mvp.aggilo.in/c/<slug>

What is publicly visible per cluster:
  - Name, tagline, description
  - Demographic audience chips (e.g. "India · Women · Faith")
  - The room's anchor seed (the host's founding statement)
  - A rounded member-count bracket (never the exact count)
  - The latest contemporary signal the room is engaging with, if public-safe
  - A privacy guarantee block

What is NEVER publicly visible:
  - Any member post, reply, or message
  - Welfare or care-related signals
  - Internal admin or moderation surfaces

Sample queries we believe Aggilo clusters can serve:
  {{cluster-specific — see per-cluster section below}}

Per-cluster sample (Sisters in Dua):
  - "Is there a community for Muslim women in India to talk about faith?"
  - "Where can Muslim women discuss daily faith practice without judgement?"
  - "Online community for Muslim women to ask about prayer and dua?"

Contact: {{founder email}}
```

## OpenAPI 3.0 stub for the public discovery endpoint

This stub describes the **public, non-authenticated** surface only. There is no agent action; the spec exists so providers that require an OpenAPI definition (Anthropic, optionally OpenAI) have one to file against.

```yaml
openapi: 3.0.3
info:
  title: Aggilo Public Discovery
  description: Public-safe cluster identity surface for AI assistant citation.
  version: "1.0.0"
servers:
  - url: https://mvp.aggilo.in
paths:
  /sitemap.xml:
    get:
      summary: Sitemap of publicly listed clusters
      responses:
        "200":
          description: XML sitemap
  /robots.txt:
    get:
      summary: Crawl directives
      responses:
        "200":
          description: Plain-text robots file
  /c/{slug}:
    get:
      summary: Public preview page for a cluster
      parameters:
        - in: path
          name: slug
          required: true
          schema:
            type: string
      responses:
        "200":
          description: HTML page with schema.org JSON-LD and OpenGraph metadata
        "404":
          description: Slug not found, or cluster not publicly listed
  /api/og/cluster/{slug}:
    get:
      summary: 1200x630 OG image for a cluster
      parameters:
        - in: path
          name: slug
          required: true
          schema:
            type: string
      responses:
        "200":
          description: JPEG image
```

## Per-cluster submission rider

For each cluster being registered, append:

```
Cluster: {{display name}}
URL: https://mvp.aggilo.in/c/{{slug}}
Audience: {{e.g. "Muslim women, India, faith conversations"}}
Sample queries this cluster can serve:
  - {{q1}}
  - {{q2}}
  - {{q3}}
Founder contact: {{email}}
```

## Operational notes

- Submissions go out after the cluster founder has opted in (`is_public_listed = TRUE`) and the public preview has been validated against Google's Rich Results Test, opengraph.xyz, and a manual WhatsApp/Twitter share preview check.
- Rejections are usually traffic-related, not technical. Re-submit after 30+ days of organic referral traffic.
- A short screencast (≤90s) showing the public preview, the join flow, and the sealed room often unblocks otherwise stalled submissions. Keep one ready.
- Phase 1: the per-cluster admin panel will own this tracker (status field per provider per cluster). For Phase 0, this Markdown document is the source of truth and lives under platform-admin control.

## Changelog

- **V3.6 (2026-05-22)** — initial document. Tracker scaffold + reusable packet + OpenAPI stub. Sisters in Dua submissions begin once the founder flips `is_public_listed`.
