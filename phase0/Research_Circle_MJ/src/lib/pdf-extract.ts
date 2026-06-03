/**
 * PDF text extraction utility.
 *
 * Uses pdf2json (pure Node.js stream parser) to extract text from
 * PDFs fetched from Supabase Storage. Falls back to raw-string
 * extraction for PDFs that pdf2json can't parse. Gracefully
 * returns empty string on total failure.
 */

import { createAdminClient } from "./supabase-admin";

function extractWithPdf2Json(buffer: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    const PDFParser = require("pdf2json");
    const pdfParser = new PDFParser();
    let text = "";

    pdfParser.on("pdfParser_dataError", (errData: any) => {
      reject(new Error(errData?.parserError || "pdf2json parse error"));
    });

    pdfParser.on("pdfParser_dataReady", (pdfData: any) => {
      const pages = pdfData?.Pages ?? [];
      for (const page of pages) {
        const texts = page?.Texts ?? [];
        for (const t of texts) {
          const str = t?.R?.[0]?.T;
          if (str) {
            text += decodeURIComponent(str) + " ";
          }
        }
        text += "\n";
      }
      resolve(text);
    });

    pdfParser.parseBuffer(buffer);
  });
}

/**
 * Fallback extractor: pulls human-readable strings from the raw
 * PDF buffer. PDF text streams use `(text) Tj` or `(text') Tj`
 * operators — we regex-match parenthesised literals.
 */
function extractTextFromRawPdf(buffer: Buffer): string {
  const raw = buffer.toString("latin1");
  // Match text in parentheses that are part of Tj/TJ operators
  const matches = raw.match(/\(([^)]+)\)\s*T[jJ]/g);
  if (!matches) return "";
  const text = matches
    .map((m) => {
      // Extract content between ( and )
      const inner = m.match(/\(([^)]+)\)/);
      return inner?.[1] ?? "";
    })
    .filter((s) => s.length > 2 && /[a-zA-Z]{2,}/.test(s))
    .join(" ");
  return text;
}

export async function extractTextFromPdf(storagePath: string): Promise<string> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin.storage
      .from("cluster-attachments")
      .download(storagePath.replace(/^cluster-attachments\//, ""));

    if (error || !data) {
      console.warn("[pdf-extract] download failed:", error?.message);
      return "";
    }

    const buffer = Buffer.from(await data.arrayBuffer());

    // Primary: pdf2json
    let text = await extractWithPdf2Json(buffer).catch(() => "");
    if (text.length > 50) {
      console.log("[pdf-extract] pdf2json extracted", text.length, "chars");
      return text;
    }

    // Fallback: raw-string extraction
    text = extractTextFromRawPdf(buffer);
    if (text.length > 50) {
      console.log("[pdf-extract] raw fallback extracted", text.length, "chars");
      return text;
    }

    console.warn("[pdf-extract] both extractors failed — returning empty");
    return "";
  } catch (err) {
    console.warn("[pdf-extract] error:", err instanceof Error ? err.message : String(err));
    return "";
  }
}
