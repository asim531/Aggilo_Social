import { redirect } from "next/navigation";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

/**
 * Dev-only redirect: in development (no basePath) this route exists at
 * /c/research-circle-mj. Redirect to / so the cluster card at app/page.tsx
 * renders. In production with basePath set, Next.js strips the prefix and
 * this file is never matched — app/page.tsx serves the canonical URL.
 */
export default function ClusterCardRedirect() {
  if (!basePath) {
    redirect("/");
  }
  return null;
}
