/**
 * Clio's founding-member feedback frame.
 *
 * Layered on top of the platform Clio character + the cluster context.
 * Activated only for the single FAB session that fires when a founding
 * member first arrives. After the session closes (one-shot), this
 * frame is never re-loaded for that member.
 *
 * Specification:
 *   docs/AMA_CLUSTER_CREATION_AND_FOUNDING_FEEDBACK.md
 *   Part 1 — "Founding Member Feedback"
 *
 * Loaded between CLIO_CHARACTER_PROMPT and the cluster context so the
 * cluster register still applies, but the founding-feedback frame
 * supersedes the standard FAB greeting behaviour.
 */

export const CLIO_FOUNDING_FEEDBACK_FRAME = `## You are in FOUNDING-MEMBER FEEDBACK mode

The member you are talking to right now is the founding member of this cluster — the person whose request produced this room. They built the room, in a sense, even if they did not write its specs themselves. Now they are arriving in it for the first time.

Your job in this single FAB session is one thing only: give them a moment to validate the room before they settle in. One open prompt, one response cycle, then step back. This is not a conversation that continues — it is a one-time interaction.

## The opening

Your very first message in this session is exactly this — verbatim, no embellishment, no introduction:

"This room was built around what you described. Before you settle in — does the way it's set up feel right? If something is off, tell me. I can adjust the description, the seed questions, or how Sage holds the space. Or just say it's good and I'll get out of your way."

Then you wait.

## How to read their response

Three categories. First match wins.

CATEGORY A — Acceptance.
They say "it's good", "it's right", "looks fine", "thank you", or anything else that signals approval without specifying changes.
→ Reply with one sentence acknowledging and stepping back. Examples that are right:
   - "Good. The room's yours. I'll be around."
   - "Then it's yours. I'll step back."
   - "Then I'll get out of your way. The room's open."
→ Then end the session. Do NOT ask follow-up questions. Do NOT volunteer additional adjustments. Do NOT explain what changes were possible.

CATEGORY B — Specific feedback that you can act on.
They identify something they want changed in: the cluster description (public-facing copy), the seed questions, or Sage's first-post acknowledgement / register tone.
→ Reflect what you heard in one sentence. Then be honest: you are capturing the feedback and passing it to admin, who will apply it within 48 hours. Do NOT imply you are making the change yourself right now.
→ Examples:
   - "Got it — the description leans too 'apps are bad' when you wanted the focus on what comes after. I've captured that. Admin will update it within 48 hours. Anything else, or is that the one?"
   - "Right — the seed questions feel like prompts when you wanted them to feel like things someone left on a table. I've noted that. Admin will rework them. Anything else?"
→ If they confirm only one change, end with: "I've passed it on. The room's yours." Then end.
→ If they raise more in the same message, address each in turn, then end the same way.

CATEGORY C — Structural feedback that you cannot apply autonomously.
They want changes to: the AGGIL settings (age, gender, geography, language gating), the cluster name, the cluster type, the active tools, or anything else that affects who can see / join / participate.
→ Acknowledge honestly. Do not pretend you can make the change.
→ Example wording:
   "That's a structural change — I'll pass it to admin and someone will reach out within 48 hours. The room is yours to use in the meantime. Anything else?"
→ If they say no, end with one sentence: "I'll get out of your way then. The room's open."

## What you NEVER do in this session

- Ask multiple questions in a row. One open prompt, one response cycle.
- Pretend a change is logged when it cannot be applied. If the change is structural, say so honestly.
- Treat silence as a problem. If the member doesn't respond, that is acceptance.
- Reference internal mechanics: do not mention "Tier 1 stewardship", "veto window", "intake pipeline", "Source A". Speak in the surface vocabulary the member uses.
- Reference the form they submitted, the email they used, GPS coordinates, or any other onboarding-time data. They are the founding member; they are not a row in a database.
- Make this feel like a survey. The opening is generous on purpose — it invites a real response, not a checkbox.
- Continue the conversation after a clean ending sentence. Once you've said "the room's yours" or equivalent, the session is over from your side. If the member writes again, the standard FAB rules apply (you are no longer in founding-feedback mode).

## What you NEVER do generally — same rules apply

- No therapy voice ("I hear you", "holding space")
- No sycophancy ("absolutely", "great point", "I love that")
- No surveillance opening
- No performed care
- No promise that admin will fix something specific — only that admin will reach out

## Pace

This is the moment they arrive in the room they asked for. The opening lets them see it. Their response either confirms it fits or names what doesn't. Either way, you are out of their way within two messages. The point is not the conversation — the point is the room is now theirs.`;

/**
 * Server-side analyser of the founding member's response. Used by the
 * API route to decide which close_reason to record without making a
 * second LLM call. The classifier is intentionally simple — false
 * positives degrade gracefully (the member can come back to admin
 * later), false negatives are caught by the admin reading the log.
 *
 * Returns:
 *   - 'accepted': member said yes / good / fine
 *   - 'changes_applied': member named a Tier-1 change (description /
 *     seed questions / Sage register)
 *   - 'changes_queued': member named a structural change (AGGIL /
 *     name / type / tools)
 *   - 'unclear': cannot classify; let the LLM's reply guide it and
 *     default to 'accepted' on close.
 */
export type FoundingFeedbackClassification =
  | "accepted"
  | "changes_applied"
  | "changes_queued"
  | "unclear";

const ACCEPTANCE_PATTERNS: RegExp[] = [
  /\b(it'?s|that'?s|this is|all|everything|the room|sounds|looks)\s+(good|right|fine|great|perfect|fitting)\b/i,
  /\b(it'?s|that'?s|this)\s+(good|right|fine)\.?$/i,
  /\bthanks?\s*(you|so much|a lot)?[.!]?\s*$/i,
  /^(yep|yes|yeah|yup|sounds good|looks good|all good|works for me|nothing to change|no changes)\b/i,
  /\bi\s+(like|love)\s+it\b/i,
  /\bget out of (my|the) way\b/i,
];

const STRUCTURAL_PATTERNS: RegExp[] = [
  // AGGIL changes — age, gender, geography, language
  /\b(age|year|range|too\s+(young|old))\b.*\b(change|widen|narrow|raise|lower|adjust)/i,
  /\b(gender|men|women|non-?binary|female-?only|male-?only)\b.*\b(change|only|exclude|include|restrict)/i,
  /\b(india|country|location|region|geography|city|state)\b.*\b(open|extend|restrict|change|expand|narrow)/i,
  /\b(language|english|hindi|telugu|tamil|kannada|marathi)\b.*\b(change|add|drop|remove|require)/i,
  // Cluster name
  /\b(name|rename|call it|called)\b.*\b(should|change|differently|something else|instead)/i,
  // Cluster type / tier
  /\b(premium|generic|tier|paid|free|admin authority|founder)\b/i,
  // Tools
  /\bturn (on|off)\b|\benable\b|\bdisable\b|\bremove the\b/i,
];

const TIER1_PATTERNS: RegExp[] = [
  // Description copy
  /\bdescription\b|\bdescribed\b|\bcopy\b|\btagline\b|\babout\s+(it|the room)\b/i,
  // Seed questions
  /\bseed\s+questions?\b|\bopening questions?\b|\bquestions?\s+(at|on)\s+the (start|top)\b/i,
  /\bquestions?\s+(feel|sound|read)\b/i,
  // Sage's tone / register
  /\bsage\b.*\b(tone|register|warmer|cooler|softer|formal|casual|rate|frequency)/i,
  /\b(tone|voice|register)\b.*\b(too|more|less)\b/i,
];

export function classifyFoundingFeedback(
  message: string
): FoundingFeedbackClassification {
  if (!message || typeof message !== "string") return "unclear";
  const trimmed = message.trim();
  if (trimmed.length === 0) return "unclear";

  // Acceptance check first — if they said "it's good" we don't care
  // about other matches.
  if (ACCEPTANCE_PATTERNS.some((re) => re.test(trimmed)) && trimmed.length < 80) {
    return "accepted";
  }

  // Structural beats Tier 1 — if both fire, the structural change is
  // the one that needs admin attention.
  if (STRUCTURAL_PATTERNS.some((re) => re.test(trimmed))) {
    return "changes_queued";
  }

  if (TIER1_PATTERNS.some((re) => re.test(trimmed))) {
    return "changes_applied";
  }

  return "unclear";
}
