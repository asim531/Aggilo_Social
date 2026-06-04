import { createClient } from "@supabase/supabase-js";
import fs from "fs";
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

const COLLECTIONS = ["bukhari", "muslim"];
const BASE_URL = "https://raw.githubusercontent.com/AhmedBaset/hadith-json/main/db/by_book/the_9_books/";

async function fetchAndSeed() {
  for (const collection of COLLECTIONS) {
    console.log(`Fetching ${collection}.json from GitHub...`);
    
    try {
      const response = await fetch(`${BASE_URL}${collection}.json`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      const hadiths = data.hadiths || data; // Handle potential wrapper object

      console.log(`Fetched ${hadiths.length} hadiths for ${collection}. Seeding to Supabase...`);

      // Batch insert in chunks of 500
      const BATCH_SIZE = 500;
      let inserted = 0;

      for (let i = 0; i < hadiths.length; i += BATCH_SIZE) {
        const batch = hadiths.slice(i, i + BATCH_SIZE).map((h) => ({
          source_id: h.id,
          collection_id: collection,
          book_number: h.bookId || h.bookNumber || null,
          hadith_number: h.hadithNumber || h.id, // Fallback to id if hadithNumber missing
          arabic_text: h.arabic,
          english_narrator: h.english?.narrator || null,
          english_text: h.english?.text || "",
        }));

        const { error } = await supabase
          .from("hadith_source")
          .upsert(batch, { onConflict: "collection_id, hadith_number" });

        if (error) {
          console.error(`Error inserting batch ${i} for ${collection}:`, error);
        } else {
          inserted += batch.length;
          console.log(`... inserted ${inserted} / ${hadiths.length}`);
        }
      }

      console.log(`✅ Completed ${collection}`);
    } catch (err) {
      console.error(`Failed to process ${collection}:`, err);
    }
  }
}

fetchAndSeed().then(() => {
  console.log("Done.");
  process.exit(0);
});
