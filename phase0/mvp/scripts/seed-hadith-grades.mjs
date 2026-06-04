import { createClient } from "@supabase/supabase-js";
import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

/**
 * Since Sahih Bukhari and Sahih Muslim are universally considered Sahih, 
 * we can automatically generate grade rows for them.
 * For other collections, grades would need to be ingested from a separate grading dataset.
 */
async function seedGrades() {
  console.log("Seeding grades for Bukhari and Muslim...");

  // Fetch all hadith numbers we just inserted
  for (const collection of ["bukhari", "muslim"]) {
    let hasMore = true;
    let offset = 0;
    const limit = 1000;
    let totalGraded = 0;

    while (hasMore) {
      const { data, error } = await supabase
        .from("hadith_source")
        .select("hadith_number")
        .eq("collection_id", collection)
        .range(offset, offset + limit - 1);

      if (error) {
        console.error("Error fetching from hadith_source:", error);
        break;
      }

      if (!data || data.length === 0) {
        hasMore = false;
        break;
      }

      const grades = data.map((row) => ({
        collection_id: collection,
        hadith_number: row.hadith_number,
        grade: "sahih", // Auto-grade as sahih
        grader: "Auto (Collection Level)",
      }));

      const { error: insertError } = await supabase
        .from("hadith_grades")
        .upsert(grades, { onConflict: "collection_id, hadith_number" });

      if (insertError) {
        console.error(`Error inserting grades for ${collection}:`, insertError);
      } else {
        totalGraded += grades.length;
        console.log(`... graded ${totalGraded} ${collection} hadiths`);
      }

      offset += limit;
    }
  }

  console.log("✅ Finished seeding grades");
}

seedGrades().then(() => {
  process.exit(0);
});
