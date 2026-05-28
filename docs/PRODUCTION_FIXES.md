# Production Fixes — Patch v1.0

> **Patches YANTRA_BRIDGE_SPEC.md, sage/AGENTS.md, and atlas/AGENTS.md**
> *All 8 issues confirmed valid against the actual code. Severity ratings are honest.*

---

## Priority 1 — Code Bugs (will silently break production on day one)

---

### Fix 1.1 — HMAC Serialization Mismatch (Severity: CRITICAL)

**File:** `workers/base_worker.py`

**Confirmed bug:** `_sign_payload` serializes with `json.dumps(sort_keys=True)` but `_send_callback` transmits via `httpx`'s `json=payload` parameter, which uses its own serializer with no `sort_keys` guarantee. Laravel verifies against `$request->getContent()` — the raw transmitted bytes. The signed bytes and the transmitted bytes are different. **Every Clio callback returns 401. The platform cannot deliver a single response to a user.**

**Fix — replace both methods entirely:**

```python
def _send_callback(self, result, success: bool, error: str = None):
    import json, hmac, hashlib, os
    
    callback_url = self.job.get("callback_url")
    if not callback_url:
        return

    payload = {
        "job_id": self.job_id,
        "job_type": self.job_type,
        "success": success,
        "result": result,
        "error": error
    }

    # Serialize ONCE. Sign THAT serialization. Send THAT exact body.
    # Never use httpx json=payload after this — it re-serializes.
    body = json.dumps(payload, sort_keys=True, ensure_ascii=False).encode("utf-8")
    signature = hmac.new(
        os.environ["YANTRA_CALLBACK_SECRET"].encode(),
        body,
        hashlib.sha256
    ).hexdigest()

    try:
        with httpx.Client(timeout=5.0) as client:
            resp = client.post(
                callback_url,
                content=body,                          # raw bytes, not json=
                headers={
                    "Content-Type": "application/json",
                    "X-Yantra-Signature": signature
                }
            )
            resp.raise_for_status()
    except Exception as e:
        self.logger.error("Callback failed for job %s: %s", self.job_id, e)

# _sign_payload is now unused — _send_callback signs inline.
# Delete _sign_payload entirely to prevent future confusion.
```

**Laravel side — no change needed.** `$request->getContent()` already reads the raw body correctly. The bug was entirely on the Python side.

---

### Fix 1.2 — Rate Limiter Race Condition (Severity: CRITICAL)

**File:** `llm/rate_limiter.py`

**Confirmed bug:** The current `acquire()` does read → compute → write with no atomicity. Redis `pipeline()` batches commands but provides no optimistic locking. Two workers hitting NIM simultaneously both read the same token count, both see sufficient tokens, both proceed — consuming double quota. At 40 RPM NIM limit this produces rate limit errors that look like random LLM failures.

**Fix — replace `acquire()` with a Redis Lua script (atomic by design):**

```python
# llm/rate_limiter.py — full replacement

import redis
import time

ACQUIRE_SCRIPT = """
local key = KEYS[1]
local capacity = tonumber(ARGV[1])
local refill_rate = tonumber(ARGV[2])
local tokens_requested = tonumber(ARGV[3])
local now = tonumber(ARGV[4])

local data = redis.call('HMGET', key, 'tokens', 'last_refill')
local tokens = tonumber(data[1]) or capacity
local last_refill = tonumber(data[2]) or now

local elapsed_minutes = (now - last_refill) / 60.0
tokens = math.min(capacity, tokens + elapsed_minutes * refill_rate)

if tokens >= tokens_requested then
    redis.call('HMSET', key, 'tokens', tokens - tokens_requested, 'last_refill', now)
    return 1
else
    return 0
end
"""

class RateLimiter:
    BUCKET_CONFIGS = {
        "nvidia_nim": {"capacity": 40, "refill_per_minute": 40},
        "anthropic":  {"capacity": 5,  "refill_per_minute": 5},
        "groq":       {"capacity": 100, "refill_per_minute": 100},
    }

    def __init__(self, redis_client: redis.Redis):
        self.redis = redis_client
        self._script = redis_client.register_script(ACQUIRE_SCRIPT)

    def acquire(self, provider: str, tokens: int = 1, timeout_seconds: float = 25.0) -> bool:
        config = self.BUCKET_CONFIGS[provider]
        deadline = time.time() + timeout_seconds

        while time.time() < deadline:
            result = self._script(
                keys=[f"ratelimit:{provider}"],
                args=[
                    config["capacity"],
                    config["refill_per_minute"],
                    tokens,
                    time.time()
                ]
            )
            if result == 1:
                return True
            time.sleep(0.5)

        return False
```

**Why Lua is the right fix:** Redis executes Lua scripts atomically — no other command can interleave between the read and the write. This is the standard Redis pattern for token buckets and it eliminates the race entirely.

---

### Fix 1.3 — Delayed Queue Has No Processor (Severity: HIGH)

**File:** Missing component — `queue/delayed_processor.py`

**Confirmed bug:** Laravel writes delayed jobs to `yantra:delayed` (a Redis sorted set). The Yantra consumer only BLPOPs from the named queues (`high`, `medium`, `low`). No process ever reads the sorted set. Every job dispatched with `$delaySecs > 0` from Laravel sits in the sorted set permanently and is never executed. The `AtlasBriefOnJoin` 60-second delay (referenced in the original AGENTS.md) would be affected by this.

**Fix — add `queue/delayed_processor.py` and start it as a daemon thread:**

```python
# queue/delayed_processor.py

import redis
import json
import time
import logging

logger = logging.getLogger("Yantra.delayed")

def process_delayed_queue(redis_client: redis.Redis, shutdown_event):
    """
    Daemon thread. Moves jobs from the sorted set to active queues
    when their scheduled dispatch time arrives.
    Checks every second — low overhead, 1-second max delay.
    """
    while not shutdown_event.is_set():
        try:
            now = time.time()
            # zrangebyscore returns all jobs with score (timestamp) <= now
            due_jobs = redis_client.zrangebyscore("yantra:delayed", 0, now)

            for raw_job in due_jobs:
                try:
                    job = json.loads(raw_job)
                    priority = job.get("priority", "low")
                    queue = f"Yantra:{priority}"

                    # Atomic: push to queue and remove from sorted set together
                    pipe = redis_client.pipeline()
                    pipe.rpush(queue, raw_job)
                    pipe.zrem("yantra:delayed", raw_job)
                    pipe.execute()

                    logger.info("Dispatched delayed job %s to %s", 
                                job.get("job_id"), queue)
                except Exception as e:
                    logger.error("Failed to dispatch delayed job: %s", e)

        except redis.RedisError as e:
            logger.error("Redis error in delayed processor: %s", e)

        shutdown_event.wait(1.0)  # Check every second, respects shutdown signal
```

**Add to `main.py` startup:**

```python
import threading
from queue.delayed_processor import process_delayed_queue

shutdown_event = threading.Event()

delayed_thread = threading.Thread(
    target=process_delayed_queue,
    args=(redis_client, shutdown_event),
    daemon=True,
    name="delayed-processor"
)
delayed_thread.start()
```

---

## Priority 2 — Architecture Issues (will cause failures under load)

---

### Fix 2.1 — Single-Threaded Consumer (Severity: HIGH)

**File:** `queue/consumer.py`

**Confirmed bug:** `dispatch_job(job)` is called synchronously inside the BLPOP loop. A 28-second Atlas job blocks every Clio turn behind it in the queue. At any non-trivial user count this makes the platform unresponsive.

**Fix — thread pool per priority lane:**

```python
# queue/consumer.py — revised

from concurrent.futures import ThreadPoolExecutor
import redis
import logging

logger = logging.getLogger("yantra.consumer")

# Tune these after observing production patterns
POOL_SIZES = {
    "high":   6,   # Clio turns + Sage real-time events
    "medium": 4,   # Atlas briefs + Scout directed + welfare escalation
    "low":    2    # Observer + calibration jobs
}

def run_consumer(redis_client: redis.Redis, shutdown_event):
    pools = {
        priority: ThreadPoolExecutor(
            max_workers=size,
            thread_name_prefix=f"worker-{priority}"
        )
        for priority, size in POOL_SIZES.items()
    }

    queues_in_order = [f"Yantra:{p}" for p in ["high", "medium", "low"]]
    logger.info("Consumer started. Pool sizes: %s", POOL_SIZES)

    while not shutdown_event.is_set():
        try:
            result = redis_client.blpop(queues_in_order, timeout=5)
            if result is None:
                continue

            queue_name, raw_job = result
            job = parse_and_validate(raw_job)

            if job is None:
                send_to_dlq(redis_client, raw_job, reason="parse_failure")
                continue

            if is_expired(job):
                record_expiry(job)
                continue

            priority = job.get("priority", "low")
            pool = pools.get(priority, pools["low"])
            pool.submit(dispatch_job, job)   # Non-blocking — BLPOP loop continues immediately

        except redis.RedisError as e:
            logger.critical("Redis error: %s. Retrying in 5s.", e)
            shutdown_event.wait(5)

    logger.info("Shutdown signal received. Draining thread pools...")
    for pool in pools.values():
        pool.shutdown(wait=True)
    logger.info("Consumer shutdown complete.")
```

---

### Fix 2.2 — Welfare Escalation Has No Human Fallback (Severity: HIGH)

**File:** `sage/AGENTS.md` — Welfare Escalation Protocol section

**Confirmed gap:** Sage escalates to Clio via a job. On free tier, Clio has no persistent session and no push mechanism. If the affected user is not active, the escalation silently goes nowhere. For any vulnerable user this is unacceptable.

**Add to `cluster_welfare_escalations` table:**

```sql
ALTER TABLE cluster_welfare_escalations ADD COLUMN
  clio_engagement_attempted_at TIMESTAMP,
  clio_engagement_succeeded BOOLEAN DEFAULT false,
  escalated_to_human_at TIMESTAMP,
  human_moderator_id UUID REFERENCES admin_users(id) NULLABLE;
```

**Add new cron job `WelfareEscalationTimeoutCheck` — runs every 15 minutes, high lane:**

```
For each welfare escalation where:
  - clio_engagement_succeeded = false
  - escalated_at < NOW() - INTERVAL '30 minutes'
  - escalated_to_human_at IS NULL

Actions (all three, in order):
  1. Write Observer finding: severity = CRITICAL,
     domain = "safety",
     title = "Welfare escalation unresolved — human required"
  2. Send immediate admin notification (NOT the daily digest — immediate)
  3. SET escalated_to_human_at = NOW()
```

**Required before launch — define in writing:**
- Who is the human moderator? Name and contact method.
- What is their response protocol?
- What are their operating hours, and what happens outside those hours?
- Is there a second-on-call?

This decision cannot be deferred. The platform should not go live with users until these are answered.

---

### Fix 2.3 — Sage Context Isolation Not Enforced (Severity: HIGH)

**File:** `context/assembler.py` — SageContextAssembler (specification)

**Confirmed gap:** Documents specify cluster isolation but `assembler.py` has no enforcement mechanism. A context assembly bug under concurrent load could silently expose one cluster's data to another Sage instance.

**Required contract for `SageContextAssembler`:**

```python
class SageContextAssembler:
    def assemble(self, cluster_id: str, job_payload: dict) -> str:
        # Every fetch is parameterized by cluster_id
        cluster_data    = self._fetch_cluster(cluster_id)
        arc_history     = self._fetch_arc_history(cluster_id)
        atlas_cards     = self._fetch_atlas_cards(cluster_id)
        poll_data       = self._fetch_polls(cluster_id)
        member_patterns = self._fetch_engagement(cluster_id)

        assembled = self._build_prompt(
            cluster_data, arc_history, atlas_cards, poll_data, member_patterns
        )

        # Validation runs on every dispatch — not optional, not configurable
        self._validate_cluster_isolation(assembled, cluster_id)
        return assembled

    def _validate_cluster_isolation(self, prompt: str, expected_cluster_id: str):
        """
        Scan the assembled prompt for UUID-shaped strings that don't match
        the expected cluster. Any foreign cluster ID = data breach = hard stop.
        """
        import re
        UUID_PATTERN = r'[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}'
        found_uuids = set(re.findall(UUID_PATTERN, prompt, re.IGNORECASE))
        
        # Allowed: the cluster's own ID, user IDs within this cluster,
        # and job/card IDs that belong to this cluster's records.
        # Implementation: pre-fetch the set of all UUIDs legitimately
        # associated with this cluster from Supabase and pass as allowed_set.
        foreign = found_uuids - self._allowed_uuids(cluster_id)
        
        if foreign:
            raise ContextIsolationError(
                f"Cross-cluster contamination in Sage context for {expected_cluster_id}. "
                f"Foreign UUIDs: {foreign}"
            )
```

**Performance note:** Regex over ~3,000 tokens runs in under 1ms. The isolation check adds negligible latency. It runs on every Sage dispatch without exception.

---

### Fix 2.4 — SOUL_EXTRACT Substitution Logic Undefined (Severity: MEDIUM)

**File:** `context/assembler.py` — soul selection logic (specification)

**Confirmed gap:** SOUL_EXTRACT.md is documented as a last-resort fallback but no trigger logic exists anywhere.

**Add to `context/assembler.py`:**

```python
SOUL_FULL_TOKENS    = 3_200
SOUL_EXTRACT_TOKENS = 400
MODEL_CONTEXT_LIMIT = 128_000
RESPONSE_BUFFER     = 1_500   # Reserve for agent response

def select_soul_for_clio(remaining_budget: int) -> str:
    """
    Called only for Clio (Tier 0). All other agents use fixed tiered injection
    and never trigger SOUL_EXTRACT substitution.
    """
    if remaining_budget >= SOUL_FULL_TOKENS + 500:
        return load_full_soul()                # Normal path

    elif remaining_budget >= SOUL_EXTRACT_TOKENS + 500:
        logger.warning(
            "Context pressure: substituting SOUL_EXTRACT for full soul. "
            "Remaining budget: %d tokens. Check USER context size.", 
            remaining_budget
        )
        return load_soul_extract()             # Fallback path

    else:
        raise ContextBudgetExceededError(
            f"Insufficient context budget for soul extract. "
            f"Remaining: {remaining_budget} tokens. Job cannot proceed."
        )
```

**On `ContextBudgetExceededError`:** The job is not retried — retrying with the same context will hit the same wall. The error is written to the DLQ with reason `context_budget_exceeded`. An Observer finding is triggered (domain: agent_performance, severity: medium). Admin reviews whether the user's context has grown unexpectedly large.

---

## Priority 3 — Design Gaps (will cause product failures)

---

### Fix 3.1 — Arc Phase Regression Criteria Incomplete (Severity: MEDIUM)

**File:** `sage/AGENTS.md` — Arc Phase System section

**Confirmed gap:** Only C→B regression is specified. Three other regression paths are missing.

**Replace the regression paragraph with this complete table:**

| Regression | Trigger | Sage's Response | Observer notified? |
|------------|---------|-----------------|-------------------|
| **C → B** | Member attrition >30% in 14 days, OR sustained silence >14 days | Low-stakes re-entry prompt. Does not announce regression. | No |
| **D → C** | Member attrition >40% in 14 days, OR sustained silence >14 days after reaching Phase D | Reference to what the cluster has built together. Does not announce regression. | No |
| **E → D** | Members stop self-initiating; Sage detects 72h silence in a previously self-sustaining cluster | Sage resumes scheduled Atlas brief cadence. Treats as soft Phase D restart. | No |
| **Any → Collapse Risk** | Cluster drops below 3 active members AND founding user inactive >30 days | Sage sends one reengagement prompt. If no response in 7 days: flags to Observer only. | **Yes — medium severity** |

**Rules that apply to all regressions:**
- Log to `cluster_arc_history` with `transition_reason`
- Never announce regression to members — Sage's post does not reference the phase change
- Never regress more than one phase at a time — no A→E collapse in a single step
- `cluster_arc_history` regression entries include `triggered_by: "sage_assessment"` and the specific signal observed

---

### Fix 3.2 — Phase Transition Atlas Brief Variant Missing (Severity: MEDIUM)

**File:** `atlas/AGENTS.md` — Variant Values table

**Confirmed gap:** The `phase_transition` variant is missing. When Sage advances arc phase, the first Atlas brief after the transition should reflect the new phase's register — none of the existing variants do this.

**Add `phase_transition` to the variant table:**

| Variant | Used When | Behavior |
|---------|-----------|----------|
| `cold` | Arc Phase A, new cluster | Conservative, widely accessible topics |
| `warm` | Arc Phase B/C | Builds on existing discussion themes |
| `depth` | Arc Phase D | Research-grade, provokes genuine reflection |
| `reengagement` | 72h silence | One high-precision item referencing past activity |
| `synthesis_request` | Zero-card result after 3 rounds | Triggers Atlas synthesis mode |
| **`phase_transition`** | **Immediately after Sage advances arc phase** | **Content that anchors the new phase's register (see below)** |

**Phase transition content register by transition:**

| Transition | Atlas should surface |
|------------|---------------------|
| A → B | Content that surfaces genuine opinion or mild controversy — something the cluster can disagree about productively |
| B → C | Content that reflects or celebrates what this cluster has navigated — shared accomplishment, recognition of what's been built |
| C → D | The hardest question the cluster has been approaching but not quite reaching — the topic that keeps coming back, surfaced directly |
| D → E | A reflective prompt about what the cluster has become — not what it discusses, but what it is now |

**How it is triggered:**

```python
# In SageCalibrationJob / SageClusterEvent, immediately after arc phase advancement:
AtlasBriefFromSage.dispatch(
    cluster_id=cluster.id,
    variant="phase_transition",
    arc_phase_from=previous_phase,
    arc_phase_to=new_phase
)
```

The `phase_transition` brief is issued once per phase advancement. It is not a recurring variant. After it is fulfilled, the brief cadence returns to the standard variant for the new phase.

---

## Database Changes From This Patch

| Table | Change | Fix |
|-------|--------|-----|
| `cluster_welfare_escalations` | Add 4 columns | Fix 2.2 |
| `cluster_arc_history` | Add `triggered_by VARCHAR(32)` | Fix 3.1 |

New cron job required:

| Job | Cadence | Lane | Fix |
|-----|---------|------|-----|
| `WelfareEscalationTimeoutCheck` | Every 15 minutes | high | Fix 2.2 |

---

## Implementation Order for This Patch

Fix in this sequence — Priority 1 bugs first, they block everything:

1. **Fix 1.1** — HMAC serialization. Test with a real Clio turn end-to-end before touching anything else.
2. **Fix 1.2** — Rate limiter Lua script. Deploy before any load testing.
3. **Fix 1.3** — Delayed processor thread. Required before any job that uses `delaySecs`.
4. **Fix 2.1** — Thread pool consumer. Required before any multi-user testing.
5. **Fix 2.2** — Welfare human fallback. Required before platform goes live with any users.
6. **Fix 2.3** — Context isolation validation. Add to assembler before Sage is deployed.
7. **Fix 2.4** — SOUL_EXTRACT token budget logic. Add to assembler alongside Fix 2.3.
8. **Fix 3.1** — Complete arc regression table in SAGE_AGENTS.md.
9. **Fix 3.2** — Add `phase_transition` variant to ATLAS_AGENTS.md.

---

**Production Fixes Patch · v1.0 · Internal**
