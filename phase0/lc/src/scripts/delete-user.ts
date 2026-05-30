import { createClient } from "@supabase/supabase-js";
import { resolve } from "path";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const dotenv = require("dotenv");

// Load .env.local from the root of the `lc` directory
dotenv.config({ path: resolve(process.cwd(), ".env.local") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const CLUSTER_ID = process.env.NEXT_PUBLIC_CLUSTER_ID ?? "long_conversation";

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function findUser() {
  // Step 1: Look up auth user by email
  const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
  if (authError) {
    console.error("Failed to list auth users:", authError);
    process.exit(1);
  }

  const targetEmail = "world.asim+test2@gmail.com".toLowerCase();
  const targetNickname = "Ace2";

  const matchingAuthUser = authUsers.users.find(
    (u: any) => u.email?.toLowerCase() === targetEmail
  );

  if (!matchingAuthUser) {
    console.log(`No auth user found with email: ${targetEmail}`);
    return null;
  }

  console.log("Found auth user:");
  console.log(`  ID:    ${matchingAuthUser.id}`);
  console.log(`  Email: ${matchingAuthUser.email}`);
  console.log(`  Created: ${matchingAuthUser.created_at}`);

  // Step 2: Look up LC profile by this auth user ID
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, cluster_id, nickname, role, is_founding_member, created_at")
    .eq("id", matchingAuthUser.id)
    .eq("cluster_id", CLUSTER_ID)
    .maybeSingle();

  if (profileError) {
    console.error("Failed to fetch LC profile:", profileError);
    return matchingAuthUser.id;
  }

  if (profile) {
    console.log("\nFound LC profile:");
    console.log(`  Nickname:    ${profile.nickname}`);
    console.log(`  Role:        ${profile.role}`);
    console.log(`  Cluster:     ${profile.cluster_id}`);
    console.log(`  Founding:    ${profile.is_founding_member}`);
    console.log(`  Created:     ${profile.created_at}`);

    if (profile.nickname !== targetNickname) {
      console.warn(`\nWARNING: Nickname mismatch! Expected '${targetNickname}' but found '${profile.nickname}'`);
    }
  } else {
    console.log("\nNo LC profile found for this user in cluster 'long_conversation'.");
    console.log("They may only exist in other clusters (e.g., Sisters in Dua).");
  }

  // Step 3: Count linked data that will CASCADE-delete
  const tables = [
    "posts",
    "welfare_notifications",
    "clio_ephemeral_sessions",
    "clio_handoff_greetings",
    "agent_feedback",
    "behavioural_events",
    "character_concerns",
    "cluster_feature_upvotes",
    "cluster_feature_comments",
    "agent_chatbox_views",
    "cluster_tool_invocations",
  ];

  console.log("\n--- Linked data across ALL clusters (will be CASCADE-deleted) ---");
  let totalRows = 0;
  for (const table of tables) {
    const { count, error } = await supabase
      .from(table)
      .select("*", { count: "exact", head: true })
      .eq("user_id", matchingAuthUser.id);

    if (error) {
      // Table might not have user_id column, try author_id
      const { count: count2, error: error2 } = await supabase
        .from(table)
        .select("*", { count: "exact", head: true })
        .eq("author_id", matchingAuthUser.id);

      if (!error2 && count2 !== null) {
        console.log(`  ${table}: ${count2} row(s)`);
        totalRows += count2;
      }
    } else if (count !== null) {
      console.log(`  ${table}: ${count} row(s)`);
      totalRows += count;
    }
  }
  console.log(`\nTotal linked rows to be deleted: ${totalRows}`);

  return matchingAuthUser.id;
}

async function deleteUser(userId: string) {
  console.log(`\n>>> Deleting auth user ${userId}...`);
  const { error } = await supabase.auth.admin.deleteUser(userId);
  if (error) {
    console.error("Failed to delete auth user:", error);
    process.exit(1);
  }
  console.log("✅ Auth user deleted. All linked data cascaded.");
}

async function run() {
  const shouldDelete = process.argv.includes("--confirm");
  const dryRun = !shouldDelete;

  console.log("=== AGGILO User Deletion Tool ===");
  console.log(`Cluster: ${CLUSTER_ID}`);
  console.log(`Mode:    ${dryRun ? "DRY RUN (lookup only)" : "LIVE DELETION"}`);
  console.log("\nLooking up user: world.asim+test2@gmail.com (Ace2)\n");

  const userId = await findUser();

  if (!userId) {
    console.log("\nUser not found. Nothing to delete.");
    process.exit(0);
  }

  if (dryRun) {
    console.log("\n---");
    console.log("This was a DRY RUN. No data was changed.");
    console.log("\nTo actually DELETE this user and all linked data, run:");
    console.log(`  npx ts-node src/scripts/delete-user.ts --confirm`);
    console.log("\nOr tell me to run it for you.");
  } else {
    console.log("\n--- LIVE DELETION ---");
    await deleteUser(userId);
    console.log("\nCleanup complete.");
  }
}

run();
