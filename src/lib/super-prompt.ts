/**
 * @deprecated since V3.12 — moved to `lib/prompts/platform/super-prompt.ts`.
 *
 * This file is a re-export shim so existing import sites keep working.
 * New code should import from `@/lib/prompts/platform/super-prompt`
 * directly. The shim will be removed once every route is migrated.
 */

export {
  AGGILO_SUPER_PROMPT_LITERAL,
  buildSystemMessages,
} from "./prompts/platform/super-prompt";
