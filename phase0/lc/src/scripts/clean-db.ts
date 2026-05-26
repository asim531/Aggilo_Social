import { createClient } from "@supabase/supabase-js";
import { resolve } from "path";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const dotenv = require("dotenv");

// Load .env.local from the root of the `lc` directory
dotenv.config({ path: resolve(process.cwd(), ".env.local") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const CLUSTER_ID = "long_conversation";

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function run() {
  console.log(`Starting database cleanup for cluster: ${CLUSTER_ID}...`);

  // 1. Delete all posts in the cluster
  const { error: postError } = await supabase
    .from("posts")
    .delete()
    .eq("cluster_id", CLUSTER_ID);
  
  if (postError) {
    console.error("Error deleting posts:", postError);
  } else {
    console.log("✅ Cleared posts");
  }

  // 2. Delete all tip logs in the cluster
  const { error: tipError } = await supabase
    .from("clio_tip_log")
    .delete()
    .eq("cluster_id", CLUSTER_ID);

  if (tipError) {
    console.error("Error deleting tips:", tipError);
  } else {
    console.log("✅ Cleared tip logs");
  }

  // 3. Fetch profiles to get auth User IDs before deleting profiles
  const { data: profiles, error: fetchProfilesError } = await supabase
    .from("profiles")
    .select("id")
    .eq("cluster_id", CLUSTER_ID);

  if (fetchProfilesError) {
    console.error("Error fetching profiles:", fetchProfilesError);
  } else if (profiles && profiles.length > 0) {
    console.log(`Found ${profiles.length} profiles to delete...`);

    // Delete profiles
    const { error: profileError } = await supabase
      .from("profiles")
      .delete()
      .eq("cluster_id", CLUSTER_ID);
    
    if (profileError) {
      console.error("Error deleting profiles:", profileError);
    } else {
      console.log("✅ Cleared profiles");
    }

    // Delete underlying Auth users
    let deletedAuthCount = 0;
    for (const profile of profiles) {
      const { error: authError } = await supabase.auth.admin.deleteUser(profile.id);
      if (authError) {
        console.error(`Failed to delete Auth User ${profile.id}:`, authError);
      } else {
        deletedAuthCount++;
      }
    }
    console.log(`✅ Deleted ${deletedAuthCount} underlying Auth user accounts`);

  } else {
    console.log("No profiles found to clear.");
  }

  // Note: link_previews are shared globally across clusters (keyed by URL), 
  // so we typically don't wipe them on a per-cluster basis. 

  console.log("\nCleanup complete! The cluster is now a blank slate.");
}

run();
