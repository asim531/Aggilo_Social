/**
 * Landing page — redirects to the merged cluster card + auth page.
 *
 * The canonical entry point is /c/research-circle-mj which shows
 * the cluster card with real-time stats and the auth form inline.
 */

import { redirect } from "next/navigation";

export default function LandingPage() {
  redirect("/c/research-circle-mj");
}