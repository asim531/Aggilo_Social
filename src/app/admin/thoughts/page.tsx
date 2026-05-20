import { createClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

const STEP_LABELS: Record<string, string> = {
  welfare: "Welfare response",
  character: "Care response",
  citation: "Reference check",
  authority_redirect: "Routed to humans",
  reference_surface: "Reference shared",
  care_witness: "Care witness",
  witness_participation: "Joined a thread",
  silent: "Stayed silent",
  unknown: "Unclassified",
};

function fmtRelative(iso: string): string {
  const min = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

interface SageRow {
  id: string;
  post_id: string;
  step_matched: string;
  step_rationale: string;
  vault_id_used: string | null;
  response_text: string | null;
  signals_detected: Record<string, unknown>;
  created_at: string;
  // Supabase nested-select can return arrays — we normalise on use
  posts?:
    | { content: string; profiles: { nickname: string } | { nickname: string }[] | null }
    | { content: string; profiles: { nickname: string } | { nickname: string }[] | null }[]
    | null;
}

function normalizePosts(p: SageRow["posts"]): { content: string; nickname: string | null } | null {
  if (!p) return null;
  const post = Array.isArray(p) ? p[0] : p;
  if (!post) return null;
  const profile = Array.isArray(post.profiles) ? post.profiles[0] : post.profiles;
  return {
    content: post.content,
    nickname: profile?.nickname ?? null,
  };
}

interface ChatboxRow {
  id: string;
  exchange_number: number;
  trigger_type: string;
  triggering_observation: string | null;
  sage_message: string;
  clio_message: string;
  observe_mode: boolean;
  related_post_id: string | null;
  created_at: string;
}

export default async function ThoughtsPage() {
  const supabase = await createClient();

  const [{ data: decisions }, { data: chatbox }, { data: distribution }] = await Promise.all([
    supabase
      .from("sage_decision_logs")
      .select(
        "id, post_id, step_matched, step_rationale, vault_id_used, response_text, signals_detected, created_at, posts(content, profiles(nickname))"
      )
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("agent_chatbox_exchanges")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("sage_decision_logs")
      .select("step_matched")
      .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
  ]);

  const counts: Record<string, number> = {};
  ((distribution ?? []) as Array<{ step_matched: string }>).forEach((r) => {
    counts[r.step_matched] = (counts[r.step_matched] ?? 0) + 1;
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold text-gray-900">Agent Thoughts</h1>
        <p className="text-sm text-gray-500 mt-1">
          What the agents have been doing in this room — when they spoke, when
          they stayed quiet, and what they discussed with each other.
        </p>
      </header>

      <section className="bg-white rounded-xl border border-gray-200 p-4">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">
          Sage activity — last 7 days
        </h2>
        {Object.keys(counts).length === 0 ? (
          <p className="text-xs text-gray-500">Quiet week so far.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {Object.entries(counts)
              .sort(([, a], [, b]) => b - a)
              .map(([step, count]) => (
                <div key={step} className="border border-gray-100 rounded-lg p-2">
                  <p className="text-[11px] uppercase tracking-wide text-gray-500">
                    {STEP_LABELS[step] ?? step}
                  </p>
                  <p className="text-lg font-semibold text-gray-900 mt-0.5">{count}</p>
                </div>
              ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-sm font-semibold text-gray-900 mb-3">
          Latest Clio↔Sage exchanges
        </h2>
        <div className="space-y-3">
          {((chatbox ?? []) as ChatboxRow[]).length === 0 ? (
            <p className="text-xs text-gray-500">No exchanges yet.</p>
          ) : (
            ((chatbox ?? []) as ChatboxRow[]).map((ex) => (
              <div key={ex.id} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-2 text-[11px] text-gray-500">
                  <span>
                    Exchange #{ex.exchange_number} · {ex.trigger_type}
                  </span>
                  <span>{fmtRelative(ex.created_at)}</span>
                </div>
                {ex.triggering_observation && (
                  <p className="text-xs italic text-gray-500 mb-2">
                    {ex.triggering_observation}
                  </p>
                )}
                <div className="space-y-2 text-sm">
                  <p>
                    <span className="font-semibold text-aggilo-sage">Sage:</span>{" "}
                    <span className="text-gray-700">{ex.sage_message}</span>
                  </p>
                  <p>
                    <span className="font-semibold text-amber-600">Clio:</span>{" "}
                    <span className="text-gray-700">{ex.clio_message}</span>
                  </p>
                </div>
                {ex.observe_mode && (
                  <p className="mt-2 text-[11px] text-amber-700 italic">
                    observe mode — both agents agreed to wait
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-gray-900 mb-3">
          Recent Sage activity (last 50)
        </h2>
        <div className="space-y-2">
          {((decisions ?? []) as unknown as SageRow[]).length === 0 ? (
            <p className="text-xs text-gray-500">No decisions yet.</p>
          ) : (
            ((decisions ?? []) as unknown as SageRow[]).map((d) => {
              const post = normalizePosts(d.posts);
              return (
              <div
                key={d.id}
                className="bg-white rounded-lg border border-gray-200 px-3 py-2 text-xs"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-gray-700">
                    {STEP_LABELS[d.step_matched] ?? d.step_matched}
                  </span>
                  <span className="text-gray-500">{fmtRelative(d.created_at)}</span>
                </div>
                <p className="text-gray-600 line-clamp-2 mb-1">
                  <span className="text-gray-400">post:</span>{" "}
                  {post?.content?.substring(0, 200) ?? "(deleted)"}
                  {post?.nickname && (
                    <span className="text-gray-400"> — {post.nickname}</span>
                  )}
                </p>
                {d.response_text && (
                  <p className="text-gray-700 line-clamp-1 mt-1">
                    Sage: {d.response_text}
                  </p>
                )}
              </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
