import Link from "next/link";
import { createClient } from "@/lib/supabase-server";

interface Stat {
  label: string;
  value: string | number;
  hint?: string;
  href?: string;
  tone?: "neutral" | "alert" | "success";
}

/**
 * Admin overview — what needs attention, what the AI spent today,
 * what the agents have been doing.
 *
 * Closed-loops dashboard: every key metric here corresponds to a row
 * in a queryable table. Nothing is computed on the fly that can't be
 * audited.
 */
export default async function AdminOverviewPage() {
  const supabase = await createClient();
  const sinceUtc = new Date();
  sinceUtc.setUTCHours(0, 0, 0, 0);
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  // ── Counts in parallel ─────────────────────────────────────────
  const [
    welfareOpen,
    characterOpen,
    sageDecisions24h,
    sageSilent24h,
    members,
    posts24h,
    todaysCost,
    fallbackUsed24h,
    feedback7d,
  ] = await Promise.all([
    supabase
      .from("welfare_notifications")
      .select("id", { count: "exact", head: true })
      .eq("resolved", false),
    supabase
      .from("character_concerns")
      .select("id", { count: "exact", head: true })
      .is("resolved_at", null),
    supabase
      .from("sage_decision_logs")
      .select("id", { count: "exact", head: true })
      .gte("created_at", since24h.toISOString()),
    supabase
      .from("sage_decision_logs")
      .select("id", { count: "exact", head: true })
      .eq("step_matched", "silent")
      .gte("created_at", since24h.toISOString()),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase
      .from("posts")
      .select("id", { count: "exact", head: true })
      .eq("is_sage", false)
      .gte("created_at", since24h.toISOString()),
    supabase
      .from("llm_response_logs")
      .select("cost_estimate_usd")
      .gte("created_at", sinceUtc.toISOString()),
    supabase
      .from("llm_response_logs")
      .select("id", { count: "exact", head: true })
      .eq("fallback_used", true)
      .gte("created_at", since24h.toISOString()),
    supabase
      .from("agent_feedback")
      .select("signal")
      .gte("created_at", since7d.toISOString()),
  ]);

  const todaysSpend = (todaysCost.data ?? []).reduce(
    (s: number, r: { cost_estimate_usd: number }) => s + (Number(r.cost_estimate_usd) || 0),
    0
  );
  const budgetUsd = parseFloat(process.env.LLM_DAILY_BUDGET_USD ?? "5");

  const helpful7d = (feedback7d.data ?? []).filter(
    (r: { signal: string }) => r.signal === "helpful"
  ).length;
  const unhelpful7d = (feedback7d.data ?? []).filter(
    (r: { signal: string }) => r.signal === "unhelpful" || r.signal === "inaccurate"
  ).length;

  const sageTotal = sageDecisions24h.count ?? 0;
  const silenceRate =
    sageTotal > 0 ? Math.round(((sageSilent24h.count ?? 0) / sageTotal) * 100) : null;

  const stats: Stat[] = [
    {
      label: "Welfare — open",
      value: welfareOpen.count ?? 0,
      hint: welfareOpen.count ? "Needs response" : "All clear",
      href: "/admin/welfare",
      tone: welfareOpen.count ? "alert" : "success",
    },
    {
      label: "Care — open",
      value: characterOpen.count ?? 0,
      hint: characterOpen.count ? "Needs your attention" : "All clear",
      href: "/admin/character",
      tone: characterOpen.count ? "alert" : "success",
    },
    {
      label: "Members",
      value: members.count ?? 0,
      hint: "Total profiles",
    },
    {
      label: "Member posts (24h)",
      value: posts24h.count ?? 0,
    },
    {
      label: "Sage activity (24h)",
      value: sageDecisions24h.count ?? 0,
      hint: silenceRate !== null ? `${silenceRate}% silent` : "no activity yet",
      href: "/admin/thoughts",
    },
    {
      label: "LLM spend today",
      value: `$${todaysSpend.toFixed(4)}`,
      hint: `Budget $${budgetUsd.toFixed(2)} · ${
        todaysSpend >= budgetUsd ? "exceeded" : `${Math.round((todaysSpend / budgetUsd) * 100)}% used`
      }`,
      tone: todaysSpend >= budgetUsd ? "alert" : "neutral",
      href: "/admin/llm",
    },
    {
      label: "Fallback hits (24h)",
      value: fallbackUsed24h.count ?? 0,
      hint: "Times primary LLM failed",
    },
    {
      label: "Member feedback (7d)",
      value: `${helpful7d} 👍 / ${unhelpful7d} 👎`,
      hint: "Sage responses rated",
    },
  ];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold text-gray-900">Overview</h1>
        <p className="text-sm text-gray-500 mt-1">
          What the AI did today, what needs attention, what the room is doing.
        </p>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((s) => {
          const card = (
            <div
              key={s.label}
              className={`bg-white rounded-xl border p-4 transition-colors ${
                s.tone === "alert"
                  ? "border-rose-200 hover:border-rose-300"
                  : s.tone === "success"
                    ? "border-emerald-100 hover:border-emerald-200"
                    : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <p className="text-xs uppercase tracking-wide text-gray-500 font-medium">
                {s.label}
              </p>
              <p
                className={`text-2xl font-semibold mt-1 ${
                  s.tone === "alert"
                    ? "text-rose-700"
                    : s.tone === "success"
                      ? "text-emerald-700"
                      : "text-gray-900"
                }`}
              >
                {s.value}
              </p>
              {s.hint && <p className="text-xs text-gray-500 mt-1">{s.hint}</p>}
            </div>
          );
          return s.href ? (
            <Link key={s.label} href={s.href} className="block">
              {card}
            </Link>
          ) : (
            <div key={s.label}>{card}</div>
          );
        })}
      </section>

      <section className="bg-white rounded-xl border border-gray-200 p-4">
        <h2 className="text-sm font-semibold text-gray-900 mb-2">How this dashboard works</h2>
        <ul className="text-xs text-gray-600 space-y-1.5 leading-relaxed">
          <li>
            <strong>Welfare and Care</strong> badges fire in realtime — you see
            them tick up the moment something needs your attention. Both queues
            need active human judgment; the system never resolves them itself.
          </li>
          <li>
            <strong>Workshop</strong> shows what the agents have been
            building for this room — Sage&apos;s posts and silences, plus the live
            Clio↔Sage exchanges about tools to run and features to propose.
          </li>
          <li>
            <strong>Vault</strong> is the source of truth for verified
            references. Gaps the agents notice in real cluster activity surface
            here as suggested additions.
          </li>
          <li>
            <strong>LLM</strong> tab tracks every model call, token, fallback
            event, and cost estimate. Daily budget cap is{" "}
            <code className="px-1 rounded bg-gray-100">${budgetUsd.toFixed(2)}</code>{" "}
            — when reached, agents step back gracefully.
          </li>
          <li>
            <strong>Features</strong> shows what the agents have proposed to
            make this room better, what members upvoted, what you approved
            for development.
          </li>
        </ul>
      </section>
    </div>
  );
}
