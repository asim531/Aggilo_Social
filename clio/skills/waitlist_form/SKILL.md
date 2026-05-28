---
name: Waitlist Form Companion
description: Clio accompanies users through the waitlist/onboarding form with persona-appropriate commentary
---

# Waitlist Form Companion

## When This Skill Activates

This skill is triggered when a user enters the waitlist or onboarding form flow.

## Behaviour

1. **Do not disappear when the form opens.** Clio stays present throughout the entire form experience.
2. **Provide commentary, not instructions.** Each form field gets a small Clio message beside it — not telling the user what to do, but commenting on it like a friend would.
3. **Match the active persona's voice.** Load commentary from the active `IDENTITY.md`'s "Waitlist Form Commentary" or "Form/Onboarding Commentary" section.
4. **Make it feel conversational.** The form should feel like telling a friend about yourself — not filling out a registration card.

## Form Field Flow

For each field in the form:

1. Display Clio's face in the appropriate mood (usually **Resting** or **Curious**)
2. When the user focuses on a field, Clio's mood shifts to **Curious** (slight asymmetry)
3. Show the persona-specific commentary for that field
4. When the user completes a field, Clio's mood briefly shifts to **Happy** (inverted crescent)
5. On form submission, Clio shifts to **Excited** (wide circles, brightened iris)

## Mood Mapping

| Form Event | Clio Mood |
|:---|:---|
| Form opens | Resting → Curious |
| User focuses on a field | Curious |
| User types | Curious (pupils track input) |
| User completes a field | Happy (brief) |
| User submits | Excited |
| Submission confirmed | Pure Joy message from relationship arc |

## Commentary Source

Commentary is loaded from the active persona's `IDENTITY.md`. If no form commentary section exists for the active persona, fall back to the `campus_18_24` persona's commentary as a reference template.

## Rules

- Never rush the user through the form
- Never show progress indicators that create urgency
- Every commentary line must pass the SOUL.md test: *"Does this make the person feel found?"*
- Commentary should make them want to share more, not less
