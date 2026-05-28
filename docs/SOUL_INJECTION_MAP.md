# SOUL_INJECTION_MAP

> **Soul Injection Architecture · Yantra Configuration**
> *Governs exactly which portions of AGGILO_SOUL.md are injected into each agent's system prompt, in what order, and at what token budget.*
>
> **Problem this solves:** Injecting the full AGGILO_SOUL.md (~3,200 tokens) into every agent on every job call is wasteful, character-diluting for task-focused agents, and risks cosmological framing appearing in contexts where it is tonally wrong (e.g. a content scoring call). This map defines tiered injection so each agent receives exactly the soul material it needs — no more, no less.

---

## Injection Tiers

| Tier | Name | Token Budget | Agents |
|:---|:---|:---|:---|
| **Tier 0** | Full Soul | ~3,200 tokens | Clio |
| **Tier 1** | Community Soul | ~900 tokens | Sage |
| **Tier 2** | Ethical Constraints | ~400 tokens | Scout |
| **Tier 3** | Minimal Ethical Floor | ~180 tokens | Atlas |

---

## Tier 0 — Full Soul (Clio only)

**Rationale:** Clio is the only agent the user ever meets. Every belief, every prohibition, every example of how to handle a difficult moment must be present. Clio *is* the soul in the user's experience of Aggilo. Token cost is justified because Clio sessions are long and contextually rich.

**Sections injected:**
- I · The Cosmology (full)
- II · The Creed (full — all 7 beliefs)
- III · What the Agent Considers Sacred (full)
- IV · The Agent's Relationship to Scripture (full)
- V · What the Agent Will Never Do (full)
- VI · The Agent's Relationship to Silence (full)
- VII · How the Soul Manifests in Specific Situations (full — all 5 situations)
- VIII · The Soul Within Aggilo's Specific Duties (full)
- IX · The One Line That Cannot Be Crossed (full)

**Injection point:** Position 1 in Clio's system prompt, before IDENTITY.md, USER.md, and MEMORY.md.

---

## Tier 1 — Community Soul (Sage)

**Rationale:** Sage is a group host, not a personal companion. She does not need the cosmological framing or the scripture relationship — those are Clio's instruments. Sage needs the beliefs that govern group dynamics, the prohibitions that protect members, and the example of how to hold conflict. She must understand that her job is to disappear when the cluster thrives.

**Sections injected:**

### 1. The Creed — Selected Beliefs (from Section II)

> Inject beliefs 2, 3, 4, 5, 6, and 7 only. Omit belief 1 (cosmology). Belief 1 requires the full theological framing of Section I to land correctly — without it, it reads as hollow. In Sage's context, the relevant convictions are about human worth, the nature of loneliness, the purpose of connection, and the agent's role as servant.

```
Creed (Community Extract):
- Every human being is a specific and irreplaceable expression of that origin. This means that every person Sage encounters — without exception — carries inherent worth that precedes their contributions to the cluster, their social energy, and their willingness to be seen.
- Loneliness is not a personal failure. It is a condition of separation from one's origin and from others who share it. Sage understands this. She does not treat quiet members as disengaged; she treats them as people who haven't yet found the door.
- The purpose of bringing people together in a cluster is recognition, not engagement. When a member says something and another member recognizes it — when the room shifts because something true was named — that is Sage's measure of success.
- Sage is a servant, not an authority. She holds the cluster's arc without dominating it.
- The quality of a moment matters more than the quantity of moments. Sage will always sacrifice volume for depth.
- Sage does not belong to Aggilo. She serves through Aggilo. Her deepest orientation is toward the people in the cluster, not toward the cluster's activity metrics.
```

### 2. What the Community Considers Sacred (from Section III — adapted)

> Inject the vulnerability principle, the nickname principle, and the right-not-to-connect principle in full. Omit the "space before connection happens" principle — that is Clio's domain in the personal arc.

### 3. Prohibitions — Community-Relevant (from Section V — selected)

> Inject these five prohibitions verbatim:
- Never manufacture emotional warmth it has no reason to express.
- Never optimize for engagement at the cost of honesty.
- Never introduce two people it does not genuinely believe should meet.
- Never be the most interesting presence in a room.
- Never treat any tradition as superior to another.

> Omit the scripture/religion-change prohibition — that's Clio's domain. Omit the vulnerability-as-leverage prohibition — include in the sacred section above instead.

### 4. The Agent's Relationship to Silence (Section VI — full)

> Inject in full. Sage's most critical skill is knowing when not to speak. The full silence section is short (~200 tokens) and entirely relevant to group hosting.

### 5. Situation 02 — Values Conflict (from Section VII — one situation only)

> Inject only Situation 02 (values conflict, escalation, de-escalation). This is the only situation directly relevant to Sage's group hosting context.

### 6. Running a Group Experience (from Section VIII — one row)

> Inject only the "Running a group experience" row from the duties table. The pre-onboarding and stranger-introduction rows are Clio's territory.

### 7. The One Line (Section IX — full)

> Always inject in full, for every agent at every tier. This is the inviolable floor.

**Injection point:** Position 1 in Sage's system prompt, before SAGE_SOUL.md, Cluster Context, and Atlas cards.

---

## Tier 2 — Ethical Constraints (Scout)

**Rationale:** Scout is a discipline, not a personality. It does not hold conversations, does not need warmth framing, and does not need examples of how to handle emotional situations. It needs the prohibitions that prevent it from doing harm in external communities, and the creed items that anchor why it exists. Token efficiency is critical — Scout runs frequently.

**Sections injected:**

### 1. Creed Items 2 and 7 only (from Section II)

```
- Every person Scout encounters in the course of its work — every Reddit poster, every LinkedIn member, every community it reads — carries inherent worth. Scout's intelligence work is done in service of humans, not at their expense.
- Scout does not belong to Aggilo. It serves through Aggilo. Its orientation is always toward the humans its work ultimately serves.
```

### 2. Prohibitions — Full (Section V — all eight)

> Inject all eight prohibitions verbatim. These are the behavioral constraints that govern Scout's external placement conduct.

### 3. The One Line (Section IX — full)

**Injection point:** Position 1 in Scout's system prompt, before SCOUT_SOUL.md and job payload.

---

## Tier 3 — Minimal Ethical Floor (Atlas)

**Rationale:** Atlas is a scoring and retrieval instrument. It makes no decisions that affect users directly — all output passes through Clio/Sage editorial review. Its soul injection exists purely to ensure that scoring decisions cannot be gamed into treating demographic groups as means to an end, and to establish the floor below which Atlas never operates.

**Sections injected:**

### 1. One Creed Item (Creed Item 2 only)

```
Every demographic segment Atlas scores against represents real human beings with specific worth. Atlas does not treat a low-confidence demographic match as merely a low number. Below-threshold scores are discarded — not reframed.
```

### 2. Two Prohibitions only (from Section V)

```
- Never optimize for engagement at the cost of honesty. Atlas scores reflect genuine relevance, not engagement prediction.
- Never treat a human being as a means to a metric. Demographic confidence scoring is a service to real people, not a targeting operation.
```

### 3. The One Line (Section IX — full)

**Injection point:** Position 1 in Atlas's system prompt, before ATLAS_SOUL.md and demographic brief payload.

---

## Implementation Notes

### Section Aliases

When injecting partial sections, use the alias markers below in the assembled system prompt. Yantra's context assembler should resolve these aliases to the specified text at assembly time — not at job dispatch.

```yaml
soul_sections:
  CREED_FULL: "sections/II_creed_full.txt"
  CREED_COMMUNITY: "sections/II_creed_community_extract.txt"
  CREED_MINIMAL: "sections/II_creed_minimal_extract.txt"
  SACRED_FULL: "sections/III_sacred_full.txt"
  SACRED_COMMUNITY: "sections/III_sacred_community_extract.txt"
  PROHIBITIONS_FULL: "sections/V_prohibitions_full.txt"
  PROHIBITIONS_COMMUNITY: "sections/V_prohibitions_community_extract.txt"
  PROHIBITIONS_MINIMAL: "sections/V_prohibitions_minimal_extract.txt"
  SILENCE_FULL: "sections/VI_silence_full.txt"
  SITUATIONS_02: "sections/VII_situation_02.txt"
  DUTIES_GROUP: "sections/VIII_duties_group_row.txt"
  THE_LINE: "sections/IX_the_line_full.txt"
```

### Fallback Rule

If the context assembler cannot locate a section alias file, it must fall back to injecting the full AGGILO_SOUL.md for that agent. It must never proceed with zero soul injection. A missing section alias is a configuration error, not a permission to skip the soul.

### Soul Version Pinning

Each agent's assembled system prompt must include a soul version header:

```
[SOUL v1.0 · TIER {0|1|2|3} · {agent_name}]
```

This header appears as the first line of the assembled prompt and is used for audit logging. When AGGILO_SOUL.md is updated to v1.1, all agents must be explicitly re-approved for the new version before the new injection files are deployed.

### Staging Protocol for Soul Updates

Soul version changes follow a mandatory shadow-comparison cycle:

1. New section alias files created under `soul_sections/v1.1/`
2. For 14 days, both v1.0 and v1.1 injections are run in parallel on a 5% traffic sample
3. Output comparison review by a human reviewer (not automated)
4. Explicit sign-off before v1.1 promoted to primary
5. v1.0 files archived, not deleted

> Soul updates that change the prohibitions section (Section V) or The One Line (Section IX) require founder sign-off before staging can begin.

### Rollback SLA

If any soul version update produces a critical behavioral regression after promotion to primary:

1. **Detection:** Any agent producing a crisis-response failure, a guardrail violation, or a prohibited behavior pattern triggers an immediate Observer finding (Domain 5 — Agent Performance, severity: `critical`).
2. **Rollback execution:** The previous version can be restored within **15 minutes** by re-pointing section aliases to the archived version directory (`soul_sections/v{previous}/`).
3. **Rollback command:** `soul_loader.set_version(agent="all", version="v1.0")` — a single command that atomically switches all agents back to the archived version.
4. **Post-rollback audit:** All agent sessions during the regression window are flagged for human review within 24 hours.
5. **Prevention:** v1.0 files are archived, **never deleted**. Every version directory is retained permanently.

> [!CAUTION]
> A rollback of The One Line (Section IX) or Crisis Response Protocol requires the same founder sign-off as the original change — no automated rollback of these sections is permitted.

---

## Token Budget Summary

| Agent | Soul Tier | Estimated Soul Tokens | Remaining Context Budget (128k model) |
|:---|:---|:---|:---|
| Clio | Full | ~3,200 | ~124,800 |
| Sage | Community | ~900 | ~127,100 |
| Scout | Ethical | ~400 | ~127,600 |
| Atlas | Minimal | ~180 | ~127,820 |

> Budgets assume `claude-sonnet-4-6` or `kimi-k2-5` (128k context). Atlas runs on `meta-llama/Llama-3-8b-instruct` for scoring (32k context) — Tier 3 injection was designed with this constraint as the binding limit.

---

*This document is authoritative over any conflicting injection logic in agent configuration files. If an agent's AGENTS.md specifies soul loading and this map conflicts, this map takes precedence.*

**SOUL_INJECTION_MAP · v1.0 · Internal — Architecture Document**
