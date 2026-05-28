# Maintenance — Tool Proposals & Audit Trail

> This folder contains all tool proposal documents for Aggilo agents, organized by month. It is the admin's working space for reviewing, approving, and tracking cluster-specific agent tool extensions.

---

## What Are Cluster Tools?

Agents (Clio, Sage, Scout, Atlas, Observer) have a fixed set of capabilities defined in their SOUL.md and AGENTS.md files. **Cluster tools** are runtime-callable extensions that give an agent access to additional data sources or functions, specific to a particular cluster's needs.

Tools do not change an agent's values, rules, or persona. They extend what the agent can **reach**.

**Examples:**
- Sage proposes that Atlas fetch from Telugu news sources for a Telugu-language cluster
- Clio proposes that Scout look for signals in niche academic forums for a research cluster
- Observer proposes that Clio use a waitlist lookup tool for a Premium cluster onboarding flow

---

## Who Proposes Tools?

Tool proposals always come from the **immediate superior** in the agent hierarchy — the agent that commissions the subordinate's work and experiences its gaps directly:

```
Platform Rules + Admin-designated LLM  →  proposes Observer tools
Observer (governed by Platform Rules)  →  proposes Clio tools
Clio                                   →  proposes Sage tools
Clio                                   →  proposes Scout tools  (Scout is Clio's assistant)
Sage                                   →  proposes Atlas tools
```

---

## Tool Proposal Lifecycle

```
1. Gap detected
   (Observer finding, agent failure pattern, admin observation, quarterly review)
       ↓
2. Admin approves "request tool analysis" in dashboard
       ↓
3. Superior agent runs analysis
   (using tool_proposal_analysis LLM op — see routing_table.json)
       ↓
4. MD proposal written to maintenance/[YYYY-MM]/
   (filename: [cluster_id]_[tool_name].md)
       ↓
5. Admin reviews proposal
       ↓
6. Admin approves → assigns engineer → implementation
       ↓
7. Tool activated for cluster
   (recorded in clusters/[cluster_name]/CLUSTER_TOOLS.md)
       ↓
8. Tool status updated in this folder (pending → approved/rejected)
```

---

## Folder Structure

```
maintenance/
├── README.md                         ← This file
├── templates/
│   └── TOOL_PROPOSAL_TEMPLATE.md     ← Copy this for every new proposal
└── [YYYY-MM]/
    ├── [cluster_id]_[tool_name].md   ← One file per proposal
    └── ...
```

---

## Admin Review Checklist

Before approving any tool proposal, verify:

- [ ] Does the tool extend reach, or does it change agent behavior/values? (Only reach extensions are valid tools)
- [ ] Is the proposed data source public and scrapable within robots.txt?
- [ ] Does the tool respect user privacy? (No PII collection)
- [ ] Is the trigger condition specific enough to avoid over-activation?
- [ ] Is the output schema well-defined and safe to pass to the LLM?
- [ ] Has an engineer been identified for implementation?

---

## Quarterly Maintenance Review

Every quarter, run a full sweep across all active clusters:

1. Review all tools activated in the past 3 months — are they still needed?
2. Review all Observer findings that proposed tool analyses — were they actioned?
3. Review Atlas synthesis mode rates — are content gap tools working?
4. Review Scout signal density — are Scout tools returning useful signals?
5. Update `clusters/[cluster_name]/CLUSTER_TOOLS.md` with any status changes

---

*Maintenance README · v1.0 · Internal · 2026-05-04*
