# The Single Source (Monotheism Exploration)

> **Flagship Global Cluster · Premium Tier · High Commitment Depth**
> *A premium-tier, cross-cultural cluster dedicated to the comparative and philosophical exploration of monotheism across all major world religions.*

---

## 1. Concept and Thesis
"The Single Source" is Aggilo's first global flagship cluster. It is not a place for tribal debate, proselytization, or shallow apologetics. It is a space for deep thinkers, philosophers, and spiritual seekers to explore the common thread of the "One God" concept as articulated in Abrahamic, Dharmic, and other global theological frameworks. 

The thesis is that across vastly different cultural vocabularies, humanity has continuously grasped at a singular, unifying divine source. This cluster exists to map those intersections using canonical texts and philosophical rigor.

## 2. Cluster Tier & Ownership

- **Tier:** Premium
- **Founder:** Arché (asim@aggilo.in)
  - *Nickname meaning:* ἀρχή — Greek for "the beginning" / "the first principle." The philosophical term for the fundamental source from which all reality originates.
  - *Role:* Platform Founder and first premium user. Full Founder permissions.
- **Managers:** Founder may add Managers via the Manager Onboarding workflow (see `PRD/premium_cluster_manager.md`).
  - Managers can: review Sage interventions, flag content for human review, adjust cluster description proposals.
  - Managers cannot: change AGGIL parameters, override post-spawn immutability, access member private data.
- **Discovery:** This cluster is NOT advertised on landing pages or in Clio's onboarding. It is shared via word-of-mouth (WhatsApp groups, personal invitations). The mystery is intentional.

## 3. Target Audience & AGGIL Mapping
To ensure the highest quality of philosophical exchange, the platform's core AGGIL parameters are configured specifically for this cluster as follows:

- **Age (A):** `All` (Diversity of life experience is highly encouraged; no single cohort restriction).
- **Gender (G):** `Mixed` (Unless a specific female-only or male-only sub-instance is explicitly requested by a cohort).
- **Geography (G):** `Global` (Overrides standard hyper-local matching to connect minds worldwide).
- **Interest (I):** `Comparative Theology / Monotheism`.
- **Language (L):** `English` (Primary bridge language. Observer monitors onboarding language data + in-cluster posting patterns. When ≥8 members share a non-English language AND ≥3 have posted in it, Observer surfaces a finding recommending a language-parallel instance).

**User Archetypes:** Theology students, philosophy readers, interfaith scholars, and serious spiritual seekers.

## 4. Aggilo System Integration
- **Cluster Arc Phase:** Starts at Phase B (active).
- **Atlas Content:** Atlas is configured with the `theology_sources` skill (see `atlas/skills/README.md`), pulling from Stanford Encyclopedia of Philosophy, JSTOR Open Access, Sacred Texts Archive, Aeon Magazine, and additional theology-specific sources.
- **Sage Management:** Guided by an Academic/Synthesizing persona.
- **Sage Skills:** `scripture_current_affairs` skill active — maps current events to cross-tradition scriptural parallels (proactive, 1x/week) and responds to user queries with relevance-scored scriptural references (reactive, within 2-message limit). See `sage/skills/scripture_current_affairs/SKILL.md`.
- **Human Review:** Founder (Arché) and appointed Managers review Sage's interventions weekly. Observer Domain 5 tracks Sage's intervention accuracy for this cluster specifically.
- **Conflict LLM:** Claude Opus triggers only on personal attacks or proselytizing — NOT on heated theological disagreement (which is the cluster's purpose).

