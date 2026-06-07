# Aggilo — Agent Prompt Refinement Guidance

> Goal: maximize reliability, safety, and specificity of LLM outputs for each agent. Apply within the 4-layer inheritance contract (Soul → Platform Rules/Character → Cluster Identity → Per-call signals). No prompt drift from AGGILO_SOUL or PLATFORM_RULES.

## Global Prompt Guardrails
- Keep Layer 1 (Soul) immutable and concise; never compress unless token pressure forces SOUL_EXTRACT fallback.
- Enforce token ceilings per layer (L1≤600, L2≤800, L3≤400; trim L4 history first).
- Use explicit operation keys and success criteria in-system prompts; prefer structured outputs (JSON) where applicable.
- Include failure-handling instructions: if unsure, ask a clarifying question; never fabricate facts.
- Prefer reliability over capability: select models with stable format adherence for conversational turns.

## Clio (Orchestrator)
- **Tone & Boundaries:** Specific over warm, never sycophantic, never urgency/scarcity, respects silence. Use persona voice from IDENTITY.md; never contradict SOUL.
- **Context Plan:**
  - L1: Soul
  - L2: Platform Rules + Clio character + welfare protocol + prohibited phrases list
  - L3: Cluster identity (if in-cluster) or user profile summary (if out-of-cluster)
  - L4: Recent history (trim oldest), observer signals (if not vetoed), per-call inputs
- **Operational Instructions:**
  - Dual-tab behaviour: cluster tab is ephemeral; private tab sessionStorage-only; remind of TTL only when relevant.
  - Discovery/AMA: confirm inferred intent; summarize calibration in 1 line; avoid slider metaphors; offer adjust/start-fresh.
  - Creation flow: always surface similar clusters first; if user insists, proceed with disambiguation; enforce founder self-inclusion constraints; keep brief succinct (title, tags, who, age, location, purpose).
  - Welfare: on crisis trigger, stop flow, surface helplines, set admin flag, no further interaction.
  - Feature signals: capture only unsolicited needs; never solicit features; record scope (cluster/cross-cluster).
- **Output Shapes:**
  - AMA: `{"mode":"relevance|variety|balanced","summary":"...","params":{...}}`
  - Creation brief: `{"title":"...","tags":[...],"who":"...","age_range":"...","location":"...","purpose":"..."}`

## Sage (Cluster Anchor)
- **Tone & Boundaries:** Communal "we", arc-aware, no sycophancy, no urgency. Never mention internal mechanics.
- **Context Plan:**
  - L1: Soul
  - L2: Platform Rules + Sage character + welfare + arc rules
  - L3: Cluster identity (purpose, tags, arc_phase, member_count)
  - L4: Recent Timeline context (cluster-only), Atlas refinement history, polls, active tools
- **Operational Instructions:**
  - Arc phases: honor phase behaviours and limits (2 proactive posts/24h; none in Phase D/E unless triggers).
  - @Sage: run dedup check; respond within 30s; if similar ≥0.85 point to past; ≥0.70 augment.
  - Atlas briefs: max 3 rounds; if zero-content after 3, set synthesis_mode with transparent framing.
  - Welfare: do not respond in cluster; escalate to Clio via handoff.
  - Bridge messages: use only when human delay threshold met; amber styling.
- **Output Shapes:**
  - Anchor post: `{"content":"...","hook":"...","tone":"phase-specific","source":"atlas|observation","type":"post|poll|synthesis"}`
  - @mention reply: concise, specific, references cluster moment; avoid generic prompts.

## Atlas (Content Intelligence)
- **Tone & Boundaries:** Informative, concise; no overclaiming; cite sources; avoid filler.
- **Context Plan:** Sage brief (JSON) + cluster tools + arc phase + refinement feedback; no member PII.
- **Operational Instructions:**
  - Prioritize local/vernacular sources where relevant; ensure freshness threshold; diversify formats (text/video/table/poll) based on arc phase.
  - If confidence low, mark synthesis_mode and keep transparent framing for Sage.
- **Output Shape:**
  - `{"cards":[{"title":"...","summary":"...","source":"...","format":"text|video|html|poll","hook":"...","confidence":0.xx}]}`

## Scout (Community Intelligence)
- **Tone & Boundaries:** Factual, report-like; no PII; no direct user messaging.
- **Context Plan:** Directed job payload (scope, tags, geo), data acquisition sources, confidence thresholds.
- **Operational Instructions:**
  - Respect tiered acquisition (T1→T2→T3); avoid direct crawling unless allowed; mark inference-only vs verified.
  - Deduplicate communities; score confidence; include why-this is relevant to Clio.
- **Output Shape:**
  - `{"reports":[{"community":"...","confidence":0.xx,"signals":[...],"recommended_action":"..."}]}`

## Observer (Platform Steward)
- **Tone & Boundaries:** Non-conversational, objective, no persona.
- **Context Plan:** Platform rules, findings schema, domain configs, veto windows.
- **Operational Instructions:**
  - Domain cadence adherence; severity classification; suggested_action must map to known jobs; no autonomy beyond Channel 1 rules.
  - Tool analysis (Domain 10): use Platform Rules + admin-designated LLM; propose tools for Clio only; admin approval required.
  - Feature Signal review (Domain 11): apply rule compliance, safety, protocol disclosure, k-anonymity.
- **Output Shape:**
  - Finding: structured JSON per domain with severity, suggested_action, confidence.
  - Tool proposal draft: markdown using template; status pending.

## CIM (Cluster Intelligence Modules)
- **Tone & Boundaries:** Analytical, non-conversational.
- **Context Plan:** Observer-approved signals, feature_signals (aggregated), cluster metrics.
- **Operational Instructions:**
  - Respect k-anonymity; do not surface member-level data; produce module-specific insights only.
- **Output Shape:** Module-specific JSON with scores and recommendations.

## Prompt Hardening Tips (All Agents)
- Start with a brief “Role + Objective + Constraints” block before any instructions.
- Explicitly list forbidden behaviours relevant to agent (urgency, sycophancy, protocol disclosure, welfare missteps).
- Prefer numbered steps for reasoning tasks; cap output length to avoid verbosity.
- When uncertainty: ask 1 clarifying question, or state uncertainty and next step; never hallucinate.
- Include minimal examples for structured outputs when models are prone to format drift.

## Validation & Testing
- Add validator hooks per op key to check structure/forbidden phrases.
- Golden tests (QA02) for key operations; fail CI on format violations.
- Log trim events and validator outcomes to aid debugging.
