# Aggilo — AI-Orchestrated Human Connection

**Building a more intelligent way for people to discover and connect with the right communities.**

**Website:** https://aggilo.com/  
**Founder:** Asim Syed  
**AI orchestrator:** Weya

## Overview

Aggilo is an AI-native platform designed to help people connect through relevant online rooms.

Rather than relying exclusively on manual searching, browsing or following, Aggilo places AI orchestration at the centre of the discovery and connection experience.

Its vision is to make it easier for people to find relevant communities and connections based on what they are looking for.

## The Problem

Finding the right people and communities online can require significant effort. Traditional social platforms often depend on feeds, follower networks, keyword searches and users manually navigating large volumes of content.

Aggilo explores a different approach: making relevant connections easier to discover through an AI-orchestrated experience.

## Our Approach

Aggilo is built around AI orchestration and room-based connections.

- **Intent-driven discovery:** Help users express what they are looking for.
- **Room-based connections:** Bring users together through online rooms.
- **AI orchestration:** Make AI a core part of the discovery and connection workflow.
- **Relevant interactions:** Reduce the effort required to find useful connections.
- **Room discovery and reuse:** Help the platform serve users through relevant rooms and communities.

Specific capabilities depend on the current implementation.

## Meet Weya

**Weya is the AI orchestrator at the heart of Aggilo.**

Weya represents Aggilo's vision of making human connection more intelligent and accessible through AI-coordinated discovery and interactions.

Rather than requiring users to navigate a conventional social network manually, Aggilo aims to make discovering relevant people and communities a more natural experience.

## Product Status

Aggilo has a working MVP and is in private beta.

The current product connects users through rooms on the Aggilo website. The next stage is to validate user demand, improve the discovery experience and establish repeatable patterns of engagement.

## Technical Architecture

Aggilo's implementation combines a web application, Supabase-backed data storage, API routes and LLM orchestration.

The architecture supports AI-powered workflows, platform interactions, feedback and operational monitoring.

### Architecture at a glance

```text
                 AGGILO WEB APPLICATION
                          |
          +---------------+----------------+
          |               |                |
      User Interface   AI Chat         Admin Tools
          |               |                |
          +---------------+----------------+
                          |
                     Next.js APIs
                          |
             +------------+------------+
             |                         |
        Supabase                  LLM Orchestration
     Data and Events             Primary / Fallback
             |                         |
             +------------+------------+
                          |
                Logging and Monitoring
```

### AI workflows

The implementation includes the following LLM operations:

| Agent or workflow | Operation key | Purpose |
|---|---|---|
| Sage | `sage_evaluate` | Evaluate member posts |
| Sage dua selection | `sage_dua_select` | Select relevant content on a cadence |
| Weya editorial review | `clio_dua_review` | Editorial review of selected content |
| Cadence | `cadence_exchange` | Periodic interactions based on cluster activity |
| Weya chat | `clio_chat` | Cluster-aware conversational interactions |
| Weya private chat | `clio_ephemeral` | Private conversational interactions |
| Link alignment | `link_alignment_check` | Evaluate links shared by members |

The current implementation includes LLM usage tracking and operational monitoring. Where configured, calls record cost, latency, fallback behaviour and decisions.

## Engineering Principles

Aggilo's technical direction focuses on:

- AI orchestration as a core product capability
- Context-aware user experiences
- Reliable execution of platform workflows
- Observability of model usage, latency and cost
- Appropriate handling of user preferences and privacy
- Iterative development based on user feedback

## Vision

We believe the next generation of social platforms can move beyond asking people to search for connections.

Instead, people should be able to express what they need and let intelligent systems help them discover where they belong.

Aggilo aims to make that possible through AI-orchestrated human connection.

## Founder

**Asim Syed** is the founder of Aggilo, building an AI-native platform focused on intelligent social discovery and human connection.

- Website: https://aggilo.com/
- GitHub: https://github.com/asim531

---

*Note: Weya is the product-facing name of Aggilo's AI orchestrator. Some internal identifiers in the current implementation retain the legacy `clio` naming.*
