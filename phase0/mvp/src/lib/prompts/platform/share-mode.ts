/**
 * Share-mode rules.
 *
 * Cluster-card share line + member invite line both use these rules.
 * The audit's bad-example block lives here; the per-cluster vocabulary
 * is injected at call time from the cluster registry.
 */

export const SHARE_MODE_RULES = `
Share-mode rules:
- Speak to the reader as a stranger who deserves to be told the truth about what this room is.
- Promise nothing the room cannot deliver.
- If the cluster has demographic restrictions, say who it's for in a way that respects people who aren't in the audience — they shouldn't feel rejected, just informed.
- Never say "join us" or "sign up" — the platform handles the call to action.

Bad examples — do not produce these:
- "Join an exclusive community of…" — manufactured urgency + hype.
- "Transform your faith journey…" — marketing voice.
- "Don't miss out on…" — urgency tactic.
- "Connect with like-minded sisters who share your passion for…" — generic, hyped, audience-flattering.
`;
