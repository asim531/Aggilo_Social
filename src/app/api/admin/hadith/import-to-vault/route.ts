import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

/**
 * POST /api/admin/hadith/import-to-vault
 * 
 * Takes a collection_id and hadith_number, fetches the raw data from `hadith_source`,
 * joins it with the grade from `hadith_grades`, and creates a verified entry in `dua_vault`.
 * 
 * Only callable by users with role = 'founder' or 'manager'.
 */
export async function POST(request: Request) {
  try {
    const { collection_id, hadith_number, thematic_tags = [] } = await request.json();

    if (!collection_id || !hadith_number) {
      return NextResponse.json({ error: "Missing collection_id or hadith_number" }, { status: 400 });
    }

    const supabase = await createClient();

    // 1. Authorize: must be founder or manager
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || !["founder", "manager"].includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden: Admin only" }, { status: 403 });
    }

    // 2. Fetch the raw hadith
    const { data: sourceData, error: sourceError } = await supabase
      .from("hadith_source")
      .select("*")
      .eq("collection_id", collection_id)
      .eq("hadith_number", hadith_number)
      .single();

    if (sourceError || !sourceData) {
      return NextResponse.json({ error: "Hadith not found in source dataset" }, { status: 404 });
    }

    // 3. Fetch the grade
    const { data: gradeData, error: gradeError } = await supabase
      .from("hadith_grades")
      .select("grade")
      .eq("collection_id", collection_id)
      .eq("hadith_number", hadith_number)
      .single();

    if (gradeError || !gradeData) {
      return NextResponse.json({ error: "Grade missing. Cannot promote ungraded hadith to vault." }, { status: 400 });
    }

    // Must be sahih, hasan, or hasan_sahih
    if (!["sahih", "hasan", "hasan_sahih"].includes(gradeData.grade.toLowerCase())) {
      return NextResponse.json({ error: `Grade is ${gradeData.grade}. Only sahih/hasan allowed in vault.` }, { status: 400 });
    }

    // 4. Construct the dua_vault entry
    const collectionName = collection_id === "bukhari" ? "Sahih al-Bukhari" : 
                           collection_id === "muslim" ? "Sahih Muslim" : 
                           collection_id.charAt(0).toUpperCase() + collection_id.slice(1);

    const vaultEntry = {
      arabic_text: sourceData.arabic_text,
      // We don't have tajweed for hadith
      arabic_with_tajweed: null,
      // We don't have transliteration in the dataset, but we must provide something or it fails NOT NULL
      transliteration: "Transliteration not provided for hadith.",
      translation: `${sourceData.english_narrator ? sourceData.english_narrator + ': ' : ''}${sourceData.english_text}`,
      source_type: "hadith",
      source_collection: collectionName,
      source_book_number: sourceData.book_number,
      source_hadith_number: sourceData.hadith_number,
      hadith_grade: gradeData.grade.toLowerCase(),
      thematic_tags,
      is_quranic: false,
      length_classification: sourceData.english_text.length > 500 ? "long" : sourceData.english_text.length > 150 ? "medium" : "short",
      verified_by_founder: true, // Automatically verified since Admin is running this
      title: `Hadith from ${collectionName} #${sourceData.hadith_number}`,
    };

    // 5. Insert into dua_vault
    const { data: inserted, error: insertError } = await supabase
      .from("dua_vault")
      .insert(vaultEntry)
      .select()
      .single();

    if (insertError) {
      console.error("Vault insert error:", insertError);
      return NextResponse.json({ error: "Failed to insert into dua_vault" }, { status: 500 });
    }

    return NextResponse.json({ success: true, vault_entry: inserted });
  } catch (error) {
    console.error("import-to-vault error:", error);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
