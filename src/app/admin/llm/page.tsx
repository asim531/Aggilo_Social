import { createClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

interface LogRow {
  id: string;
  agent: string;
  operation_key: string;
  model: string;
  fallback_used: boolean;
  prompt_tokens: number | null;
  completion_tokens: number | null;
  latency_ms: number | null;
  decision_summary: string | null;
  cost_estimate_usd: number | null;
  created_at: string;
}

function fmtRelative(iso: string): string {
  const min = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m`;
  return `${Math.floor(min / 60)}h`;
}

export default async function LlmPage() {
  const supabase = await createClient();
  const sinceUtc = new Date();
  sinceUtc.setUTCHours(0, 0, 0, 0);

  const [{ data: today }, { data: recent }] = await Promise.all([
    supabase
      .from("llm_response_logs")
      .select("agent, operation_key, model, fallback_used, prompt_tokens, completion_tokens, latency_ms, decision_summary, cost_estimate_usd")
      .gte("created_at", sinceUtc.toISOString()),
    supabase
      .from("llm_response_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  // Aggregate today's data per agent + operation
  const todayRows = (today ?? []) as LogRow[];
  const byOp = new Map<
    string,
    {
      agent: string;
      operation: string;
      calls: number;
      tokens: number;
      cost: number;
      avgLatency: number;
      fallbacks: number;
    }
  >();

  todayRows.forEach((r) => {
    const key = `${r.agent}:${r.operation_key}`;
    const cur = byOp.get(key) ?? {
      agent: r.agent,
      operation: r.operation_key,
      calls: 0,
      tokens: 0,
      cost: 0,
      avgLatency: 0,
      fallbacks: 0,
    };
    cur.calls += 1;
    cur.tokens += (r.prompt_tokens ?? 0) + (r.completion_tokens ?? 0);
    cur.cost += Number(r.cost_estimate_usd) || 0;
    cur.avgLatency += r.latency_ms ?? 0;
    if (r.fallback_used) cur.fallbacks += 1;
    byOp.set(key, cur);
  });

  const aggregated = [...byOp.values()]
    .map((r) => ({ ...r, avgLatency: r.calls ? Math.round(r.avgLatency / r.calls) : 0 }))
    .sort((a, b) => b.cost - a.cost);

  const totalCost = todayRows.reduce(
    (s, r) => s + (Number(r.cost_estimate_usd) || 0),
    0
  );
  const totalCalls = todayRows.length;
  const totalFallbacks = todayRows.filter((r) => r.fallback_used).length;
  const budgetUsd = parseFloat(process.env.LLM_DAILY_BUDGET_USD ?? "5");

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold text-gray-900">LLM observability</h1>
        <p className="text-sm text-gray-500 mt-1">
          Every model call, what it cost, what it decided. Token-max with a floor.
        </p>
      </header>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Calls today" value={totalCalls.toString()} />
        <Stat
          label="Cost today"
          value={`$${totalCost.toFixed(4)}`}
          hint={`Budget $${budgetUsd.toFixed(2)} (${
            totalCost >= budgetUsd ? "exceeded" : `${Math.round((totalCost / budgetUsd) * 100)}% used`
          })`}
          alert={totalCost >= budgetUsd}
        />
        <Stat label="Fallback events" value={totalFallbacks.toString()} alert={totalFallbacks > 0} />
        <Stat label="Operations" value={aggregated.length.toString()} />
      </section>

      <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">Today by operation</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Agent</th>
                <th className="px-3 py-2 text-left font-medium">Operation</th>
                <th className="px-3 py-2 text-right font-medium">Calls</th>
                <th className="px-3 py-2 text-right font-medium">Tokens</th>
                <th className="px-3 py-2 text-right font-medium">Avg latency</th>
                <th className="px-3 py-2 text-right font-medium">Fallbacks</th>
                <th className="px-3 py-2 text-right font-medium">Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {aggregated.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-6 text-center text-gray-500">
                    No LLM calls recorded today.
                  </td>
                </tr>
              ) : (
                aggregated.map((r) => (
                  <tr key={`${r.agent}:${r.operation}`}>
                    <td className="px-3 py-2 text-gray-700">{r.agent}</td>
                    <td className="px-3 py-2 text-gray-700">{r.operation}</td>
                    <td className="px-3 py-2 text-right text-gray-900 font-medium">{r.calls}</td>
                    <td className="px-3 py-2 text-right text-gray-700">{r.tokens.toLocaleString()}</td>
                    <td className="px-3 py-2 text-right text-gray-700">{r.avgLatency}ms</td>
                    <td className="px-3 py-2 text-right">
                      {r.fallbacks > 0 ? (
                        <span className="text-amber-700">{r.fallbacks}</span>
                      ) : (
                        <span className="text-gray-400">0</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right text-gray-900 font-mono">
                      ${r.cost.toFixed(4)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">Most recent 50 calls</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-3 py-2 text-left font-medium">When</th>
                <th className="px-3 py-2 text-left font-medium">Agent / Op</th>
                <th className="px-3 py-2 text-left font-medium">Model</th>
                <th className="px-3 py-2 text-left font-medium">Decision</th>
                <th className="px-3 py-2 text-right font-medium">Tokens</th>
                <th className="px-3 py-2 text-right font-medium">Latency</th>
                <th className="px-3 py-2 text-right font-medium">Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(recent ?? []).length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-6 text-center text-gray-500">
                    No LLM logs yet.
                  </td>
                </tr>
              ) : (
                ((recent ?? []) as LogRow[]).map((r) => (
                  <tr key={r.id}>
                    <td className="px-3 py-2 text-gray-500">{fmtRelative(r.created_at)}</td>
                    <td className="px-3 py-2 text-gray-700">
                      {r.agent}
                      <span className="text-gray-400"> · {r.operation_key}</span>
                    </td>
                    <td className="px-3 py-2 text-gray-700">
                      {r.model}
                      {r.fallback_used && (
                        <span className="ml-1 text-[10px] px-1 py-0.5 rounded bg-amber-100 text-amber-700">
                          fallback
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-gray-700">{r.decision_summary ?? "—"}</td>
                    <td className="px-3 py-2 text-right text-gray-700">
                      {((r.prompt_tokens ?? 0) + (r.completion_tokens ?? 0)).toLocaleString()}
                    </td>
                    <td className="px-3 py-2 text-right text-gray-700">{r.latency_ms ?? 0}ms</td>
                    <td className="px-3 py-2 text-right text-gray-900 font-mono">
                      ${(Number(r.cost_estimate_usd) || 0).toFixed(5)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
  alert,
}: {
  label: string;
  value: string;
  hint?: string;
  alert?: boolean;
}) {
  return (
    <div className={`rounded-xl border p-3 ${alert ? "border-amber-200 bg-amber-50" : "border-gray-200 bg-white"}`}>
      <p className="text-[11px] uppercase tracking-wide text-gray-500 font-medium">{label}</p>
      <p className={`text-lg font-semibold mt-0.5 ${alert ? "text-amber-700" : "text-gray-900"}`}>{value}</p>
      {hint && <p className="text-[11px] text-gray-500 mt-0.5">{hint}</p>}
    </div>
  );
}
