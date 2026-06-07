import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { CLUSTER_ID } from "@/lib/cluster";
import { runAnalysis } from "@/lib/analysis-worker";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB
const ALLOWED_TYPES = [
  // Documents
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  // Images
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  // Videos
  "video/mp4",
  "video/webm",
  "video/quicktime",
];

/**
 * POST /api/upload
 *
 * Upload a file to Supabase Storage and record it in post_attachments.
 * Multipart form data:
 *   - file: the binary file
 *   - post_id: optional — if provided, links the attachment immediately
 *
 * Returns: { attachment: PostAttachment, publicUrl: string }
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    // Verify cluster membership
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .eq("cluster_id", CLUSTER_ID)
      .maybeSingle();
    if (!profile) {
      return NextResponse.json({ error: "not_in_cluster" }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const postId = formData.get("post_id") as string | null;
    const notes = formData.get("notes") as string | null;

    if (!file) {
      return NextResponse.json({ error: "file_required" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "file_too_large" }, { status: 413 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "unsupported_type" }, { status: 415 });
    }

    const admin = createAdminClient();

    // Enforce unique file_name per cluster
    const { data: existing } = await admin
      .from("post_attachments")
      .select("id")
      .eq("cluster_id", CLUSTER_ID)
      .eq("file_name", file.name)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: "duplicate_name", message: `A document named "${file.name}" already exists. Please rename and retry.` },
        { status: 409 }
      );
    }

    // If post_id is provided, verify ownership
    if (postId) {
      const { data: post } = await supabase
        .from("posts")
        .select("author_id")
        .eq("id", postId)
        .eq("cluster_id", CLUSTER_ID)
        .maybeSingle();
      if (!post) {
        return NextResponse.json({ error: "post_not_found" }, { status: 404 });
      }
      if (post.author_id !== user.id) {
        return NextResponse.json({ error: "forbidden" }, { status: 403 });
      }
    }

    const bucketName = "cluster-attachments";
    const ext = file.name.split(".").pop() ?? "";
    const safeName = file.name
      .replace(/[^a-zA-Z0-9._-]/g, "_")
      .substring(0, 100);
    const storagePath = `${CLUSTER_ID}/${user.id}/${Date.now()}_${safeName}`;

    // Ensure bucket exists
    const { data: buckets } = await admin.storage.listBuckets();
    const bucketExists = buckets?.some((b) => b.name === bucketName);
    if (!bucketExists) {
      await admin.storage.createBucket(bucketName, {
        public: true,
        fileSizeLimit: MAX_FILE_SIZE,
      });
    }

    // Upload
    const { error: uploadErr } = await admin.storage
      .from(bucketName)
      .upload(storagePath, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadErr) {
      console.warn("[upload] storage upload failed:", uploadErr.message);
      return NextResponse.json({ error: "upload_failed" }, { status: 500 });
    }

    const { data: publicUrlData } = admin.storage
      .from(bucketName)
      .getPublicUrl(storagePath);
    const publicUrl = publicUrlData.publicUrl;

    // Record in post_attachments (even if no post_id yet — orphan until linked)
    const { data: attachment, error: dbErr } = await admin
      .from("post_attachments")
      .insert({
        post_id: postId,
        cluster_id: CLUSTER_ID,
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
        storage_path: `${bucketName}/${storagePath}`,
        created_by: user.id,
        notes: notes || null,
      })
      .select("*")
      .single();

    if (dbErr) {
      console.warn("[upload] attachment record failed:", dbErr.message);
      // Don't delete the storage object — admin can reconcile later
      return NextResponse.json({ error: "db_error" }, { status: 500 });
    }

    // Trigger background analysis (CIM classification + white paper tools)
    // Direct call — no HTTP hop, eliminates Vercel server-to-server failure mode.
    if (attachment) {
      void runAnalysis(attachment.id).catch((err) => {
        console.error("[upload] direct analysis failed:", err);
      });
    }

    return NextResponse.json({
      attachment,
      publicUrl,
    });
  } catch (err) {
    console.warn(
      "[upload] error:",
      err instanceof Error ? err.message : String(err)
    );
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
