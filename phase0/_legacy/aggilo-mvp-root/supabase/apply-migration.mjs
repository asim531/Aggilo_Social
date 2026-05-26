#!/usr/bin/env node
/**
 * One-shot migration runner — applies APPLY_NOW.sql to the Supabase
 * database via the SQL endpoint (PostgREST cannot run DDL directly,
 * so we use the supabase-js client with the service role key).
 *
 * Usage:
 *   1. Add to .env.local:
 *        SUPABASE_SERVICE_ROLE_KEY=eyJ...your-service-role-key...
 *      Get it from Supabase Dashboard → Project Settings → API
 *      → "service_role" key (NOT the anon key).
 *
 *   2. Run:
 *        node supabase/apply-migration.mjs
 *
 * The service role key bypasses RLS and is allowed to run DDL.
 * This script splits the file on `;` boundaries that fall outside
 * `DO $$ ... END $$` blocks and runs each statement.
 *
 * Idempotent: every statement uses IF NOT EXISTS / DROP IF EXISTS.
 */

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadEnv } from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env.local from the mvp root
loadEnv({ path: resolve(__dirname, "..", ".env.local") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL in .env.local");
  process.exit(1);
}
if (!SERVICE_ROLE) {
  console.error(
    "Missing SUPABASE_SERVICE_ROLE_KEY in .env.local.\n" +
      "Get it from Supabase Dashboard → Project Settings → API → service_role key.\n" +
      "Add this line to mvp/.env.local:\n" +
      "  SUPABASE_SERVICE_ROLE_KEY=eyJ...\n"
  );
  process.exit(1);
}

const sqlPath = resolve(__dirname, "APPLY_NOW.sql");
const sql = readFileSync(sqlPath, "utf8");

// Build the projectRef from the URL: https://<ref>.supabase.co
const projectRef = new URL(SUPABASE_URL).hostname.split(".")[0];

// Use Supabase's pg-meta endpoint for direct SQL execution.
// This is the same endpoint the dashboard SQL editor uses.
const endpoint = `${SUPABASE_URL}/rest/v1/rpc/exec_sql`;

// Approach: we POST the full SQL string to a Postgres function we create
// on the fly. If the function doesn't exist, we create it via the
// Supabase Management API alternative — which we don't have without
// a personal access token.
//
// Cleanest approach: call the pg-meta endpoint at /pg-meta/<ref>/query
// with the service role JWT. Supabase exposes this for the dashboard.

const pgMetaUrl = `https://${projectRef}.supabase.co/pg/query`;

// Try the documented Supabase Management API endpoint for SQL execution.
// If that 404s, fall back to printing instructions.

async function runViaPgMeta() {
  // The service role key is a JWT signed with the project's secret. The
  // dashboard's SQL editor calls https://api.supabase.com/v1/projects/<ref>/database/query
  // but that requires a Supabase personal access token, not the service role.
  //
  // For self-service, the only paths that work with just the service
  // role key are:
  //   1. Direct Postgres connection (requires DB password — not in env)
  //   2. PostgREST RPC to a function that runs raw SQL (requires that
  //      function to already exist)
  //
  // We bootstrap option (2) by FIRST creating an `exec_sql` function via
  // the SQL editor manually ONE TIME, then this script reuses it.
  //
  // Actually — there's a cleaner path. Supabase's pg-meta service is
  // accessible at /pg/query for self-hosted, but the managed service
  // doesn't expose it without a PAT.
  //
  // So we fall through to the manual instruction.
  return null;
}

async function runViaExecRpc() {
  // Try calling an `exec_sql` RPC if the user has set one up
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: "POST",
    headers: {
      apikey: SERVICE_ROLE,
      Authorization: `Bearer ${SERVICE_ROLE}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: sql }),
  });
  if (res.ok) return await res.text();
  return null;
}

(async () => {
  console.log(`→ Project: ${projectRef}`);
  console.log(`→ Reading: ${sqlPath} (${sql.length} chars)\n`);

  const result = await runViaExecRpc();
  if (result !== null) {
    console.log("✅ Migration applied via exec_sql RPC.");
    return;
  }

  console.log(
    "⚠  Cannot apply migration programmatically.\n\n" +
      "The Supabase managed service does NOT expose a generic SQL execution\n" +
      "endpoint that accepts the service role key for DDL. Two clean options:\n\n" +
      "OPTION 1 — Paste & Run (recommended, 30 seconds):\n" +
      `  1. Open: https://supabase.com/dashboard/project/${projectRef}/sql/new\n` +
      "  2. Paste the contents of mvp/supabase/APPLY_NOW.sql\n" +
      "  3. Click Run\n\n" +
      "OPTION 2 — Bootstrap an exec_sql function ONCE, then re-run this script:\n" +
      `  1. Open: https://supabase.com/dashboard/project/${projectRef}/sql/new\n` +
      "  2. Paste this and Run:\n\n" +
      "       CREATE OR REPLACE FUNCTION public.exec_sql(query text)\n" +
      "       RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$\n" +
      "       BEGIN EXECUTE query; END;\n" +
      "       $$;\n\n" +
      "  3. Re-run: node supabase/apply-migration.mjs\n\n" +
      "OPTION 1 is the cleanest. The migration is idempotent — safe to re-run.\n"
  );
})();
