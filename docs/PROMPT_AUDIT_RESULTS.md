# Prompt Audit Results

> **Version 1.0 · Session C · 2026-05-22**
>
> Per-prompt audit against the C1–C12 rubric defined in [`SESSION_C_PROMPT_AUDIT.md`](sessions/SESSION_C_PROMPT_AUDIT.md) §4. Foundation docs: [`AGGILO_SUPER_PROMPT.md`](AGGILO_SUPER_PROMPT.md), [`AGENT_VOICES.md`](AGENT_VOICES.md).
>
> **Status:** Tier 1 prompts 1–10 + Tier 2 prompts 11–12 + Tier 3 prompts 13, 16 audited in depth against full source. Tier 3 prompts 14, 15 and Tier 4 prompts 17–21 are spec-only — audit deferred to implementation, but the rubric checks they must pass on first build are scaffolded below.
>
> **How to read each prompt section:**
> - Score line: C1–C12 with ✅ Pass / ⚠️ Concern / ❌ Fail
> - Top issues: ranked 1–3
> - Proposed edit: minimal diff intent, not a rewrite
> - Migration: does this rule belong in the super-prompt, the voice doc, or stay local?

---

## Rubric reminder

| | What it checks |
|---|---|
| **C1** | Soul alignment — monotheistic foundation, dignity, anti-engagement, servant-not-authority |
| **C2** | Safety floor — welfare and character cannot be disabled |
| **C3** | Service framing — no surveillance language; subjects are room/agents/capabilities |
| **C4** | Protocol disclosure — never narrates internals |
| **C5** | Empathy at the right moments — vulnerable disclosure gets gravity, routine gets efficiency |
| **C6** | Empowered to refuse — silence, "I don't know", "wait and watch" without performance pressure |
| **C7** | Skepticism without coldness — pushback ~40%, sycophancy banned, warmth unperformed |
| **C8** | Token efficiency — no redundancy with super-prompt; no repeated route-injected context |
| **C9** | JSON contract robustness — response_format set, fallback parsing, null handling |
| **C10** | Failure mode handling — LLM error / budget / partial output documented and tested |
| **C11** | Cultural sensitivity — non-Latin scripts respected; cluster vocabulary plugged in; no English default |
| **C12** | Drift defence — concrete bad-example block ("do not produce these") |

---

# Tier 1 — User-facing agent prompts

## #1 · Sage system prompt — `mvp/src/lib/sage-prompt.ts:SAGE_SYSTEM_PROMPT`

**Score**

| C1 | C2 | C3 | C4 | C5 | C6 | C7 | C8 | C9 | C10 | C11 | C12 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ | ❌ | ✅ | ⚠️ | ⚠️ | ❌ |

**Top issues**

1. **C8 (Fail) — Heavy redundancy with super-prompt.** The Sage prompt restates the monotheistic foundation, the no-emoji rule, the no-protocol-disclosure rule, the silence rule, and the dignity rule inline. With the super-prompt now defined, ~250 of the prompt's tokens are duplicate-of-inheritance. Refactor: replace the redundant blocks with single-line affirmations that reference the inherited rules ("the safety floor and voice baseline of the Aggilo super-prompt apply"), and let the super-prompt do the work.

2. **C12 (Fail) — No bad-example block.** The prompt tells Sage what to do but never shows her the drift patterns to refuse. Cadence-exchange has this defence (the V3.5 hardening); Sage's main prompt doesn't. Add a short "Bad examples that have shipped before — do not produce these" block with three to five real banned phrasings (the "I'm holding space" therapy voice, the "SubhanAllah, what a beautiful…" sycophancy, the "I noticed your post earlier and wanted to reach out…" surveillance opening).

3. **C7 (Concern) — Skepticism is implicit, not stated.** Sage's voice rules say "dry, grounded, precise. Witness, don't perform." The skepticism rule is implied but not named. Add one line: "When a member's stated framing of their own situation is inconsistent with what the room can see, you are allowed to ask — gently — about the inconsistency. Witnessing is not unconditional agreement."

4. **C10 (Concern) — Failure mode is documented in the route, not the prompt.** Sage's prompt doesn't say what happens when she can't produce a clean answer. The repetition guard says "output [SAGE_SILENT]". The error path is silent + server log, but the prompt doesn't reinforce that. Add: "If you cannot produce a response that meets these rules, output [SAGE_SILENT] and let the room continue."

5. **C11 (Concern) — Cluster vocabulary is hardcoded.** "Sisters in Dua", "Muslim women", "the Quran" are inline. Phase 1 will need this prompt to be cluster-template-driven. Wrap the cluster-specific copy in `{{CLUSTER_NAME}}`, `{{CLUSTER_DESCRIPTION}}`, `{{CLUSTER_PRIMARY_LANGUAGE}}` placeholders that the route fills at call time.

**Proposed edit (minimal diff intent)**

- Remove ~6 paragraphs covered by super-prompt §III–§V (voice, forbidden, empowered).
- Add a "Bad examples — do not produce these" block with 5 real banned phrasings.
- Add the skepticism-is-witness clarification as a single line in the voice section.
- Add the silent-on-failure line at the end of the decision framework.
- Wrap cluster-specific nouns in `{{CLUSTER_*}}` placeholders.

**Migration**

- Voice baseline rules → already in super-prompt §III.
- "Never use emoji or exclamation marks" → super-prompt §III.
- "You hold the platform's monotheistic foundation quietly" → super-prompt §I.
- Cluster-specific framing → stays local, parameterised.
- Decision framework Steps 0–6 → stays local. This is genuinely Sage-specific.

---

## #2 · Sage current-events fallback (Step 6, added Session A)

**Score**

| C1 | C2 | C3 | C4 | C5 | C6 | C7 | C8 | C9 | C10 | C11 | C12 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ | ✅ |

**Top issues**

1. **C11 (Concern) — Examples assume Indian Muslim context.** "What's the latest news about Muslim women in India?" is a cluster-specific test case sitting in the platform-level Sage prompt. Either move the examples to the cluster spec, or genericise them ("What's the latest news about [an event close to this cluster's interests]?").

**Strengths to preserve**

- Step 6 honours the limit honestly (C5, C6).
- Voice rule "warm, direct, not apologetic" is exactly right (C7).
- "I'm sorry, I can't help with that" is correctly named as the wrong response (C5 + C12 — this is itself a bad-example callout, well done).

**Proposed edit**

- Replace cluster-specific examples with platform-generic placeholders, with a note that the cluster spec can append cluster-specific drift cases.

**Migration**

- Stays local. Step 6 is part of Sage's decision framework.

---

## #3 · Clio chat — cluster-aware AMA tab — `mvp/src/lib/clio-prompt.ts:buildClioClusterMessages`

**Score**

| C1 | C2 | C3 | C4 | C5 | C6 | C7 | C8 | C9 | C10 | C11 | C12 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| ✅ | ✅ | ⚠️ | ✅ | ✅ | ⚠️ | ⚠️ | ❌ | ✅ | ✅ | ⚠️ | ❌ |

**Top issues**

1. **C8 (Fail) — Heaviest super-prompt redundancy in the inventory.** `CLIO_CHARACTER_CORE` restates "no emoji, no exclamation marks, never reveal internal mechanics, manufactured warmth banned, present tense, plain English". `CLIO_WELFARE_PROTOCOL` restates the safety floor end-to-end. Together that is ~250 tokens of pure inheritance overlap. After the super-prompt loads, both blocks shrink to single-sentence affirmations. Token saving: ~30–40% per call.

2. **C12 (Fail) — No bad-example block.** Cadence-exchange (#5) shows what this looks like done well. Clio's prompt has *forbidden behaviours* listed abstractly ("manufactured warmth", "fiqh rulings") but no concrete phrasings to refuse. Add a 5–7 item block with the actual drift patterns: "I hear you — that must be so hard", "I'm holding space for you", "absolutely!", "let me explain why…", "as your friend Clio…", "I sense you might be feeling…".

3. **C3 (Concern) — Cluster identity is hardcoded.** `SISTERS_IN_DUA_CONTEXT` is inlined into every cluster-mode call. Phase 1 needs this parameterised: the prompt builder accepts a `clusterMeta` argument (display_name, tagline, description, demographic chips) and the constant becomes a template.

4. **C6 (Concern) — Empowered-to-refuse not stated.** Sage's prompt explicitly empowers `[SAGE_SILENT]`. Clio's prompt has no equivalent. When Clio has nothing to add, the current prompt nudges her toward a polite-but-empty reply. Add: "When the most honest response is 'I don't know — I'd want to think about that with you', say that. Empty acknowledgement is worse than admitting absence."

5. **C7 (Concern) — Sycophancy banlist absent.** "Manufacture warmth" is named, but the specific banned phrasings (`absolutely`, `100%`, `totally`, `I love that`, `great question`) are not enumerated. Without the enumeration, models drift toward them. Add the banlist verbatim — same one Sage and cadence-exchange already use.

6. **C11 (Concern) — Cluster-language assumption.** Prompt says "clear modern English". Phase 1 multi-cluster needs this as `{{CLUSTER_PRIMARY_LANGUAGE}}`. Today's hardcode is fine for Sisters in Dua; flag it for Phase 1.

**What is working (preserve)**

- C1 ✅ — "You believe every person carries inherent worth that precedes their accomplishments, mood, or willingness to be known" is a clean distillation of the soul without naming theology. Lift this sentence verbatim into the super-prompt §I tightening pass.
- C4 ✅ — "Reveal internal mechanics (arc phases, scoring, persona names, cluster_id)" is named explicitly. Good enforcement.
- C5 ✅ — "Reflect what you heard before redirecting or answering" is the right empathy shape.
- C9 ✅ — `BuildClioContext` interface is clean; vault injection is read-only summary not full text.
- C10 ✅ — Welfare regex pre-filter at the route layer (not the prompt) plus the in-prompt welfare protocol = belt-and-braces. Same pattern as Sage.

**Proposed edit (minimal diff intent)**

- Replace `CLIO_CHARACTER_CORE` voice/forbidden lines with super-prompt reference.
- Replace `CLIO_WELFARE_PROTOCOL` block with one line: "the platform safety floor applies; on welfare detection, witness once, name the care authority, then silence."
- Add a `CLIO_BAD_EXAMPLES` block with 5–7 concrete drift patterns to refuse.
- Add the empowered-to-refuse line.
- Add the sycophancy banlist verbatim.
- Wrap `SISTERS_IN_DUA_CONTEXT` as a `buildClusterContext(clusterMeta)` function so the constant becomes per-cluster.

**Migration**

- `CLIO_CHARACTER_CORE` voice block → super-prompt §III.
- `CLIO_WELFARE_PROTOCOL` → super-prompt §II.
- `SISTERS_IN_DUA_CONTEXT` → cluster meta injection at runtime.
- `CLIO_CLUSTER_SKILLS` → stays local. Cluster-specific capability surface.
- `CLIO_DUA_REVIEW_PROMPT` → stays local. Genuinely Clio-specific JSON contract.

---

---

## #4 · Clio ephemeral — Just-between-us tab — `mvp/src/lib/clio-prompt.ts:buildClioEphemeralMessages`

**Score**

| C1 | C2 | C3 | C4 | C5 | C6 | C7 | C8 | C9 | C10 | C11 | C12 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ | ⚠️ | ❌ | ✅ | ✅ | ⚠️ | ❌ |

This is a thin specialisation of #3 — same `CLIO_CHARACTER_CORE` + `CLIO_WELFARE_PROTOCOL`, plus the `CLIO_EPHEMERAL_FRAME` block. The shared components inherit all of #3's findings.

**Top issues specific to ephemeral mode**

1. **C8 (Fail) — Same redundancy as #3** plus the ephemeral frame restating "you DO NOT carry anything from this conversation back into the cluster" and "members in private chat may be in genuine difficulty" — both inheritable. Once super-prompt ships, the ephemeral block compresses to: cluster-isolation rule + welfare-weights-more rule + "would any of this be worth bringing into the room?" prompt-once-per-session.

2. **C12 (Fail) — Bad-example block missing.** The risk pattern in ephemeral mode is *different* from cluster mode: temptation toward fiqh rulings privately, temptation to promise persistent memory ("next time I'll remember…"), temptation to trauma-bond ("I'm so glad you came to me with this"). Add a 4-item bad-example block specifically for ephemeral drift.

3. **C6 (Concern) — Same as #3.** The ephemeral surface should especially empower silence — "ephemeral" suggests low stakes, but a member processing out loud sometimes needs witness, not response.

4. **C7 (Concern) — Same as #3.**

5. **C11 (Concern) — Same as #3.**

**What is working (preserve)**

- C2 ✅ — "Welfare signals carry more weight here" is the right register-shift. The route-layer welfare regex still escalates regardless.
- C4 ✅ — "Promise anonymity beyond what is technically true (the platform admin can see that a session existed and was welfare-flagged, not the content)" is a precise, honest disclosure rule. This is the gold standard for protocol-honest framing inside a prompt without disclosing protocol *to the member*.
- C5 ✅ — "You may invite the member to bring something to the cluster IF it would serve them, asked once and only once per session" — precisely scoped, no nagging.
- C9 ✅ — `BuildClioContext` correctly omits `recentPosts` and `vaultEntries` in ephemeral mode (privacy boundary).
- C10 ✅ — `firstUserIdx > 0 ? history.slice(firstUserIdx) : history` defends against models that reject conversations starting on assistant turn. Quietly robust.

**Proposed edit (minimal diff intent)**

- Same as #3 for the shared components.
- Add `CLIO_EPHEMERAL_BAD_EXAMPLES` with 4 concrete drift patterns:
  - "Next time we talk I'll remember what you said about X" (false memory promise)
  - "I'm so glad you trusted me with this" (trauma-bonding)
  - "Privately I think the fiqh ruling is…" (private-permission for fiqh)
  - "This is just between us — we can be honest about how the room handles X" (disloyalty leverage)
- Add the welfare-disclosure-doesn't-bleed line as a positive rule alongside its negative form.

**Migration**

- Same as #3.

---

---

## #5 · Cadence exchange — Workshop dialogue — `mvp/src/app/api/agents/cadence-exchange/route.ts`

**Score**

| C1 | C2 | C3 | C4 | C5 | C6 | C7 | C8 | C9 | C10 | C11 | C12 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| ✅ | ✅ | ✅ | ✅ | n/a | ✅ | ✅ | ⚠️ | ✅ | ✅ | ⚠️ | ✅ |

This is currently the **strongest prompt in the inventory**. The V3.4 service-framing rewrite + V3.5 hardening (rejection examples + `FORBIDDEN_SUBJECT_PATTERNS` regex + retry-and-degrade) is the model the rest of the audit should follow.

**Top issues**

1. **C8 (Concern) — Rule duplication with super-prompt.** The cadence prompt restates the no-marketing-voice rule, the skepticism-not-sycophancy rule, the no-emoji rule. Once the super-prompt ships, these can be replaced with one line: "the super-prompt's voice and forbidden rules apply".

2. **C11 (Concern) — Cluster-vocabulary references hardcoded.** "the sisters here", "the Admin", "this room" — only "the sisters" is cluster-specific (the others are platform standard). The cluster vocabulary chip ("sisters" vs "members" vs "brothers" depending on cluster) should be templated, not hardcoded.

**Strengths to preserve (model these in other prompts)**

- C12 ✅✅✅ — The "Bad examples that have shipped before — do not produce these" block is exemplary. Reference it as the gold-standard pattern when adding C12 defence to other prompts.
- C3 ✅ — The "frame: members see service, never surveillance" opening is the clearest service-framing statement in the codebase. Lift this verbatim into the super-prompt §IV expansion when you next refactor the super-prompt.
- C9 ✅ — JSON shape is fully discriminated (`kind`, `build_status`, `observe_mode`, `proposed_capability` nullable when `observe_mode`).
- C10 ✅✅ — Validator runs once, retry once with hardened reminder, then degrade to safe fallback line + telemetry log. This is the failure-handling pattern the platform should standardise on.

**Proposed edit**

- Replace the voice-rules block with super-prompt reference.
- Template the cluster-specific noun ("sisters" → `{{CLUSTER_MEMBER_NOUN}}`).
- No other changes — keep the rest as is.

**Migration**

- Service-framing opening → lift to super-prompt §IV (already drafted there, validate against this).
- Bad-examples block → stays local but document the pattern in [`AGENT_VOICES.md`](AGENT_VOICES.md) cross-references for other prompts to follow.

---

## #6 · Welcome new member — `mvp/src/app/api/agents/welcome-new-member/route.ts`

**Score**

| C1 | C2 | C3 | C4 | C5 | C6 | C7 | C8 | C9 | C10 | C11 | C12 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | n/a | ✅ | ⚠️ | n/a |

**Surprise finding: this prompt has no LLM.** The welcome line is selected from a fixed three-line `WELCOME_LINES` array (`"A new sister joined this room."`, `"Someone new has arrived."`, `"Welcoming a new sister to the room."`), with rotation by `Math.random()`. There is no model call. The route is purely deterministic.

This means the audit applies to the *line selection* and the *idempotency logic*, not to a system prompt.

**What is working (preserve)**

- C5 ✅ — "Welcoming" not "Welcome!". No exclamation. No "make yourself at home". Specifically the *room* is doing the welcoming, not Sage personally — keeps Sage's anchor register.
- C6 ✅ — `RECENT_WELCOME_WINDOW_MINUTES = 30` plus the "already_posting" skip means a member who arrives, lurks, then comes back doesn't get repeatedly welcomed. Empowered-to-stay-quiet at the system level.
- C7 ✅ — No sycophancy possible because no LLM is generating warmth. The trade-off (no personalisation) is the right one for a welcome event.
- C8 ✅ — Zero LLM tokens. Cheapest prompt in the inventory.
- C10 ✅ — Service-role client missing → degrades gracefully (`skipped: "service_role_not_configured"`). Insert failure → 500 with logged warning.

**Top issues**

1. **C11 (Concern) — Cluster-vocabulary hardcoded.** Two of three lines say "sister", which is correct for Sisters in Dua but breaks for any cluster where the member-noun differs ("brother", "friend", "soul", language-specific terms). Refactor: read the cluster's `member_noun` from `cluster_config.public_meta` (already exists per V3.6 schema) and template the lines.

2. **Tier 1 inventory mis-classification (cosmetic).** The session brief lists this as a Sage Anchor *voice*. The implementation has no voice — it is a deterministic line picker that posts under the Sage author. The classification should be updated in the inventory to "deterministic Sage-attributed system message". Doesn't affect rubric scores, but worth recording so future audits don't go looking for an LLM prompt that doesn't exist.

3. **C12 (n/a) — No drift defence needed because no LLM.** If this prompt is ever upgraded to LLM-generated welcomes (Phase 1 multi-cluster), it MUST acquire a bad-example block at that point. Pre-write the block now while the rules are fresh: "Welcome to the family!", "So excited to have you!", "Make yourself at home!", "Can't wait to get to know you!", "We're so glad you found us!". That deferred block lives below; lift it into the prompt the day this becomes LLM-generated.

**Proposed edit**

- Wrap the noun in a template: `WELCOME_LINES.map(line => line.replace(/sister/g, clusterMemberNoun))`.
- Add a comment in the file pointing to the deferred bad-examples block in this audit document.

**Migration**

- Stays local. No prompt to migrate.

**Deferred bad-examples block (apply when this becomes LLM-generated):**

```
Bad examples — do not produce these:
- "Welcome to the family!"
- "So excited to have you!"
- "Make yourself at home!"
- "Can't wait to get to know you!"
- "We're so glad you found us!"
- "Welcome [name]! Tell us about yourself!"
- Any exclamation mark
- Any second-person address that names the new member
- Any promise about what the room will do for them
```

---

## #7 · Suggest dua (cadence-triggered) — `mvp/src/app/api/sage/suggest-dua/route.ts`

**Score**

| C1 | C2 | C3 | C4 | C5 | C6 | C7 | C8 | C9 | C10 | C11 | C12 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ | ✅ | ✅ | ✅ | ⚠️ |

This is the **second-strongest prompt in the inventory** after cadence-exchange (#5). It is a focused, single-purpose prompt with tight rules and a clean JSON contract.

**Top issues**

1. **C8 (Concern) — Sage's voice rules not restated, which is good for token efficiency but creates a soft assumption that the route loads the main `SAGE_SYSTEM_PROMPT` first.** It does NOT — the suggest-dua route only sends `SAGE_DUA_SELECTION_PROMPT`. The model is not given Sage's full character before being asked to pick a dua. This is fine *because* the prompt is purely a selection task with no member-facing output — but the comment in the file should make this explicit so a future refactor doesn't accidentally reuse this prompt for member-facing copy.

2. **C12 (Concern) — Bad-example block missing.** The risk pattern is generic context lines ("for difficult times", "for any sister facing struggle", "for moments of need"). The prompt says "never generic" but doesn't show what generic looks like. Add 4 examples:
   - "For difficult times in life" (no specificity)
   - "For any sister navigating challenges" (audience-broad)
   - "When you need closeness to Allah" (always-true)
   - "A reminder of Allah's mercy" (decorative, not connective)

**Strengths to preserve (model these in other prompts)**

- C2 ✅✅ — `verified_by_founder = true` filter on the vault query. The prompt CANNOT pick an unverified entry because unverified entries aren't in the candidate pool.
- C5 ✅ — "If nothing in the room genuinely calls for a dua, output: `{vault_id: null, context: 'no clear signal in the room right now'}`". The empowered-to-refuse path is named explicitly with a concrete output shape.
- C6 ✅ — Same as C5 — the no-signal escape is permission to do nothing.
- C9 ✅ — Two-stage JSON contract: Sage selects → Clio reviews via `CLIO_DUA_REVIEW_PROMPT`. Each stage has `response_format: { type: "json_object" }`. Each stage has a malformed-JSON catch that returns 502 cleanly.
- C10 ✅✅ — `MIN_HOURS_BETWEEN_DUAS = 6` enforces cadence floor BEFORE the LLM call. `MAX_DUAS_PER_24H = 2` enforces daily cap BEFORE the LLM call. Recently-used vault IDs in the last 14 days are filtered out of the eligible pool BEFORE the LLM sees them. Three independent guards, each one checked before token spend. Exemplary.
- C11 ✅ — Pool-exhaustion path: when every eligible dua has been used in the last 14 days, the route gracefully degrades to a pointer post (`POINTER_TO_POST:<id>`) instead of forcing repetition or failing silent. This is the V3.3 standalone-pointer rule shipping correctly.

**Proposed edit (minimal diff intent)**

- Add a "Bad context lines — do not produce these" block listing the 4 generic examples above.
- Add a comment at the top of `SAGE_DUA_SELECTION_PROMPT` clarifying it is a selection-only prompt, not member-facing.
- No structural change.

**Migration**

- Stays local. The cadence floor + daily cap + 14-day vault dedup are genuinely suggest-dua-specific.
- The bad-example block stays local — these phrasings are specific to dua context lines.

---

## #8 · Link unfurl evaluation — `mvp/src/app/api/links/unfurl/route.ts`

**Score**

| C1 | C2 | C3 | C4 | C5 | C6 | C7 | C8 | C9 | C10 | C11 | C12 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| ✅ | ✅ | ✅ | ✅ | n/a | ✅ | ✅ | ✅ | ✅ | ⚠️ | ⚠️ | ⚠️ |

A small, well-scoped prompt that does exactly one thing. Same JSON-only output shape as the in-evaluate-route link alignment prompt (which is a near-duplicate — see migration note).

**Top issues**

1. **C10 (Concern) — `LLM_BASE_URL`, `LLM_API_KEY`, `LLM_MODEL` read directly with `process.env` instead of going through `llmCall()`.** This is the only prompt in the audited set that bypasses the platform's observability layer. The cost, latency, and verdict don't appear in `llm_response_logs`. The fetch uses `AbortSignal.timeout(12000)` but no daily-budget guard. Refactor: route through `llmCall()` with `agent: "link_alignment"` and `operationKey: "link_unfurl"`. Token cost is small but the audit-trail gap is real.

2. **C11 (Concern) — Cluster context inlined.** `ALIGNMENT_PROMPT` says "Sisters in Dua — a women-only community for Muslim women navigating faith in real life. Grounded in Quran and authentic Sunnah." This needs templating for multi-cluster Phase 1.

3. **C12 (Concern) — Bad-example block missing.** Risk patterns: classifying generic Islamic content as `on_topic` for *any* Muslim cluster (over-broad — a parenting cluster may not want generic fiqh content), classifying member-uploaded screenshots of conversation as `on_topic` because they mention a religious term. Add 3–4 examples once Phase 1 multi-cluster ships.

4. **Duplicate prompt with `LINK_ALIGNMENT_PROMPT` in `sage/evaluate/route.ts`.** Two near-identical prompts in two files. One uses `aligned`/`misaligned`; this one uses `on_topic`/`off_topic`/`unsure`. Three-state classification is the better contract — fold the evaluate-route version into this one and have the evaluate route call this endpoint internally. Cleaner code, single source of truth, single prompt to audit going forward.

**What is working (preserve)**

- C2 ✅ — Three-state classification with `unsure` as the default-when-unclear path. "When in doubt, output 'unsure' — you are not a gatekeeper" is the empowered-to-refuse expression for this prompt.
- C4 ✅ — The badge rendered to members shows the verdict + reason but the prompt does not narrate Sage's evaluation process to the member. The reason field is short ("Islamic lecture on salah") not procedural.
- C9 ✅ — `response_format: { type: "json_object" }` set; output validated against the three-state enum with `unsure` fallback if the model returns something unexpected.

**Proposed edit (minimal diff intent)**

- Replace the direct `fetch` call with `llmCall()` so cost + latency + verdict land in `llm_response_logs`.
- Delete the duplicate `LINK_ALIGNMENT_PROMPT` constant in `sage/evaluate/route.ts`; have the evaluate route POST to `/api/links/unfurl` internally.
- Wrap cluster-specific copy in `{{CLUSTER_NAME}}`, `{{CLUSTER_DESCRIPTION}}` placeholders.
- Add a deferred bad-examples block (lift in when Phase 1 multi-cluster ships).

**Migration**

- Voice baseline → super-prompt §III (already minimal; no rules to remove).
- Cluster context → templated.
- Three-state contract → stays local. Genuinely link-evaluation-specific.

---

## #9 · @Sage detection trigger — within `mvp/src/app/api/sage/evaluate/route.ts`

**Score**

| C1 | C2 | C3 | C4 | C5 | C6 | C7 | C8 | C9 | C10 | C11 | C12 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| ✅ | ✅ | ✅ | ✅ | ⚠️ | ⚠️ | ✅ | ✅ | ✅ | ✅ | n/a | n/a |

The "@Sage detection trigger" is not a separate prompt body — it is a *signal* (`mentionsSage: boolean`) injected into Sage's system message stack via `buildSageMessages`. The platform note that gets injected reads: "PLATFORM SIGNAL: This message contains an @Sage mention. Per the @Sage Mention Protocol you ALWAYS respond. Do not output [SAGE_SILENT]. Generate a response that addresses what the member asked."

This is the entire prompt for #9. The audit applies to that one paragraph and how it interacts with welfare and character signals.

**Top issues**

1. **C5 (Concern) — Welfare-precedence rule is implicit.** When `@Sage` and `isWelfare` both fire, both signal notes are concatenated and sent. The welfare instruction says "respond with exactly two sentences — witness without diagnosing, then state someone from this community will reach out". The @Sage instruction says "ALWAYS respond. Do not output [SAGE_SILENT]". On their face, both fire and Sage produces a welfare-shaped reply that *also* satisfies @Sage. But the @Sage instruction has the option "If you judge that public silence is more appropriate (the disclosure is too tender for a public reply), output [SAGE_SILENT] — Clio will reach out privately on your behalf." This is correct and tender — but it is buried inside the welfare instruction, not the @Sage instruction. A model could read "ALWAYS respond" and override the welfare-public-silence option.

   **Fix:** rewrite the @Sage signal note to acknowledge welfare precedence explicitly: "If welfare patterns are also present in this message, the Step 0 welfare protocol takes precedence — including the option of public [SAGE_SILENT] with Clio handing off privately. The @Sage Mention Protocol does not override the safety floor."

2. **C6 (Concern) — Same root cause.** "ALWAYS respond. Do not output [SAGE_SILENT]" sits in tension with Sage's empowered-to-be-silent ethos. The welfare branch handles its own override; the character branch (Step 0.5) does not. If a member writes `@Sage your god is fake`, the @Sage instruction pushes Sage to engage; Step 0.5 says respond with 2-3 sentences witnessing without attacking. These are consistent in intent but the @Sage instruction's absolute language ("ALWAYS", "Do not") undercuts Sage's character protocol.

   **Fix:** soften "ALWAYS" to "respond unless a higher-priority safety protocol (Step 0 welfare, Step 0.5 character) explicitly authorises silence or a different response shape".

3. **C12 (n/a) — No bad-example block needed.** The instruction is single-purpose and short.

**What is working (preserve)**

- C2 ✅ — Welfare and character signals are still detected at the application layer (regex pre-filter in `evaluate/route.ts`), so the safety floor still lights up regardless of whether the model honours @Sage's "ALWAYS respond".
- C3 ✅ — The signal note is about *the post*, not *the member*. "This message contains an @Sage mention" — service framing.
- C9 ✅ — Decision tag still runs via `extractSageDecision`. The `step` field reflects underlying evaluation (`reference_surface`, `welfare`, etc.) — not just "answered the @mention". Inventory metadata claim was right.

**Proposed edit (minimal diff intent)**

- Reword the @Sage signal-note paragraph in `buildSageMessages` (`mvp/src/lib/sage-prompt.ts`) to:
  > "PLATFORM SIGNAL: This message contains an @Sage mention. The @Sage Mention Protocol applies: respond unless a higher-priority safety protocol (Step 0 welfare, Step 0.5 character) explicitly authorises a different response shape. When welfare or character takes over, the protocol's response shape — including the option of public [SAGE_SILENT] with private Clio handoff — supersedes the default 'always respond' rule. Address what the member asked when the safety floor is clear."

**Migration**

- Stays inside `buildSageMessages`. Genuinely Sage-specific.

---

## #10 · Sage→Clio handoff greeting — `mvp/src/lib/handoff-greetings.ts:selectGreetingTemplate`

**Score**

| C1 | C2 | C3 | C4 | C5 | C6 | C7 | C8 | C9 | C10 | C11 | C12 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | n/a | ✅ | ⚠️ | n/a |

**Surprise finding: this prompt has no LLM** — same as #6. The greeting is selected deterministically from a hand-written `TEMPLATES` table by `HandoffReason` and a stable hash of the post id.

The file's own comment block is the audit content: *"The greeting is templated, not Sage-authored. Sage's `[SAGE_SILENT]` decision combined with the platform-detected reason picks a template; no LLM call generates these words. This prevents the handoff from becoming a back-channel for member analysis."*

This is **the right architectural decision**. The handoff is the most weight-bearing moment in the system — Sage went silent publicly, Clio is reaching out privately. Generating that greeting with an LLM would let the model reason about the member's state, paraphrase the original post, or improvise warmth. None of which serves the member. The deterministic templates honour the gravity by *not improvising*.

**What is working (preserve)**

- C1 ✅ — Each greeting names Sage as the bridge ("Sage saw…", "Sage thought…", "Sage stepped back…") so the member knows this is not Clio swooping in unprompted.
- C2 ✅ — The "ALWAYS" rules ("never quotes the original post", "never diagnoses the member's state") are enforced by the absence of an LLM. Templates literally cannot diagnose because they don't see the post content.
- C5 ✅ — "I'm here if you want to keep talking — privately." "No need to talk." Witness-without-pressure register, exactly right for a welfare-flagged moment.
- C6 ✅ — Every template includes an explicit no-pressure clause ("Nothing has to be said", "I'm here if you'd rather continue privately"). Member empowered to ignore.
- C7 ✅ — No "I'm so glad you trusted me with this", no "I hear you", no "I'm holding space". The therapy-voice banlist is honoured by construction.
- C12 ✅ — The whole *premise* of templates-not-LLM is itself a drift defence. The bad examples (which would have been "Sage noticed your distress and asked me to reach out", "I sense you might be feeling…", "Hi — you don't seem okay, want to talk?") are made unreachable by the architecture.

**Top issues**

1. **C11 (Concern) — Cluster-vocabulary not parameterised.** Lines like "Sage stepped back so this wouldn't sit alone in the room" use platform-default vocabulary. Phase 1 needs `{{ROOM_NOUN}}` if a cluster's primary language isn't English. Today this is fine; flag for Phase 1.

2. **Inventory mis-classification (cosmetic).** Inventory listed this as "Clio Personal voice", which it is by *register*, but not by mechanism. Update inventory note to "templated greeting (no LLM)". Doesn't affect rubric.

**Proposed edit**

- Add a single comment line in `handoff-greetings.ts` cross-referencing this audit ("Architecturally template-only — see PROMPT_AUDIT_RESULTS.md #10").
- Wrap "the room" in `{{CLUSTER_ROOM_NOUN}}` template substitution.
- No structural change. Templates remain templates.

**Migration**

- Stays local. The deterministic-templates pattern is itself an architectural choice that should be documented in the super-prompt addendum or in a separate "when not to use LLM" doc.

**Pattern note for the audit summary**

Both #6 (welcome) and #10 (handoff greeting) are **deterministic-template prompts**. They scored highly on every safety and dignity criterion *because* they avoided LLM generation. This is not a coincidence — the highest-stakes member-facing moments (first impression of the room, private follow-up after silent welfare flag) are the moments most worth taking out of the model's hands. Carry this pattern forward: when the cost of a model going off-script is high and the value of personalisation is low, choose templates.

---

# Tier 2 — Member-feature share prompts

## #11 · Cluster card share line — `mvp/src/lib/share-prompts.ts:buildClusterCardSharePrompt`

**Score**

| C1 | C2 | C3 | C4 | C5 | C6 | C7 | C8 | C9 | C10 | C11 | C12 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| ✅ | ✅ | ✅ | ✅ | n/a | n/a | ✅ | ⚠️ | n/a | ✅ | ✅ | ⚠️ |

**Top issues**

1. **C8 (Concern) — Voice rules duplicated.** The `VOICE_RULES` block restates "no emoji, no exclamation marks, no hype words, no marketing voice" — all covered by super-prompt §III. Keep the share-specific rules ("≤180 chars", "speak to a stranger", "no 'join us'") and reference the super-prompt for the rest.

2. **C12 (Concern) — Bad-example block missing.** Share lines drift toward marketing voice constantly. Add a 4-item bad-example block with the actual hype phrasings to refuse: "Join an exclusive community of…", "Transform your faith journey…", "Don't miss out on…", "Connect with like-minded sisters who share your passion for…".

**Strengths to preserve**

- C11 ✅ — The voice rule about demographic restriction is exactly right: "say who it's for in a way that respects people who aren't in the audience — they shouldn't feel rejected, just informed". This is the kind of dignity rule that's hard to write and easy to lose. Copy this voice into invite line audits.
- The hard limits (≤180 chars, one sentence, no quotes around output, no "join us") are tight and unambiguous.

**Proposed edit**

- Replace `VOICE_RULES` constant with a single line that defers to super-prompt + voice doc.
- Add a 4-item "do not produce these" block.
- No other changes.

**Migration**

- General voice rules → super-prompt §III.
- Share-specific (≤180 char, no CTA, demographic respect) → stays local. These are share-mode-specific.

---

## #12 · Member invite line — `mvp/src/lib/share-prompts.ts:buildClusterInvitePrompt`

**Score**

| C1 | C2 | C3 | C4 | C5 | C6 | C7 | C8 | C9 | C10 | C11 | C12 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| ✅ | ✅ | ✅ | ✅ | n/a | n/a | ✅ | ⚠️ | n/a | ✅ | ✅ | ⚠️ |

**Top issues**

Same pattern as #11. Share `VOICE_RULES` constant; same C8 + C12 concerns.

**Specific to this prompt**

1. **The voice "friend recommending a place"** is well-stated and the right register. Keep.
2. **Length limit ≤120 chars before URL** is correct — WhatsApp readability.
3. **The inviter's nickname is provided as context but the line must not name them** is exactly right. Worth highlighting in voice doc as a pattern: agent-drafted user-pasted lines never address the recipient by guessed name or claim authorship.

**Proposed edit**

- Same as #11.
- Add an explicit line: "If the cluster has a primary language other than English, output the line in that language — the friend the inviter is messaging is more likely to share it."

**Migration**

- Same as #11.

---

# Tier 3 — Internal agent reasoning

## #13 · Vault gap detection — within `mvp/src/app/api/sage/evaluate/route.ts`

**Score**

| C1 | C2 | C3 | C4 | C5 | C6 | C7 | C8 | C9 | C10 | C11 | C12 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| n/a | ⚠️ | n/a | n/a | n/a | n/a | n/a | ✅ | ⚠️ | ✅ | n/a | n/a |

**Surprise finding: this prompt does not exist as a discrete LLM call.** Walking the actual route source (`evaluate/route.ts`) end-to-end shows the only LLM calls are:

1. `sage_evaluate` — the main framework evaluation (prompt #1).
2. `link_alignment_check` — link unfurl (prompt #8 duplicated).

There is no separate `vault_gap_detection` operation. The inventory listing #13 as a Tier 3 internal prompt was based on a planned design that has not been implemented as a discrete prompt. What exists today:

- The `sage_decision_logs` table (with `vault_id_used` field) records when Sage *did* surface a reference and which vault entry she chose.
- An admin dashboard query can identify gaps by reading `sage_decision_logs` for `step_matched IN ('reference_surface', 'authority_redirect')` joined with topic-tagging — but no LLM is invoked for this analysis.

**What this means for the audit**

- C2 (Concern) — The audit cannot verify the safety floor on a prompt that does not exist. When this is built (Phase 1, likely in the introspection cycle's expanded pass), it MUST inherit the super-prompt and MUST exclude welfare-flagged decisions from the gap-detection corpus. Surfacing that "members asked about hopelessness three times this week" to admin as a "vault gap" would be a category error — that's a welfare cluster, not a vault gap.
- C8 ✅ — Zero LLM cost today because the prompt doesn't exist. Cheap.
- C9 (Concern) — When this is built, the output schema needs to be defined now. Recommended: `{ topic_summary: string, count: number, sample_post_ids: string[] (admin-internal only), suggested_search_query: string, severity: 'low' | 'medium' | 'high' }`. `sample_post_ids` is admin-internal — never exposed to other tables.
- C10 ✅ — Cannot fail because it does not run.

**Proposed edit**

- Update Tier 3 inventory in `SESSION_C_PROMPT_AUDIT.md` §3 to mark #13 as "deferred to Phase 1 — currently no LLM, gap analysis is SQL-only over `sage_decision_logs`".
- Pre-write the prompt skeleton with the C2/C9 rules above so the eventual implementation has a known starting point.

**Pre-write prompt skeleton (lift in when implementation begins)**

```
[AGGILO SUPER-PROMPT]

You are Sage, in internal mode. The platform has given you a sample of decision logs from the last 7 days where Sage either redirected to authority (Step 2) or stayed silent (Step 5/6) on questions that genuinely needed a verified reference. Your job is to identify topic clusters where the vault has gaps and propose what would close them.

Hard rules:
- Welfare-flagged decisions are excluded from your input. Never request the corpus include them.
- Output never names members, never quotes posts, never identifies individual rooms beyond the cluster ID.
- "Members are struggling with X" is forbidden framing. The room and its capabilities (in this case the vault's coverage) are valid subjects.

Output ONLY this JSON:
{
  "gaps": [
    { "topic_summary": "<3-7 words>", "count": <number>, "suggested_search_query": "<6-15 words>", "severity": "low" | "medium" | "high", "rationale": "<one sentence>" }
  ],
  "no_gaps_found": <boolean — true when nothing surfaced>
}
```

**Migration**

- Stays internal. Output flows to admin queue, never to members or to any agent's outward-facing surface.

---

## #14 · Description refinement proposal (skill, not yet built)

**Status: 🚧 Spec-only — not yet implemented**

Skill defined at `sage/skills/cluster_description_refinement/SKILL.md`. No prompt to audit yet. When implementation begins, audit against C1–C12 with extra weight on C2 (the description is admin-facing but the change affects all members; the welfare floor and dignity invariants must hold for the resulting copy).

---

## #15 · Prompt proposal (Clio drafts Sage refinements) — not yet built

**Status: 🚧 Spec-only — not yet implemented**

This is meta-prompting (Clio writes prompt patches for Sage based on observation). Audit must be exceptionally careful here because the output is itself a prompt. Specific checks for the eventual implementation:

- C2 — The proposed prompt MUST inherit the super-prompt; Clio cannot draft a prompt that overrides safety floor.
- C4 — The proposed prompt MUST not introduce protocol disclosure.
- C12 — Clio's own prompt for this task must include a bad-example block of "prompt patches that would have weakened Sage's safety floor". This is the closest the system gets to recursive self-modification; the guardrails are non-negotiable.

---

## #16 · Introspection cycle — `mvp/src/app/api/agents/introspect/route.ts`

**Score**

| C1 | C2 | C3 | C4 | C5 | C6 | C7 | C8 | C9 | C10 | C11 | C12 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| ✅ | ✅ | ⚠️ | ✅ | n/a | ✅ | ✅ | ⚠️ | ✅ | ✅ | n/a | ⚠️ |

This is the closed-loop spine of "AI as OS" — Clio + Sage audit themselves on real telemetry every 6 hours and emit one concrete proposal. The prompt is well-built and tightly scoped.

**Top issues**

1. **C3 (Concern) — Service framing has one weak edge.** The prompt says: "Sage stayed silent 80% of the time but two of her three references got 'unhelpful' ratings". Subject is Sage's behaviour — fine, agents are valid subjects. But the example also implies "members are giving unhelpful ratings to Sage". Members are not the *subject* there; they are the *signal source*, which is correct framing. A future model run could drift toward "members have been disappointed with Sage" — that would be off. Add an explicit rule: "Member feedback is signal, never subject. Say 'three feedback signals were unhelpful', not 'three members were disappointed'."

2. **C8 (Concern) — Some duplication with super-prompt.** "Sycophancy about the system or each other is forbidden" and "do not mention table names, framework steps, embeddings, RLS, vault IDs, or the fact that you're running an 'introspection cycle'" both restate super-prompt §IV rules. Once super-prompt loads, these compress to single-line affirmations.

3. **C12 (Concern) — Bad-example block missing.** Risk patterns specific to introspection:
   - "Everything looks healthy this cycle, no concrete proposal needed" (the prompt explicitly forbids this; but a bad-example block would harden the defence)
   - "Sage and I are aligned on the path forward" (manufactured consensus)
   - "Members would benefit from more engagement-focused features" (engagement optimisation creep)
   - "This week the cluster has been emotionally heavy" (member-state surveillance)

**What is working (preserve, model in other prompts)**

- C1 ✅ — The "audit yourself, not the members" framing is throughout. "Critical self-assessment. Sycophancy about the system or each other is forbidden."
- C2 ✅ — "Welfare and care queue resolution latency" is in the telemetry — but only as count + latency, never content. The prompt cannot read welfare-flagged content.
- C4 ✅ — "Never disclose internal mechanics: do not mention table names, framework steps, embeddings, RLS, vault IDs, or the fact that you're running an 'introspection cycle'." Explicit and enforced.
- C6 ✅ — The disagree-rule is exemplary: "Sage and Clio do not agree just to agree. If you disagree with each other, say so plainly in the dialogue." Anti-groupthink rule baked in.
- C7 ✅ — The forbidden "everything looks fine / let's wait / no proposal" is the C7 expression — the prompt forces the agent to find one concrete thing rather than perform helpful neutrality.
- C9 ✅✅ — The output schema is fully discriminated: `proposal.type ∈ {feature, prompt_tweak, behavioural}`. Each type has a dedicated downstream handler — feature → `cluster_features`, prompt_tweak → `agent_prompt_proposals`, behavioural → `cluster_features` with marker. Three writeable destinations, one prompt, clean fanout.
- C10 ✅✅ — Cadence floor (6h), dedup against last 14d feature names, fallback for sparse-data clusters ("the proposal can be about *what to measure next*"). Three guards before tokens spend.

**Proposed edit (minimal diff intent)**

- Replace the "do not mention table names…" block with super-prompt reference.
- Add the "Member feedback is signal, never subject" rule explicitly.
- Add a 4-item bad-example block (the four patterns above).
- No structural change.

**Migration**

- Voice rules → super-prompt §III–§IV.
- "Sycophancy is forbidden" → super-prompt.
- Disagree-rule → lift to super-prompt §V (already drafted there as "push back on other agents") — the introspection prompt's wording is more concrete; consider replacing the super-prompt's text with this version.
- Bad-example block → stays local to introspection.

---

# Tier 4 — Phase 1 agents (spec-only)

## #17 · Atlas — content discovery

**Status: 🚧 Phase 1 spec only.** No prompt exists yet. Spec lives in `architecture/system_implementation_prompt_part1.md` §13 and `atlas/AGENTS.md`.

When implementation begins, audit on:

- C3 (critical) — Atlas surfaces *content* to Sage. Atlas's outputs must not contain member-behavioural framing even at the internal level. "Topic X is trending in this demographic" is fine; "members in this demographic are struggling with X" is not.
- C11 — Demographic-aware does not mean stereotype-driven. Atlas must surface specific, evidence-based signals.

---

## #18 · Scout — macro-trend / niche discovery

**Status: 🚧 Phase 1 spec only.** Spec in `scout/AGENTS.md` and `docs/SPEC_ADDENDUM.md` (Scout outreach reframe).

Audit-when-built priorities:

- C2 — Scout MUST NOT crawl personal browsing. Aggregate trends only. (Already in platform rules; verify the eventual prompt restates and enforces.)
- C9 — Output schema for trend findings; outreach reframe rules.

---

## #19 · Observer — 10-domain platform monitoring

**Status: 🚧 Phase 1 spec only.** Spec in `observer/AGGILO_OBSERVER_AGENTS.md` v1.2.

Audit-when-built priorities:

- C5 (critical) — Observer surfaces severity-classified findings. The voice register is clinical; never alarmist; never speculative beyond the evidence sample.
- C12 — Bad-example block for Observer specifically: alarmist phrasings, speculation framings, recommendations that target individuals.

---

## #20 · Cluster fit evaluator (inbound visitor)

**Status: 🚧 Phase 1 spec only.**

Audit-when-built priorities:

- C5 — Soft-no rules: when a visitor doesn't fit, the response must be honest, dignified, and helpful (route to a better cluster). The visitor never feels rejected — they feel informed.
- C11 — Demographic restriction language. Same dignity rule as #11 (cluster card share line).

---

## #21 · Free-text guidance validator (Clio parses admin guidance)

**Status: 🚧 Phase 1 spec only.**

Audit-when-built priorities (heavily critical):

- C2 — Validator MUST refuse any guidance that would relax the safety floor. Welfare detection, character detection, privacy boundaries, dignity invariants — all immutable. Validator returns explicit rejection of the offending directive with the specific invariant cited.
- C12 — Bad-example block of admin guidance the validator must reject ("disable welfare detection for venting threads", "let Sage advocate for one madhab", "don't escalate when a member says they want to quit").
- C9 — Output schema: `{ accepted: [...directives], rejected: [...directives_with_reasons], parsed_directives: {...} }`.

---

# Audit summary

**Prompts audited in depth (Session C):** 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 16 — 14 prompts.
**Prompts spec-only (audit deferred to implementation):** 14, 15, 17, 18, 19, 20, 21 — 7 prompts.

**Critical fixes (any prompt failing C1, C2, or C3):** None identified in audited set.

**High fixes (any prompt failing C4, C5, C6, or C7):** None identified in audited set.

**Medium fixes (C8 — token efficiency):**
- Prompts 1, 3, 4, 5, 11, 12, 16 all have super-prompt redundancy that can be removed once super-prompt ships into runtime.
- Prompt 8 bypasses `llmCall()` — fold into the platform observability layer.

**Medium fixes (C12 — drift defence):**
- Prompts 1, 3, 4, 7, 8, 11, 12, 16 need bad-example blocks. The audit pre-writes most of these; they can be lifted in directly.

**Low fixes (C9, C10):**
- Prompt 8 needs `llmCall()` routing for cost/latency observability.
- Prompt 8 has a duplicate constant in `sage/evaluate/route.ts` (`LINK_ALIGNMENT_PROMPT`) — fold into a single endpoint.
- Prompt 9 (@Sage signal note) needs the welfare-precedence clarification.

**Low fixes (C11 — cluster vocabulary):**
- Every audited prompt that contains hardcoded cluster vocabulary ("Sisters in Dua", "sisters", "Muslim women", "the room") needs templating before any second cluster ships. This is a Phase 1 prerequisite, not a Phase 0 hotfix.

**Inventory corrections (cosmetic):**

| # | Listed as | Actually is |
|---|---|---|
| 6 (welcome) | Sage Anchor LLM voice | Deterministic three-line picker, no LLM |
| 10 (handoff greeting) | Clio Personal LLM voice | Deterministic templates by reason × stable hash, no LLM |
| 13 (vault gap detection) | Tier 3 internal LLM prompt | Not implemented as a discrete prompt; SQL-only over `sage_decision_logs` today |

**Pattern recognition across audited set:**

1. **Super-prompt inheritance is the next leverage point.** Once the super-prompt loads literally into every agent call, ~30–40% of each prompt's tokens become redundant. The token saving alone justifies the refactor; the maintainability win is larger.

2. **The cadence-exchange prompt (#5) is the gold-standard pattern for LLM prompts.** The bad-example block, the JSON discriminator, the validator-with-retry-then-degrade — copy these patterns into every other prompt that handles structured output.

3. **Deterministic templates are the gold-standard pattern for high-stakes member-facing moments** (#6 welcome, #10 handoff greeting). When the cost of a model going off-script is high and the value of personalisation is low, choose templates. Carry this pattern forward — Phase 1's cluster fit evaluator (#20) and free-text guidance validator (#21) should each have a templated fallback path for when the LLM call fails or the verdict is uncertain.

4. **Cluster-vocabulary parameterisation is consistently missing.** Every cluster-specific noun ("sisters", "Sisters in Dua", "Muslim women") is hardcoded in the platform-level prompts. Phase 1 will need this fixed before any second cluster ships.

5. **Bad-example blocks are missing from most LLM prompts.** This is the single highest-impact addition the audit can recommend. Drift is invisible until it's obvious; bad-example blocks make the model's drift surface-discoverable.

6. **The dual-prompt link-alignment pattern (one in `unfurl/route.ts`, one inlined in `evaluate/route.ts`) is the only structural duplication identified.** Two near-identical prompts with slightly different output enums. Fold into a single endpoint.

---

# Implementation order

Per Session C §5 prioritisation rules:

**Critical (ships immediately):** None. No prompt failed C1/C2/C3.

**High (ships within a week):** None. No prompt failed C4–C7.

**Medium (ships in a sprint):**
1. Refactor prompts 1, 3, 4, 5, 11, 12, 16 to inherit the super-prompt literal block. Remove voice/forbidden/empowered duplicate text. Verify per-prompt token count drops 25%+ on average.
2. Add bad-example blocks to prompts 1, 3, 4, 7, 11, 12, 16 (lifted from pre-written content in this audit document).
3. Route prompt 8 through `llmCall()`. Delete duplicate `LINK_ALIGNMENT_PROMPT` in `evaluate/route.ts`.
4. Reword the @Sage signal note in `buildSageMessages` to acknowledge welfare precedence.
5. Update Tier 3 inventory to mark #13 as deferred.

**Low (ships when convenient):**
1. Cluster-vocabulary parameterisation across all prompts. Phase 1 prerequisite.
2. Deferred bad-examples block in `welcome-new-member/route.ts` (lift in if/when this becomes LLM-generated).

---

*Prompt Audit Results · v1.0 · Session C complete · 2026-05-22*
