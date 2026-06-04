import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getPublicClusterBySlug,
  formatMemberBracket,
  publicClusterUrl,
  siteUrl,
} from "@/lib/public-cluster";

interface PageProps {
  params: Promise<{ slug: string }>;
}

// 1-hour ISR window. The cluster identity rarely changes; if it does,
// the admin panel triggers a revalidate. Atlas Pulses surface within
// this window automatically because the view is recomputed on each
// regeneration.
export const revalidate = 3600;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const cluster = await getPublicClusterBySlug(slug);
  if (!cluster) {
    return { title: "Not found · Aggilo" };
  }
  const url = publicClusterUrl(cluster.public_slug);
  const ogImage = `${siteUrl()}/api/og/cluster/${cluster.public_slug}`;
  const title = `${cluster.meta.display_name} — ${cluster.meta.tagline}`;
  return {
    title,
    description: cluster.meta.description,
    alternates: { canonical: url },
    openGraph: {
      title: cluster.meta.display_name,
      description: cluster.meta.tagline,
      url,
      siteName: "Aggilo",
      type: "website",
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: cluster.meta.display_name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: cluster.meta.display_name,
      description: cluster.meta.tagline,
      images: [ogImage],
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function PublicClusterPage({ params }: PageProps) {
  const { slug } = await params;
  const cluster = await getPublicClusterBySlug(slug);
  if (!cluster) {
    notFound();
  }

  const { meta } = cluster;
  const heroStyle = {
    backgroundImage: `linear-gradient(135deg, ${meta.accent_from}, ${meta.accent_to})`,
  };

  // Schema.org JSON-LD. Identifies the cluster as an Organization that
  // is a sub-organisation of Aggilo, and surfaces the canonical URL +
  // description so AI assistants can cite it.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: meta.display_name,
    description: meta.description || meta.tagline,
    url: publicClusterUrl(cluster.public_slug),
    parentOrganization: {
      "@type": "Organization",
      name: "Aggilo",
      url: "https://aggilo.in",
    },
    knowsAbout: meta.demographic_chips.map((c) => c.label),
  };

  const joinHref = `/?ref=${encodeURIComponent(cluster.public_slug)}#join`;

  return (
    <main className="min-h-screen bg-[#0b0d0f] text-white">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section
        className="px-6 py-20 sm:py-28 text-center"
        style={heroStyle}
      >
        <p className="uppercase tracking-[0.2em] text-xs text-white/70 mb-4">
          A cluster on Aggilo
        </p>
        <h1 className="text-4xl sm:text-5xl font-semibold mb-3">
          {meta.display_name}
        </h1>
        <p className="text-lg sm:text-xl text-white/85 max-w-2xl mx-auto">
          {meta.tagline}
        </p>

        {meta.demographic_chips.length > 0 && (
          <div className="mt-7 flex flex-wrap items-center justify-center gap-2">
            {meta.demographic_chips.map((chip) => (
              <span
                key={`${chip.icon}-${chip.label}`}
                className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm text-sm text-white/90 border border-white/15"
              >
                <span className="mr-1.5">{chip.icon}</span>
                {chip.label}
              </span>
            ))}
          </div>
        )}

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href={joinHref}
            className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-white text-[#0b0d0f] font-medium hover:bg-white/90 transition-colors"
          >
            Join this room
          </Link>
          <span className="text-sm text-white/70">
            {formatMemberBracket(cluster.member_count_bracket)}
            {cluster.joined_this_week !== null && cluster.joined_this_week > 0
              ? ` · ${cluster.joined_this_week} joined this week`
              : ""}
          </span>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-6 py-12 space-y-12">
        {/* ── About ─────────────────────────────────────────────── */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-xs uppercase tracking-[0.2em] text-white/50">
              About this room
            </h2>
            <div className="relative group flex items-center">
              <span 
                className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded border border-white/20 text-white/60 cursor-help hover:bg-white/10 transition-colors"
              >
                Founded
              </span>
              <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 w-48 p-2 bg-[#11140f] border border-white/10 text-[11px] text-white/80 rounded shadow-xl text-center z-10 normal-case tracking-normal">
                Built and actively run by a dedicated host and team.
              </div>
            </div>
          </div>
          <p className="text-base text-white/85 leading-relaxed whitespace-pre-line">
            {meta.description}
          </p>
        </section>

        {/* ── Anchor seed (the room's founding statement) ───────── */}
        {cluster.anchor_seed_text && (
          <section>
            <h2 className="text-xs uppercase tracking-[0.2em] text-white/50 mb-4">
              The room&apos;s founding statement
            </h2>
            <blockquote className="border-l-2 border-emerald-500/60 pl-5 py-1 text-white/80 leading-relaxed whitespace-pre-line">
              {cluster.anchor_seed_text}
            </blockquote>
            <p className="text-xs text-white/40 mt-3">
              From: Sage · Anchor
            </p>
          </section>
        )}

        {/* ── Capabilities ──────────────────────────────────────── */}
        {meta.capabilities_copy.length > 0 && (
          <section>
            <h2 className="text-xs uppercase tracking-[0.2em] text-white/50 mb-4">
              What runs here
            </h2>
            <ul className="space-y-2.5 text-white/85">
              {meta.capabilities_copy.map((line, i) => (
                <li key={i} className="flex gap-3">
                  <span className="text-emerald-400 mt-1.5">·</span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* ── Latest Atlas Pulse (when public-safe and live) ───── */}
        {cluster.latest_pulse && (
          <section>
            <h2 className="text-xs uppercase tracking-[0.2em] text-white/50 mb-4">
              What the room&apos;s engaging with right now
            </h2>
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-5">
              <p className="text-base text-white/90 mb-2">
                {cluster.latest_pulse.source_title}
              </p>
              {cluster.latest_pulse.sage_witness_line && (
                <p className="text-sm text-white/70 italic mb-3">
                  &ldquo;{cluster.latest_pulse.sage_witness_line}&rdquo;
                </p>
              )}
              <a
                href={cluster.latest_pulse.source_url}
                target="_blank"
                rel="nofollow noopener noreferrer"
                className="text-xs text-emerald-400 hover:text-emerald-300"
              >
                {cluster.latest_pulse.source_publisher ?? "Source"} →
              </a>
            </div>
            <p className="text-[11px] text-white/40 mt-2">
              Atlas surfaces contemporary pieces. Sage reviews each one before it lands. The room sees nothing when nothing fits.
            </p>
          </section>
        )}

        {/* ── Identity guarantee ────────────────────────────────── */}
        <section>
          <h2 className="text-xs uppercase tracking-[0.2em] text-white/50 mb-4">
            What stays inside
          </h2>
          <p className="text-sm text-white/70 leading-relaxed">
            Conversations between members stay between members. Posts, replies, and private exchanges are never indexed, scraped, or shared. This page shows only the room&apos;s identity and the contemporary signals it surfaces in public.
          </p>
        </section>

        {/* ── Final CTA ─────────────────────────────────────────── */}
        <section className="pt-4">
          <Link
            href={joinHref}
            className="inline-flex items-center justify-center w-full sm:w-auto px-6 py-3 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-medium transition-colors"
          >
            Continue to join
          </Link>
        </section>
      </div>

      <footer className="text-center text-xs text-white/40 py-10 border-t border-white/5">
        <p>
          A cluster on{" "}
          <a
            href="https://aggilo.in"
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-400 hover:text-emerald-300"
          >
            Aggilo
          </a>
          .
        </p>
      </footer>
    </main>
  );
}
