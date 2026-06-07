# Aggilo — Capability Map

> Decomposed from architecture, agent specs, and screen prompts. Each capability includes sub-capabilities and key dependencies.

## Cluster Creation (Conversational, Clio-led)
- Intent capture (free text), AGGIL extraction, duplicate detection (semantic search), disambiguation dialogue
- Constraints: founder gender/age self-inclusion, GPS mutual opt-in, post-spawn edit limits
- Outputs: cluster brief, cluster_score, clusters insert, founder auto-join, arc_phase init
- Dependencies: Auth, Profiles, AGGIL Engine, Clusters, Clio runtime, Prompt builder, Audit

## Cluster Discovery (Curated)
- Clio-curated Explore (default landing), AMA calibration, insight pills, My Clusters strip
- Signals: AGGIL defaults, calibration mode, Scout intelligence, Observer signals
- Zero/poor results handling, dwell-time FAB nudge, calibration reset
- Dependencies: Clusters search, Profiles, Clio runtime, Scout reports, Observer signals

## Feed Participation (Timeline)
- Compose (member), Sage anchor posts, mixed feed rendering, comments (inline), likes, report
- New-posts pill, pull-to-refresh, long-press menus, non-member read-only view
- Dependencies: Posts, Comments, Post likes, Membership, Realtime (Signal 3), Sage runtime, Moderation

## Direct Messaging (Stage 3+)
- DM request/accept flow, Connection creation, single thread per user-pair, text-only Phase 1
- Cluster-context inbox, pending requests, silent decline, 30-day expiry
- Dependencies: Profiles, Membership, DM threads/messages, Realtime, Abuse prevention

## Clio Orchestration
- FAB dual-tab (cluster vs private), unified presence, tip system, welfare handling, feature signal capture
- Conversational discovery, creation, AMA calibration, platform QA, premium differentiation
- Tool proposal authority (for Sage/Scout), pre-spawn questionnaires (3–5 Q)
- Context engineering: 4-layer inheritance, token budgets, compaction, reliability-over-capability
- Dependencies: Profiles, Clusters, Prompt builder, LLM routing, Observer signals, Sage/Scout

## Sage Anchor Operations
- Arc phase management (A–E), 2-post/24h proactive cap
- Atlas brief (JSON) + 3-round refinement, zero-content synthesis protocol
- @Sage mention protocol (dedup thresholds), bridge messages, reengagement, welfare escalation → Clio
- Feature intelligence (48h evaluation), description refinement hypothesis/test/proposal
- Dependencies: Clusters, Posts, Atlas runtime, Clio (handoff), Prompt builder, LLM routing

## Atlas Content Intelligence
- AutoResearch (tiered data acquisition), content scoring, synthesis_mode flagging
- Format variants (text, video, HTML snippet, poll), relevance thresholds, freshness rules
- Source coverage management via Sage tool proposals, Observer Domain 6 triggers
- Dependencies: Data acquisition, LLM routing, Sage briefs, Prompt builder

## Scout Community Intelligence
- Directed discovery jobs, segment-based crawling, inference-only vs verified signals
- Auto-cluster candidate generation, report structuring, confidence scoring
- Inputs to Intake Interpreter, Clio proposals, Observer Domain 9 aging
- Dependencies: Data acquisition, Clio (directed jobs), Observer findings, Prompt builder

## Observer Platform Stewardship
- 11 domains (health, growth, monetisation, crowdfund, agent performance, content gaps, underserved demos, safety, scout pipeline, tool analysis, feature signals)
- Channels: Autonomous stewardship (prompt updates + veto), Finding-and-approve (dashboard + admin trigger)
- Tool proposal triggers (Clio tools directly; Clio/Sage analysis jobs), veto windows, Platform Rules validation
- Dependencies: Runtime events, llm_response_logs, behavioural_events, observer_findings, tool_proposals, admin dashboard

## Realtime Engagement Layer
- Signals: Presence (S1), Composition (S2), Arrival (S3a/b/c), Care reach-out (S4)
- Fallback contract (online/reconnecting/offline), privacy ceiling (anonymous composition, private handoff)
- Dependencies: Supabase Realtime, Posts, Clio handoff greetings, Agent Chatbox

## Genesis Engine (Observer-sub)
- Pre-spawn questionnaires, spec generation, two-cycle validation, drift detection, post-launch monitor
- Outputs: cluster_specs, cluster_genesis_reports, drift findings
- Dependencies: Observer, Clio intake signals, Clusters, Prompt builder, Runtime queues

## Platform Tools Registry
- Versioned platform_tools catalog, cluster import/skin, soft retirement, auto-promotion scoring
- Dependencies: tool_proposals, cluster_tool_enablements, Observer Domain 10

## Feature Signal Pipeline
- Clio organic capture (dedup by feature_hash), k-anonymity, cross-cluster aggregation
- Observer Domain 11 review, CIM intake, platform rule compliance checks
- Dependencies: feature_signals, Observer, CIM

## Moderation & Safety
- AI-first screening, user reports, bans/appeals, CSAM detection, cultural sensitivity
- Observer Domain 8 anomaly detection, severity tiers, admin actions
- Dependencies: Posts, Comments, DM, Reports, User bans, Observer

## Notifications & Activity
- FCM push, Activity feed aggregation, per-cluster notification toggles, quiet hours
- Clio match rows, cluster activity rows, DM requests
- Dependencies: Notification tokens, Events aggregation, Profiles, Clusters

## LLM Routing & Prompt Management
- Operation-key routing, fallback chains, cost ceilings, reliability-first selection
- 4-layer prompt assembly, token budgets, validator + retry + degrade pattern
- Audit: prompt versions, llm_response_logs, runtime_events
- Dependencies: Prompt builder, LLM providers, Runtime queues, Observer

## Audit & Observability
- runtime_events, llm_response_logs, behavioural_events, prompt audit, cost tracking
- Observer Domain 5 reads, admin dashboards, meltdown detection (3x in 1h)
- Dependencies: Runtime, Database, Admin tools

## Infrastructure & DevOps (missing spec)
- CI/CD, environment config, secrets management, monitoring/alerts, backups, migrations, rollout strategy
- Dependencies: All services; **Gap** — no consolidated document
