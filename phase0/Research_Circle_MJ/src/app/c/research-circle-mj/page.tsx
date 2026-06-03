import type { Metadata } from "next";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase-admin";
import { CLUSTER, CLUSTER_ID } from "@/lib/cluster";
import CardThemeToggle from "@/components/CardThemeToggle";
import AuthForm from "@/components/AuthForm";

export const revalidate = 3600;

const siteUrl = "https://mvp.aggilo.in/c/research-circle-mj";
const ogImage = "https://mvp.aggilo.in/api/og/research-circle";

export const metadata: Metadata = {
  title: `${CLUSTER.displayName} — ${CLUSTER.tagline} · Aggilo`,
  description: CLUSTER.shortDescription,
  alternates: { canonical: siteUrl },
  openGraph: {
    title: CLUSTER.displayName,
    description: CLUSTER.tagline,
    url: siteUrl,
    siteName: "Aggilo",
    type: "website",
    images: [{ url: ogImage, width: 1200, height: 630, alt: CLUSTER.displayName }],
  },
  twitter: {
    card: "summary_large_image",
    title: CLUSTER.displayName,
    description: CLUSTER.tagline,
    images: [ogImage],
  },
  robots: { index: true, follow: true },
};

interface ActivityData {
  memberCount: number;
  paperCount: number;
  threadCount: number;
  analyzedCount: number;
  recentTopics: { name: string; postCount: number }[];
  recentPapers: { title: string }[];
}

async function loadActivity(): Promise<ActivityData> {
  // Use admin client so public cluster card can read aggregate stats
  // without an authenticated session (RLS would block otherwise).
  const supabase = createAdminClient();

  // Member count
  const { count: memberCount } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("cluster_id", CLUSTER_ID);

  // Papers uploaded (all attachments)
  const { count: paperCount } = await supabase
    .from("post_attachments")
    .select("id", { count: "exact", head: true });

  // Discussion threads (top-level posts)
  const { count: threadCount } = await supabase
    .from("posts")
    .select("id", { count: "exact", head: true })
    .is("parent_id", null);

  // Documents analyzed (have extracted text)
  const { count: analyzedCount } = await supabase
    .from("post_attachments")
    .select("id", { count: "exact", head: true })
    .not("extracted_text", "is", null);

  // Recent topics
  const { data: topicRows } = await supabase
    .from("topics")
    .select("name, post_count")
    .eq("cluster_id", CLUSTER_ID)
    .order("post_count", { ascending: false })
    .limit(10);

  const recentTopics = (topicRows ?? [])
    .filter((t: { post_count: number }) => t.post_count > 0)
    .map((t: { name: string; post_count: number }) => ({ name: t.name, postCount: t.post_count }))
    .slice(0, 8);

  // Recent papers (with doc_title, anonymised)
  const { data: paperRows } = await supabase
    .from("post_attachments")
    .select("doc_title, file_name")
    .not("doc_title", "is", null)
    .order("created_at", { ascending: false })
    .limit(6);

  const recentPapers = (paperRows ?? [])
    .map((p: { doc_title: string | null; file_name: string | null }) => ({ title: p.doc_title || p.file_name }))
    .filter((p: { title: string | null }) => p.title != null)
    .map((p: { title: string | null }) => ({ title: p.title as string }));

  return {
    memberCount: memberCount ?? 0,
    paperCount: paperCount ?? 0,
    threadCount: threadCount ?? 0,
    analyzedCount: analyzedCount ?? 0,
    recentTopics,
    recentPapers,
  };
}

function memberBracket(n: number): string {
  if (n < 10) return "0–9 members";
  if (n < 50) return "10–49 members";
  if (n < 250) return "50–249 members";
  return "250+ members";
}

export default async function ClusterCardPage() {
  const activity = await loadActivity();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: CLUSTER.displayName,
    description: CLUSTER.shortDescription,
    url: siteUrl,
    parentOrganization: { "@type": "Organization", name: "Aggilo", url: "https://aggilo.in" },
  };

  return (
    <main className="relative min-h-screen bg-husl-surface dark:bg-[#0b0d0f] text-husl-ink dark:text-white transition-colors">
      {/* Theme detection — prevent flash of wrong theme */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            (function() {
              try {
                var theme = localStorage.getItem('rcmj-theme') || 'system';
                var resolved = theme === 'system'
                  ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
                  : theme;
                if (resolved === 'dark') document.documentElement.classList.add('dark');
              } catch (e) {}
            })();
          `,
        }}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Theme toggle */}
      <div className="absolute top-4 right-4 z-10">
        <CardThemeToggle />
      </div>

      {/* ── Hero ───────────────────────────────────────────────── */}
      <section
        className="px-6 py-20 sm:py-28 text-center relative bg-gradient-to-br from-stone-100 to-stone-200 dark:from-[#1a1408] dark:to-[#2d2410] transition-colors"
      >
        <p className="uppercase tracking-[0.2em] text-xs text-stone-500 dark:text-white/70 mb-4 transition-colors">A cluster on Aggilo</p>
        <h1 className="text-4xl sm:text-5xl font-semibold mb-3 text-husl-ink dark:text-white transition-colors">{CLUSTER.displayName}</h1>
        <p className="text-lg sm:text-xl text-stone-600 dark:text-white/85 max-w-2xl mx-auto transition-colors">{CLUSTER.tagline}</p>

        <div className="mt-10 max-w-sm mx-auto w-full">
          <div className="bg-white/80 dark:bg-[#14161a]/80 backdrop-blur-sm border border-stone-200 dark:border-white/10 rounded-xl p-5 shadow-lg transition-colors">
            <AuthForm compact />
          </div>
          <p className="text-sm text-stone-500 dark:text-white/70 text-center mt-3 transition-colors">{memberBracket(activity.memberCount)}</p>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-6 py-12 space-y-12">
        {/* ── About ────────────────────────────────────────────── */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-xs uppercase tracking-[0.2em] text-stone-500 dark:text-white/50">About this room</h2>
            <div className="relative group flex items-center">
              <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded border border-stone-300 dark:border-white/20 text-stone-500 dark:text-white/60 cursor-help hover:bg-stone-100 dark:hover:bg-white/10 transition-colors">
                Founded
              </span>
              <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 w-48 p-2 bg-husl-card dark:bg-[#11140f] border border-stone-200 dark:border-white/10 text-[11px] text-stone-600 dark:text-white/80 rounded shadow-xl text-center z-10 normal-case tracking-normal">
                Built and actively run by a dedicated host and team.
              </div>
            </div>
          </div>
          <p className="text-base text-stone-700 dark:text-white/85 leading-relaxed whitespace-pre-line">
            {CLUSTER.shortDescription}
          </p>

          {/* What makes it different */}
          <div className="mt-6 rounded-lg border border-stone-200 dark:border-white/10 bg-stone-50 dark:bg-white/[0.03] p-5 transition-colors">
            <h3 className="text-xs uppercase tracking-[0.2em] text-stone-500 dark:text-white/50 mb-3">
              What makes this different from a WhatsApp group
            </h3>
            <ul className="space-y-2 text-sm text-stone-700 dark:text-white/80">
              <li className="flex gap-3">
                <span className="text-emerald-600 dark:text-emerald-400 mt-0.5">·</span>
                <span>Documents are indexed objects with titles, topics, and thread history — not just attachments</span>
              </li>
              <li className="flex gap-3">
                <span className="text-emerald-600 dark:text-emerald-400 mt-0.5">·</span>
                <span>Topics are persistent filters; click a chip, see every post and document</span>
              </li>
              <li className="flex gap-3">
                <span className="text-emerald-600 dark:text-emerald-400 mt-0.5">·</span>
                <span>Threads auto-link to topics; new posts deepen existing conversations</span>
              </li>
              <li className="flex gap-3">
                <span className="text-emerald-600 dark:text-emerald-400 mt-0.5">·</span>
                <span>Every shared link, image, video, and document is retrievable by topic — not by scrolling</span>
              </li>
            </ul>
          </div>
        </section>

        {/* ── Stats ─────────────────────────────────────────────── */}
        <section>
          <h2 className="text-xs uppercase tracking-[0.2em] text-stone-500 dark:text-white/50 mb-4">Room stats</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-lg border border-stone-200 dark:border-white/10 bg-stone-50 dark:bg-white/[0.03] p-4 text-center transition-colors">
              <p className="text-2xl font-semibold text-husl-ink dark:text-white">{activity.paperCount}</p>
              <p className="text-[11px] text-stone-500 dark:text-white/50 mt-1">Papers uploaded</p>
            </div>
            <div className="rounded-lg border border-stone-200 dark:border-white/10 bg-stone-50 dark:bg-white/[0.03] p-4 text-center transition-colors">
              <p className="text-2xl font-semibold text-husl-ink dark:text-white">{activity.threadCount}</p>
              <p className="text-[11px] text-stone-500 dark:text-white/50 mt-1">Discussion threads</p>
            </div>
            <div className="rounded-lg border border-stone-200 dark:border-white/10 bg-stone-50 dark:bg-white/[0.03] p-4 text-center transition-colors">
              <p className="text-2xl font-semibold text-husl-ink dark:text-white">{activity.analyzedCount}</p>
              <p className="text-[11px] text-stone-500 dark:text-white/50 mt-1">Documents analyzed</p>
            </div>
            <div className="rounded-lg border border-stone-200 dark:border-white/10 bg-stone-50 dark:bg-white/[0.03] p-4 text-center transition-colors">
              <p className="text-2xl font-semibold text-husl-ink dark:text-white">{activity.memberCount}</p>
              <p className="text-[11px] text-stone-500 dark:text-white/50 mt-1">Members</p>
            </div>
          </div>
        </section>

        {/* ── Activity ──────────────────────────────────────────── */}
        <section>
          <h2 className="text-xs uppercase tracking-[0.2em] text-stone-500 dark:text-white/50 mb-4">
            What&apos;s being discussed now
          </h2>

          {activity.recentTopics.length === 0 && activity.recentPapers.length === 0 ? (
            <div className="rounded-lg border border-stone-200 dark:border-white/10 bg-stone-50 dark:bg-white/[0.03] p-5 text-center transition-colors">
              <p className="text-sm text-stone-600 dark:text-white/70">The room is just getting started.</p>
              <p className="text-xs text-stone-400 dark:text-white/50 mt-1">Be among the first to share a paper or start a thread.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Topics */}
              {activity.recentTopics.length > 0 && (
                <div>
                  <h3 className="text-[11px] uppercase tracking-wider text-stone-400 dark:text-white/40 mb-2">Active topics</h3>
                  <div className="flex flex-wrap gap-2">
                    {activity.recentTopics.map((t) => (
                      <span
                        key={t.name}
                        className="px-3 py-1 rounded-full bg-stone-100 dark:bg-white/10 text-xs text-stone-700 dark:text-white/80 border border-stone-200 dark:border-white/10 transition-colors"
                      >
                        {t.name}
                        <span className="text-stone-500 dark:text-white/40 ml-1">({t.postCount})</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent papers */}
              {activity.recentPapers.length > 0 && (
                <div>
                  <h3 className="text-[11px] uppercase tracking-wider text-stone-400 dark:text-white/40 mb-2">Recent papers</h3>
                  <ul className="space-y-2">
                    {activity.recentPapers.map((p, i) => (
                      <li
                        key={i}
                        className="text-sm text-stone-700 dark:text-white/80 truncate border-l-2 border-emerald-500/40 pl-3"
                      >
                        {p.title}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </section>

        {/* ── Privacy guarantee ───────────────────────────────── */}
        <section>
          <h2 className="text-xs uppercase tracking-[0.2em] text-stone-500 dark:text-white/50 mb-4">What stays inside</h2>
          <p className="text-sm text-stone-600 dark:text-white/70 leading-relaxed">
            Conversations between members stay between members. Posts, replies, reading status, annotations,
            and private exchanges are never indexed, scraped, or shared. This page shows only the room&apos;s
            identity and anonymised activity signals.
          </p>
        </section>

        {/* ── Final CTA ─────────────────────────────────────────── */}
        <section className="pt-4">
          <a
            href="#top"
            className="inline-flex items-center justify-center w-full sm:w-auto px-6 py-3 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-medium transition-colors"
          >
            Join this room
          </a>
        </section>
      </div>

      <footer className="text-center text-xs text-stone-400 dark:text-white/40 py-10 border-t border-stone-200 dark:border-white/5 transition-colors">
        <p>
          A cluster on{" "}
          <a href="https://aggilo.in" target="_blank" rel="noopener noreferrer" className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 dark:hover:text-emerald-300">
            Aggilo
          </a>
          .
        </p>
      </footer>
    </main>
  );
}
