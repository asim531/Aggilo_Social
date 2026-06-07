# Tool Economy

> **Authority:** Architecture-only specification. Implementation deferred until paid tiers exist. Defines cost model, affinity gating, pricing framework, and build-vs-buy decisions.
> **Expert profile:** Cost Economics Analyst · Senior Product Strategist

---

## 1. Scope

This document specifies the Tool Economy architecture. **It is not implemented in Phase 0 or the initial main product release.** It exists so that:
- Global tool registry (`PLATFORM_TOOLS_REGISTRY.md`) includes cost profiles from day one.
- When paid tiers launch, the infrastructure is already designed.
- Build-vs-buy decisions are made consistently.

---

## 2. Cost Model

### 2.1 Per-Tool Cost Profile

Stored in `platform_tools.cost_profile` (JSONB):

```json
{
  "development_cost_usd": 3000,
  "deployment_cost_usd_per_month": 5.00,
  "per_invocation": {
    "llm_tokens_avg": 1200,
    "llm_cost_usd_avg": 0.012,
    "compute_ms_avg": 800,
    "compute_cost_usd_avg": 0.003
  }
}
```

### 2.2 Per-Cluster Marginal Cost

```
Monthly tool cost = deployment_cost
                   + (invocations × per_invocation_cost)
                   + (llm_tokens × token_rate)
```

**Example:** Document Analysis on Research Circle MJ
- Deployment: $5.00/month
- 50 invocations/month × $0.015 = $0.75
- 60K tokens/month × $0.00001 = $0.60
- **Total: $6.35/month**

### 2.3 Aggregation for Cluster Billing

```sql
-- Monthly tool cost per cluster
SELECT
  c.cluster_id,
  t.tool_name,
  t.cost_profile->>'deployment_cost_usd_per_month' AS deployment,
  e.invocation_count * (t.cost_profile->'per_invocation'->>'llm_cost_usd_avg')::numeric AS invocation_cost,
  -- LLM token cost from agent_runtime logs
  ar.token_count * 0.00001 AS token_cost
FROM cluster_tool_enablements e
JOIN platform_tools t ON e.platform_tool_id = t.id
JOIN clusters c ON e.cluster_id = c.id
LEFT JOIN agent_runtime_logs ar ON ar.tool_id = t.id AND ar.cluster_id = c.id
WHERE e.status = 'active'
GROUP BY c.cluster_id, t.tool_name, t.cost_profile, e.invocation_count, ar.token_count;
```

---

## 3. Affinity Gating

### 3.1 What Is Affinity Gating?

Tools are not available to all clusters by default. They are gated by:

| Gate | Rule |
|------|------|
| **Cluster type** | Generic clusters get basic tools. Premium clusters get advanced tools. |
| **Cluster size** | Some tools require minimum members (e.g., polls need ≥5 for meaningful results). |
| **Cluster purpose** | Tools are suggested based on cluster purpose (Research Circle → document analysis). |
| **Member activity** | Tools may unlock after cluster reaches activity threshold (e.g., 10 posts/week). |
| **Budget tier** | Elevated/Maximum budget tiers unlock compute-intensive tools. |

### 3.2 Admin Override

Platform admin can override any gate for any cluster:
- Override is logged in `cluster_tool_enablements`.
- Reason is required.
- Override expires in 90 days unless renewed.

---

## 4. Pricing Tiers (Deferred)

### 4.1 Proposed Tiers

| Tier | Monthly Price | Tool Access | Budget Multiplier |
|------|-------------|-------------|-------------------|
| **Free** | $0 | Basic tools (threading, polls, @Sage) | 1× |
| **Standard** | $9.99 | +5 advanced tools | 1× |
| **Premium** | $29.99 | All tools + custom tool creation | 2× |
| **Enterprise** | $99.99 | All tools + priority support + white-label | 3× |

### 4.2 Tool Bundling

Instead of à la carte pricing, tools are bundled by cluster purpose:

| Bundle | Tools | Price |
|--------|-------|-------|
| **Research Kit** | Document analysis, citation manager, topic taxonomy, reading tracker | $4.99/month |
| **Community Kit** | Event coordination, polls, member directory, announcement board | $2.99/month |
| **Faith Study Kit** | Scripture reference, discussion guide, prayer request tracker | $3.99/month |

Clusters can enable individual tools from any bundle, but bundling is cheaper.

---

## 5. Build-vs-Buy Framework

### 5.1 Decision Matrix

| Factor | Build (Custom) | Buy (Existing Global Tool) |
|--------|---------------|---------------------------|
| **Development cost** | High ($3K-$10K) | Low ($0, already built) |
| **Time to deploy** | 2-4 weeks | Immediate |
| **Cluster specificity** | Exact match | May need config adjustment |
| **Maintenance burden** | Platform team | Shared across all clusters |
| **Reusability** | Low (one cluster) | High (all clusters) |
| **Marginal cost** | High (dedicated infra) | Low (shared infra) |

### 5.2 Decision Rule

```
Tool request arrives
    │
    ├── Does matching global tool exist?
    │     ├── Yes → Enable (buy). Cost = deployment + per-use.
    │     └── No → Evaluate:
    │           ├── Is it needed by ≥3 clusters? → Build as global tool.
    │           ├── Is it highly specific to one cluster? → Build as cluster-private.
    │           └── Is it cheaper to use external API? → Integrate third-party.
    │
    └── Cost estimate generated from `platform_tools.cost_profile`
```

---

## 6. Cost Visibility in Admin Dashboard

```
Tool Cost Panel
┌─────────────────────────────────────────────────────────┐
│ Research Circle MJ — Tool Costs (June 2026)             │
│                                                         │
│ Document Analysis    $6.35   [50 invocations]        │
│ Topic Taxonomy         $2.10   [20 invocations]        │
│ Polls                  $0.50   [10 invocations]        │
│ ─────────────────────────────────────────────           │
│ Total:                 $8.95/month                      │
│                                                         │
│ [ View Detailed Breakdown → ]                           │
│ [ Export for Reimbursement → ]                          │
└─────────────────────────────────────────────────────────┘
```

---

## 7. Constraints

1. **Implementation is deferred** — schema exists, but billing/charging is not active.
2. **Cost profiles are estimates** — actual costs measured and updated monthly.
3. **No member-facing pricing** — members never see tool costs. Only cluster/platform admins do.
4. **No protocol disclosure** — members never know why a tool is gated or priced.
5. **Phase 0 does not implement** — economy layer is main-product, post-MVP.
6. **Free tier must be functional** — basic tools must work without payment.
