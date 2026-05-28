# Tool Proposal: [tool_name]

> **Copy this template for every new tool proposal.**
> **Filename convention:** `[cluster_id]_[tool_name].md`
> **Folder:** `maintenance/[YYYY-MM]/`

---

## Proposal Header

| Field | Value |
|---|---|
| **Tool Name** | `fetch_example_data` |
| **Proposed By** | [Agent name] (for [Target Agent]) |
| **Cluster** | [Cluster name] — [cluster_id] |
| **Target Agent** | [Clio / Sage / Scout / Atlas / Observer] |
| **Date Proposed** | YYYY-MM-DD |
| **Observer Finding Ref** | [finding_id if triggered by Observer, or "Admin request" / "Quarterly review"] |
| **Status** | `pending_review` |

---

## Why This Tool Is Needed

*Describe the specific gap this tool addresses. Be concrete:*
- *What is the agent currently failing to do for this cluster?*
- *What signals or data is it missing?*
- *What evidence supports the need? (Observer finding, member posts, synthesis rate, etc.)*

---

## What the Tool Does

*One clear paragraph describing the tool's function. Non-technical — admin should be able to understand this without engineering knowledge.*

---

## Trigger Condition

*When should Yantra activate this tool for this cluster?*

```
Example: when cluster AGGIL includes language: Telugu AND atlas_synthesis_rate > 15%
Example: when sage_arc_phase in ['C', 'D'] AND cluster_topic includes 'philosophy'
Example: always active for this cluster
```

---

## Input

```
- parameter_name: description and source
- parameter_name: description and source
```

---

## Output

```
- field_name: type — description
- field_name: type — description
```

---

## Implementation Notes

*Technical details for the engineer who will implement this:*
- Data source (URL, API, scrape target)
- Scraping approach (headless Chrome / API call / LLM inference only)
- robots.txt compliance notes
- Rate limiting considerations
- Translation or normalization needed?
- LLM op to use (from `routing_table.json`) if output needs processing

---

## Privacy & Safety Check

- [ ] No PII collected or stored
- [ ] Data source is public
- [ ] robots.txt respected
- [ ] Output is safe to pass to LLM context

---

## Admin Decision

| Field | Value |
|---|---|
| **Decision** | `pending` / `approved` / `rejected` |
| **Decided By** | [Admin name] |
| **Decision Date** | YYYY-MM-DD |
| **Assigned To** | [Engineer name or "unassigned"] |
| **Rejection Reason** | *(if rejected)* |
| **Activated Date** | *(once live)* |

---

## Notes / Revision History

*Any additional context, amendments, or follow-up notes.*

---

*Tool Proposal Template · v1.0 · Internal · 2026-05-04*
