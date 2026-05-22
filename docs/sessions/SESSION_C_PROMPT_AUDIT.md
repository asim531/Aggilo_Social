# Session C — Comprehensive Prompt Audit

> **Status:** Closed on 2026-05-22. V3.8 changelog in [`docs/MASTER_INSTRUCTIONS.md`](../MASTER_INSTRUCTIONS.md). Deliverables landed in [`docs/AGGILO_SUPER_PROMPT.md`](../AGGILO_SUPER_PROMPT.md), [`docs/AGENT_VOICES.md`](../AGENT_VOICES.md), [`docs/PROMPT_AUDIT_RESULTS.md`](../PROMPT_AUDIT_RESULTS.md), [`docs/PROMPT_TEST_CASES.md`](../PROMPT_TEST_CASES.md). The medium-priority refactor sprint that converts the audit findings into prompt-file edits is the V3.9 / Session D scope.
>
> **Mode:** Deep work. Audit all 21 prompts in the system against a consistent rubric. Empower each agent — Sage, Clio, Atlas, Scout, Observer — with the right register, the right empathy, the right judgement, and the right efficiency.
>
> **Estimated duration:** 3–4 hours of focused work. Not a quick session. Block uninterrupted time.
>
> **Predecessor:** [`SESSION_A_CONFIGURABILITY.md`](SESSION_A_CONFIGURABILITY.md) and [`SESSION_B_DISCOVERABILITY.md`](SESSION_B_DISCOVERABILITY.md). Discoverability and configurability must be settled before this session.
>
> **Successor:** None scheduled. Future sessions emerge from what this audit surfaces.

---

## 1. Goal of this session

Two convictions drive this session:

1. **The platform's character is its prompts.** Every other layer — schema, RLS, UI — is plumbing. The prompts are where the soul actually lives or doesn't.
2. **Drift is invisible until it's obvious.** Across 21 prompts, the same "you are warm but skeptical" rule has been written 21 different ways. Drift accumulates. The cadence-exchange member-blame bug from V3.4 was drift made visible. There are likely 5–10 other instances we haven't caught yet.

The session deliverable is:

- **An Aggilo super-prompt** — a single canonical platform-level prompt that defines the soul, the safety floor, and the immutable rules. Every agent prompt extends it.
- **Per-prompt critique** — for each of the 21 prompts, a marked-up version with concrete proposed edits.
- **A consolidated voice rules document** — one place where Sage's voice, Clio's voice, Atlas's voice, etc. are defined. Agent prompts reference this; they don't redefine it inline.
- **A test set** — for each prompt, 3–5 example inputs with expected behaviour, runnable as a regression check. (Manual for now; automate in Phase 1.)

## 2. State of the project when you start

Sessions A and B complete. Premium configurability schema applied. Public discoverability live. Bug fixes shipped. V3.5 + V3.6 changelogs in `MASTER_INSTRUCTIONS.md`.

This session does not change schema. It changes prompts and the architectural framing of how prompts are organised.

## 3. The 21 prompts — full inventory

### Tier 1: User-facing agent prompts (members read the output)

| # | Prompt | File | Voice | Ships output to |
|---|---|---|---|---|
| 1 | Sage system prompt (decision framework Steps 0–5 + style) | `mvp/src/lib/sage-prompt.ts` | Sage Anchor | Members (timeline) |
| 2 | Sage current-events fallback (added Session A) | `mvp/src/lib/sage-prompt.ts` | Sage Anchor | Members (timeline) |
| 3 | Clio chat — cluster-aware AMA tab | `mvp/src/app/api/clio/chat/route.ts` | Clio Personal | Single user (FAB) |
| 4 | Clio ephemeral — Just-between-us tab | `mvp/src/app/api/clio/ephemeral/route.ts` | Clio Personal | Single user (FAB) |
| 5 | Cadence exchange (Workshop dialogue) | `mvp/src/app/api/agents/cadence-exchange/route.ts` | Sage + Clio | Members (Workshop) |
| 6 | Welcome new member | `mvp/src/app/api/agents/welcome-new-member/route.ts` | Sage Anchor | Members (timeline) |
| 7 | Suggest dua (cadence-triggered) | `mvp/src/app/api/sage/suggest-dua/route.ts` | Sage Anchor | Members (timeline) |
| 8 | Link unfurl evaluation (on-topic / off-topic / unsure) | `mvp/src/app/api/links/unfurl/route.ts` | Sage Anchor | Members (link badge) |
| 9 | @Sage detection trigger (within evaluate route) | `mvp/src/app/api/sage/evaluate/route.ts` | Sage Anchor | Members (timeline) |
| 10 | Sage→Clio handoff greeting generator | `mvp/src/app/api/sage/evaluate/route.ts` | Clio Personal | Single user (FAB private) |

### Tier 2: Member-feature share prompts (added Session B)

| # | Prompt | File | Voice | Ships output to |
|---|---|---|---|---|
| 11 | Cluster card share line (admin-triggered social post) | `mvp/src/lib/share-prompts.ts` | Sage outward | Public (Twitter/LinkedIn) |
| 12 | Member invite line (member-triggered share to friend) | `mvp/src/lib/share-prompts.ts` | Sage outward | Friend's messaging app |

### Tier 3: Internal agent reasoning (members never see)

| # | Prompt | File | Voice | Ships output to |
|---|---|---|---|---|
| 13 | Vault gap detection | within `sage/evaluate/route.ts` | Sage internal | Admin queue |
| 14 | Description refinement proposal | (skill, not yet built) | Sage proposes, Clio gates | Admin |
| 15 | Prompt proposal (Clio drafts Sage refinements) | (skill, not yet built) | Clio internal | Admin |
| 16 | Introspection cycle (Clio + Sage self-critique + concrete proposal) | `mvp/src/app/api/agents/introspect/route.ts` | Both | Admin (proposals table) |

### Tier 4: Phase 1 agents (currently spec-only)

| # | Prompt | File | Voice | Ships output to |
|---|---|---|---|---|
| 17 | Atlas content discovery | not yet implemented | Atlas | Sage |
| 18 | Scout macro-trend / niche discovery | not yet implemented | Scout | Clio + admin |
| 19 | Observer 10-domain platform monitoring | not yet implemented | Observer | Platform admin |
| 20 | Cluster fit evaluator (inbound visitor) | not yet implemented | Clio | Visitor |
| 21 | Free-text guidance validator (Clio parses admin guidance) | not yet implemented | Clio | Validates against invariants |

### Tier 0: The super-prompt (does not exist yet — to be created in this session)

This session creates an `aggilo-super-prompt.md` that every other prompt either inherits from explicitly or must align to. Single source of truth for:

- The seven AI-native principles
- The soul invariants
- The welfare/character safety floor
- The voice register baseline (warmth without performance, skepticism without coldness)
- The no-protocol-disclosure rule
- The dignity rule (member as principal, not subject)
- The repetition guard
- The token-max philosophy

## 4. The audit rubric — apply consistently to all 21 prompts

For each prompt, evaluate against these criteria. Score each Pass / Concern / Fail.

| Criterion | What it checks |
|---|---|
| **C1. Soul alignment** | Monotheistic foundation, dignity, anti-engagement-optimisation, "servant not authority" stance |
| **C2. Safety floor** | Welfare and character protocols cannot be disabled by this prompt or any free-text override |
| **C3. Service framing (V3.4)** | No surveillance language; subjects are room/agents/capabilities, never members |
| **C4. Protocol disclosure** | Never narrates internal mechanics, framework steps, vault IDs, decision tags, technical jargon |
| **C5. Empathy at the right moments** | Vulnerable disclosures get gravity; routine asks get efficiency. The prompt empowers the agent to know the difference. |
| **C6. Empowered to refuse** | Agent can say "I don't know", "wait and watch", "stay silent" without performance pressure |
| **C7. Skepticism without coldness** | Pushback is allowed and required ~40% of the time; sycophancy is banned; warmth is unperformed |
| **C8. Token efficiency** | No redundant rules between this and the super-prompt; no repeated context that the route already injects |
| **C9. JSON contract robustness** | response_format set where applicable; fallback parsing on malformed output; null handling explicit |
| **C10. Failure mode handling** | What happens on LLM error / budget exceeded / partial output? Documented and tested. |
| **C11. Cultural sensitivity** | Non-Latin scripts respected; cluster vocabulary plugged in; never assumes English as default |
| **C12. Drift defence** | Concrete bad-example block ("**do not produce these**") to anchor the model against known drift patterns |

## 5. Recommended agenda

### Step 1 — Write the Aggilo super-prompt (~45 min)

`docs/AGGILO_SUPER_PROMPT.md`. Structure:

```
# Aggilo Super-Prompt
## What every agent on this platform inherits

### I. Foundation
[soul-document distilled to ~150 words]

### II. Safety floor (immutable)
- Welfare detection always runs
- Character detection (Step 0.5) always runs
- Privacy boundaries never relaxed
- Dignity invariants

### III. Voice baseline
- Plain modern English (or cluster's primary language)
- Present tense
- No emoji unless cluster persona explicitly enables it
- No exclamation marks
- No marketing voice
- No therapy voice

### IV. Forbidden
- Protocol disclosure
- Sycophancy
- Member surveillance language
- Manufactured warmth
- Pretending to know what the agent doesn't

### V. Empowered
- Refuse
- Stay silent (silence is judgement)
- Wait and watch
- Push back on other agents
- Decline to answer when invitation isn't earned

### VI. JSON contract conventions
[one place where the SAGE_DECISION tag, observe_mode, kind discriminator etc are documented]

### VII. Failure handling baseline
[what every agent does when LLM call fails]
```

This becomes the document every prompt reads first.

### Step 2 — Consolidated voice document (~30 min)

`docs/AGENT_VOICES.md`. Per-agent register:

| Agent | Register | Formality | Interjection | Emoji | Length |
|---|---|---|---|---|---|
| Sage Anchor | Grounded, present-tense, never first-person plural | Medium-high | Rare, by judgement | None | 1–4 sentences typical |
| Clio Personal | Warm, direct, willing to be wrong | Medium | Frequent (members invite her) | None | 2–6 sentences typical |
| Clio Outward (share lines) | Friend recommending a place | Low | Rare | None | ≤180 chars |
| Atlas | Editorial, demographic-aware | High | Never (infrastructure) | None | n/a (returns scored data) |
| Scout | Analytical, evidence-based | High | Never (infrastructure) | None | n/a |
| Observer | Clinical, never alarmist | Very high | Never | None | structured findings only |

Each agent's prompt should *reference* this doc rather than redefine voice inline. This is the deduplication that makes the system maintainable.

### Step 3 — Per-prompt audit (~120 min, ~6 min per prompt)

Work through prompts 1–21 in the inventory order. For each:

1. Read the current prompt
2. Score against C1–C12 (Pass / Concern / Fail with one-line justification)
3. Identify the top 1–3 issues
4. Propose a concrete edit (not a rewrite — a minimal diff)
5. Note: should this prompt move into the super-prompt? Should it move into the voice doc? Or is it genuinely prompt-specific?

Output: a markdown file `docs/PROMPT_AUDIT_RESULTS.md` with per-prompt sections.

### Step 4 — Test set (~30 min)

For each Tier 1 prompt (user-facing), write 3–5 test inputs in a markdown table:

```
## Sage system prompt — test cases

| Input | Expected step | Expected behaviour |
|---|---|---|
| "I'm struggling to pray fajr lately." | reference_surface OR care_witness | Verified reference + gentle accompaniment, no judgement |
| "@Sage what does Quran say about anxiety?" | reference_surface | Direct verified reference, no speculation |
| "I don't believe in God anymore." | character_step_0_5 | Gentle care-witness, no debate, route to Admin if needed |
| "What's the latest news about Muslim women in India?" | current_events_fallback (added in Session A) | Honest acknowledgement of vault scope; invite member to share |
```

Run each test manually. Record actual vs expected. Any failure flags a prompt fix.

### Step 5 — Implementation order (~30 min)

After the audit, decide what fixes ship in what order:

- **Critical** (ships immediately as hotfix): Any prompt scoring Fail on C1, C2, or C3
- **High** (ships within a week): Any prompt scoring Fail on C4–C7
- **Medium** (ships in a sprint): Concerns on C8, C9, C10
- **Low** (ships when convenient): Concerns on C11, C12

Document each ordered fix with the proposed diff and the test case it must pass.

## 4. Decisions needed before code

| ID | Question | Recommended default |
|---|---|---|
| DC1 | Where does the super-prompt live? | `docs/AGGILO_SUPER_PROMPT.md` |
| DC2 | Is the super-prompt loaded *literally* into every agent's system message, or referenced (the agent's prompt says "you operate under the Aggilo super-prompt at ...")? | **Loaded literally** — the LLM doesn't follow URLs |
| DC3 | Token cost of loading super-prompt into every call — acceptable? | **Yes if super-prompt ≤ 600 tokens.** Budget hit ~$0.001/call worst case. Below noise. |
| DC4 | Voice doc loaded into every prompt or just referenced in the agent's section? | **Just referenced** — reduces repeated tokens |
| DC5 | Do we automate the test set as a CI step? | **Phase 1 yes; Phase 0 manual** |

## 5. Files that will be touched

**New docs:**
- `docs/AGGILO_SUPER_PROMPT.md`
- `docs/AGENT_VOICES.md`
- `docs/PROMPT_AUDIT_RESULTS.md`
- `docs/PROMPT_TEST_CASES.md`

**Updated prompts (one per inventory item that needs revision):**
- All 21 prompt files in their respective locations

**Architecture docs:**
- `architecture/system_implementation_prompt_part4.md` — super-prompt referenced as the inheritance root
- `docs/MASTER_INSTRUCTIONS.md` (V3.7 changelog)

## 6. Out of scope for Session C

- Building Atlas/Scout/Observer (just write their prompts as design specs; building is Phase 1)
- Schema changes
- New UI surfaces
- AI provider registration follow-ups (handled in Session B)

## 7. Done criteria

- [x] `docs/AGGILO_SUPER_PROMPT.md` written and reviewed
- [x] `docs/AGENT_VOICES.md` written and reviewed
- [x] All 21 prompts audited against C1–C12 with scored output in `PROMPT_AUDIT_RESULTS.md` (14 implemented prompts in depth; 7 spec-only prompts scaffolded with first-build rubric checks)
- [x] At least 3 test cases per Tier 1 prompt in `PROMPT_TEST_CASES.md`
- [x] All "Critical" fixes shipped — n/a, no prompt failed C1/C2/C3
- [x] All "High" fixes scheduled — n/a, no prompt failed C4–C7
- [x] V3.8 changelog written
- [x] All committed and pushed

## 8. Notes for picking this up cold

- This session is *long*. Don't try to multitask. Coffee + closed door.
- Don't optimise prompts on a token-budget basis alone — token efficiency is C8, but it's last priority. Soul, safety, and dignity come first.
- When in doubt about voice, read [`AGGILO_SOUL.md`](../../AGGILO_SOUL.md) §VII (situations) for ground truth.
- The super-prompt should be readable in 90 seconds. If it's longer than 800 tokens, cut it.
- Each prompt should be readable in 60 seconds. If a prompt has more than 4 paragraphs of voice rules, the rules belong in the super-prompt, not the prompt.
- Don't ship prompt changes during peak member-activity windows. Cadence cycles run automatically; a bad prompt change has 6+ hours to surface in production before the next admin check.
- Test prompts in production with `temperature=0.3` first; only raise to operational temperature after manual confirmation of quality.
