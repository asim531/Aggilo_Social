import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import {
  fetchClusterConfig,
  readPublicMeta,
  type AtlasRssFeed,
} from "@/lib/admin-cluster";
import ClusterIdentityForm from "@/components/admin/ClusterIdentityForm";
import AtlasFeedList from "@/components/admin/AtlasFeedList";
import PulseReviewTable from "@/components/admin/PulseReviewTable";
import DemandSignalsPreview from "@/components/admin/DemandSignalsPreview";

export const dynamic = "force-dynamic";

interface PulseRow {
  id: string;
  cluster_id: string;
  source_url: string;
  source_title: string;
  source_publisher: string | null;
  source_published_at: string | null;
  atlas_relevance_score: number | null;
  atlas_reasoning: string | null;
  sage_verdict: string;
  sage_rationale: string | null;
  sage_witness_line: string | null;
  status: string;
  is_public_safe: boolean;
  related_post_id: string | null;
  surfaced_at: string | null;
  created_at: string;
}

interface DemandSignalRow {
  id: string;
  source_slug: string | null;
  email: string | null;
  visitor_country: string | null;
  visitor_gender: string | null;
  free_text_note: string | null;
  status: string;
  created_at: string;
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function AdminClusterPage({ params }: PageProps) {
  const { slug } = await params;

  const supabase = await createClient();
  const config = await fetchClusterConfig(supabase, slug);
  if (!config) {
    notFound();
  }

  const meta = readPublicMeta(config.public_meta);
  const feeds = (config.atlas_rss_feeds ?? []) as AtlasRssFeed[];

  // Pulse review queue (most recent 50)
  const { data: pulses } = await supabase
    .from("atlas_pulses")
    .select("*")
    .eq("cluster_id", config.cluster_id)
    .order("created_at", { ascending: false })
    .limit(50);

  // Demand signals scoped to this cluster's slug
  const { data: signals } = await supabase
    .from("cluster_demand_signals")
    .select(
      "id, source_slug, email, visitor_country, visitor_gender, free_text_note, status, created_at"
    )
    .or(
      [
        config.public_slug ? `source_slug.eq.${config.public_slug}` : null,
        `source_cluster_id.eq.${config.cluster_id}`,
      ]
        .filter(Boolean)
        .join(",")
    )
    .order("created_at", { ascending: false })
    .limit(20);

  // Anchor-seed picker — show Sage seed posts as the candidate set
  const { data: anchorCandidates } = await supabase
    .from("posts")
    .select("id, content, created_at")
    .eq("is_sage", true)
    .is("parent_id", null)
    .order("created_at", { ascending: true })
    .limit(20);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-xl font-semibold text-gray-900">
          {meta.display_name || config.cluster_id}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Configure the cluster&apos;s public surface, Atlas RSS feeds, and the
          Pulse review queue. Every change is logged to{" "}
          <code className="px-1 rounded bg-gray-100">cluster_admin_actions</code>.
        </p>
        <div className="mt-2 flex items-center gap-2 text-xs">
          <span
            className={`px-2 py-0.5 rounded-full font-medium ${
              config.is_public_listed
                ? "bg-emerald-100 text-emerald-700"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            {config.is_public_listed ? "Public" : "Private"}
          </span>
          {config.public_slug && (
            <a
              href={`/c/${config.public_slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-aggilo-deep hover:underline"
            >
              /c/{config.public_slug} ↗
            </a>
          )}
        </div>
      </header>

      <ClusterIdentityForm
        clusterId={config.cluster_id}
        slug={slug}
        initial={{
          is_public_listed: config.is_public_listed,
          public_slug: config.public_slug ?? "",
          meta,
        }}
        anchorCandidates={(anchorCandidates ?? []).map((p) => ({
          id: p.id as string,
          excerpt: String(p.content ?? "").slice(0, 200),
          created_at: p.created_at as string,
        }))}
      />

      <AtlasFeedList
        clusterId={config.cluster_id}
        slug={slug}
        feeds={feeds}
      />

      <PulseReviewTable
        clusterId={config.cluster_id}
        slug={slug}
        pulses={(pulses ?? []) as PulseRow[]}
      />

      <DemandSignalsPreview
        clusterId={config.cluster_id}
        signals={(signals ?? []) as DemandSignalRow[]}
      />
    </div>
  );
}
