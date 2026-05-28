# Yantra Bridge — Technical Specification

> **⚠️ DEPRECATED NAMING** — The term "Yantra" is retired. The patterns in this document are now implemented as Node.js services and BullMQ workers. See [`/architecture/system_implementation_prompt_part1.md`](file:///d:/Aggilo_Social/architecture/system_implementation_prompt_part1.md) for current implementation. This file is retained as a read-only legacy reference for routing and job dispatch patterns.

> **Laravel ↔ Python Agent Runtime · Inter-Service Communication**
> *This document specifies the complete technical contract between the Laravel API backend and the Python Yantra agent runtime. It covers queue consumption, job schema, result storage, error handling, rate limiting, and health monitoring.*

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│  Laravel API (PHP)                                               │
│  Auth · routing · business logic · job dispatch                 │
└──────────────────────┬────────────────────────────┬─────────────┘
                       │ Redis LPUSH                │ HTTP webhook
                       ▼                            ▼
┌──────────────────────────────┐    ┌───────────────────────────┐
│  Redis (3 priority queues)   │    │  Laravel callback handler │
│  high · medium · low         │    │  /api/yantra/result     │
└──────────┬───────────────────┘    └───────────────────────────┘
           │ BLPOP (blocking pop)                ▲
           ▼                                     │ HTTP POST
┌──────────────────────────────────────────────────────────────────┐
│  Yantra (Python FastAPI)                                        │
│                                                                   │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Clio worker │  │ Sage worker  │  │  Scout   │  │  Atlas   │   │
│  └──────┬──────┘  └──────┬──────┘  └────┬─────┘  └────┬─────┘   │
│         └────────────────┴──────────────┴──────────────┘         │
│                           │                                       │
│         ┌─────────────────┴──────────────────────┐               │
│         │         LLM Router                     │               │
│         │  routing_table.json (admin-managed)    │               │
│         └────────┬────────────────────┬──────────┘               │
│                  │                    │                           │
│     ┌────────────┴──────┐  ┌──────────┴──────────────┐           │
│     │  NVIDIA NIM       │  │  Groq / Llama 3           │           │
│     │  (Kimi K2.5)      │  │  (overflow · batch)       │           │
│     └───────────────────┘  └───────────────────────────┘          │
└──────────────────────────────────────────────────────────────────┘
                       │
                       │ direct write
                       ▼
              ┌─────────────────┐
              │   Supabase      │
              │  (results +     │
              │   agent state)  │
              └─────────────────┘
```

**Key design decisions:**

1. **Redis as the one-way dispatch bus.** Laravel pushes jobs; Yantra pops them. The queue is unidirectional — Laravel never polls for results.
2. **Supabase as the result store.** Yantra writes results directly to Supabase when a job completes. This eliminates a return trip through Redis and decouples result latency from job latency.
3. **Webhook for synchronous flows.** For job types where Laravel needs to respond to a user in real time (Clio chat turns), Yantra calls back to a Laravel webhook on completion. For async jobs (Atlas, Scout batch), no webhook — Laravel polls Supabase directly.
4. **No shared memory between services.** All agent state lives in Supabase. Yantra workers are stateless between job executions.

---

## Directory Structure

```
yantra/
├── main.py                      # FastAPI app + startup
├── config.py                    # Environment configuration
├── workers/
│   ├── base_worker.py           # Abstract base: context assembly, LLM dispatch, result write
│   ├── clio_worker.py           # Clio session turn worker
│   ├── sage_worker.py           # Sage cluster event worker
│   ├── scout_worker.py          # Scout outreach + discovery worker
│   ├── atlas_worker.py          # Atlas content brief worker
│   └── observer_worker.py       # Observer platform intelligence + tool analysis worker
├── queue/
│   ├── consumer.py              # Redis blocking pop consumer (3 priority lanes)
│   ├── dispatcher.py            # Job type → worker routing
│   └── dead_letter.py           # DLQ handler
├── context/
│   ├── assembler.py             # Builds agent system prompt from soul map + identity + user context
│   ├── soul_loader.py           # Loads correct soul tier per agent
│   ├── tool_loader.py           # Loads cluster-specific tools from Supabase at dispatch time
│   └── compressor.py           # USER.md compression when token budget exceeded
├── llm/
│   ├── router.py                # Reads routing_table.json, dispatches to correct provider
│   ├── rate_limiter.py          # Redis token-bucket rate limiter (shared NIM quota)
│   ├── providers/
│   │   ├── nvidia_nim.py        # Primary: Kimi K2.5 via NVIDIA NIM
│   │   ├── moonshot.py          # NIM fallback: Moonshot direct API
│   │   ├── groq.py              # Overflow + batch: Groq/Llama 3
│   │   └── anthropic.py        # High-stakes: Claude Opus 4.6
│   └── response_parser.py      # Normalize responses across providers
├── storage/
│   ├── supabase_client.py       # Singleton Supabase client
│   └── result_writer.py        # Typed result writers per job type
├── monitoring/
│   ├── health.py                # /health endpoint
│   ├── metrics.py               # Prometheus metrics
│   └── logger.py                # Structured JSON logging
├── routing_table.json           # Admin-managed LLM op routing (14 ops)
└── requirements.txt
```

---

## Job Schema

Every job placed on the Redis queue by Laravel conforms to this schema. The schema is validated by Yantra on dequeue — malformed jobs are routed to the DLQ immediately.

```json
{
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "job_type": "clio_turn",
  "priority": "high",
  "dispatched_at": "2026-03-25T14:30:00Z",
  "expires_at": "2026-03-25T14:30:30Z",
  "requires_callback": true,
  "callback_url": "https://api.aggilo.com/api/yantra/result/550e8400",
  "callback_secret": "sha256_hmac_of_job_id_plus_shared_secret",
  "retry_count": 0,
  "max_retries": 2,
  "soul_tier": 0,
  "payload": {}
}
```

### Job Type Registry

| `job_type` | Priority | TTL | Callback | Payload Schema |
|:---|:---|:---|:---|:---|
| `clio_turn` | high | 30s | required | `Clio TurnPayload` |
| `sage_cluster_event` | high | 30s | required | `SageEventPayload` |
| `atlas_brief` | medium | 30s | none | `AtlasBriefPayload` |
| `atlas_pulse_refresh` | low | 120s | none | `AtlasPulsePayload` |
| `scout_outreach` | medium | 60s | none | `ScoutOutreachPayload` |
| `scout_discovery` | low | 120s | none | `ScoutDiscoveryPayload` |
| `sage_reengagement` | medium | 45s | none | `SageReengagementPayload` |
| `observer_tool_analysis` | low | 120s | none | `ObserverToolAnalysisPayload` |
| `cli_tool_proposal` | medium | 60s | none | `CliToolProposalPayload` |
| `clio_tool_analysis` | low | 120s | none | `ClioToolAnalysisPayload` |
| `sage_tool_analysis` | low | 120s | none | `SageToolAnalysisPayload` |
| `observer_daily_digest` | low | 120s | none | `ObserverDigestPayload` |

### Payload Schemas

**`Clio TurnPayload`**
```json
{
  "user_id": "uuid",
  "session_id": "uuid",
  "message": "User's message text",
  "conversation_history": [
    {"role": "user", "content": "..."},
    {"role": "assistant", "content": "..."}
  ],
  "user_md_content": "Full USER.md content as string",
  "memory_md_content": "Full MEMORY.md content as string",
  "active_persona": "campus_18_24",
  "subscription_tier": "free"
}
```

**`AtlasBriefPayload`**
```json
{
  "cluster_id": "uuid",
  "brief_version": "1.0",
  "aggil_segment": {
    "age_range": [18, 24],
    "gender": "mixed",
    "geography": { "city": "Hyderabad", "area": "Gachibowli" },
    "interests": ["machine learning", "startup culture"],
    "languages": ["English", "Telugu"]
  },
  "cluster_purpose": "string",
  "cluster_arc_phase": "A",
  "existing_pulse_topics": [],
  "existing_post_titles": [],
  "freshness_threshold_hours": 48,
  "content_count_requested": 10,
  "variant": "cold"
}
```

**`ScoutInboundTrafficPayload`** *(replaces old outbound payload — see SPEC_ADDENDUM Section 1)*
```json
{
  "cluster_id": "uuid",
  "cluster_card_url": "https://aggilo.com/clusters/...",
  "observation_window_hours": 24,
  "signals_collected": [
    {
      "signal_type": "card_visit | link_click | share_event | referral_bounce",
      "source_context": "string",
      "occurred_at": "ISO8601",
      "visitor_cohort": "anonymous | registered_non_member | registered_member"
    }
  ],
  "visit_volume": 0,
  "click_through_rate": 0.0,
  "top_referrer_contexts": [],
  "report_type": "inbound_traffic_intelligence"
}
```
> Scout is read-only. It observes visit and traffic signals on Aggilo-hosted cluster cards and links. It does not post to, message, or interact with any external platform. The `target_platforms` and `founding_user_opt_in` fields from the old outbound model are permanently retired.

---

## Queue Consumer

The consumer runs as a long-lived process, not a web server. It uses Redis `BLPOP` (blocking pop) to wait for jobs without polling.

```python
# queue/consumer.py

import redis
import json
import logging
from typing import Optional
from .dispatcher import dispatch_job
from .dead_letter import send_to_dlq

QUEUES_IN_PRIORITY_ORDER = ["high", "medium", "low"]
BLOCK_TIMEOUT_SECONDS = 5  # Return from BLPOP after 5s even if empty (allows graceful shutdown check)

def run_consumer(redis_client: redis.Redis, shutdown_event):
    """
    Main consumer loop. Runs until shutdown_event is set.
    Polls queues in priority order using BLPOP.
    """
    logger = logging.getLogger("yantra.consumer")
    logger.info("Consumer started. Listening on queues: %s", QUEUES_IN_PRIORITY_ORDER)

    while not shutdown_event.is_set():
        try:
            # BLPOP blocks until a job arrives on any queue, checking high before medium before low
            result = redis_client.blpop(
                [f"Yantra:{q}" for q in QUEUES_IN_PRIORITY_ORDER],
                timeout=BLOCK_TIMEOUT_SECONDS
            )

            if result is None:
                continue  # Timeout — check shutdown_event, then loop

            queue_name, raw_job = result
            job = parse_and_validate(raw_job)

            if job is None:
                logger.error("Malformed job received. Routing to DLQ.")
                send_to_dlq(redis_client, raw_job, reason="parse_failure")
                continue

            if is_expired(job):
                logger.warning("Job %s expired before processing. Discarding.", job["job_id"])
                record_expiry(job)
                continue

            dispatch_job(job)

        except redis.RedisError as e:
            logger.critical("Redis connection error: %s. Retrying in 5s.", e)
            shutdown_event.wait(5)

    logger.info("Consumer shutdown complete.")


def parse_and_validate(raw: bytes) -> Optional[dict]:
    try:
        job = json.loads(raw)
        assert "job_id" in job
        assert "job_type" in job
        assert "payload" in job
        return job
    except (json.JSONDecodeError, AssertionError, KeyError):
        return None
```

### Worker Dispatch

```python
# queue/dispatcher.py

from workers.clio_worker import ClioWorker
from workers.atlas_worker import AtlasWorker
from workers.scout_worker import ScoutWorker
from workers.sage_worker import SageWorker
from workers.observer_worker import ObserverWorker

WORKER_MAP = {
    "clio_turn": ClioWorker,
    "sage_cluster_event": SageWorker,
    "sage_reengagement": SageWorker,
    "atlas_brief": AtlasWorker,
    "atlas_pulse_refresh": AtlasWorker,
    "scout_outreach": ScoutWorker,
    "scout_discovery": ScoutWorker,
    # Tool system + Observer jobs
    "observer_tool_analysis": ObserverWorker,
    "observer_daily_digest": ObserverWorker,
    "cli_tool_proposal": ObserverWorker,
    "clio_tool_analysis": ClioWorker,
    "sage_tool_analysis": SageWorker,
}

def dispatch_job(job: dict):
    job_type = job["job_type"]
    worker_class = WORKER_MAP.get(job_type)

    if worker_class is None:
        raise ValueError(f"Unknown job type: {job_type}")

    worker = worker_class(job)
    worker.execute()  # Handles its own error catching, result writing, and callback
```

---

## Base Worker

All four agent workers inherit from `BaseWorker`. The base handles: context assembly, LLM dispatch via router, result writing to Supabase, callback to Laravel, retry logic, and timeout enforcement.

```python
# workers/base_worker.py

import asyncio
import time
import logging
from abc import ABC, abstractmethod
from context.assembler import ContextAssembler
from llm.router import LLMRouter
from storage.result_writer import ResultWriter
from monitoring.metrics import record_job_metric
import httpx

class BaseWorker(ABC):
    def __init__(self, job: dict):
        self.job = job
        self.job_id = job["job_id"]
        self.job_type = job["job_type"]
        self.payload = job["payload"]
        self.ttl = self._ttl_from_job(job)
        self.logger = logging.getLogger(f"Yantra.{self.job_type}")
        self.router = LLMRouter()
        self.result_writer = ResultWriter()

    def execute(self):
        """Entry point. Enforces TTL, catches all exceptions, triggers callback."""
        start = time.time()
        try:
            result = self._run_with_timeout()
            self._write_result(result)
            if self.job.get("requires_callback"):
                self._send_callback(result, success=True)
            record_job_metric(self.job_type, "success", time.time() - start)

        except TimeoutError:
            self.logger.error("Job %s timed out after %ss.", self.job_id, self.ttl)
            self._write_error("timeout")
            if self.job.get("requires_callback"):
                self._send_callback(None, success=False, error="timeout")
            record_job_metric(self.job_type, "timeout", time.time() - start)

        except Exception as e:
            self.logger.exception("Job %s failed: %s", self.job_id, e)
            retry_count = self.job.get("retry_count", 0)
            max_retries = self.job.get("max_retries", 2)

            if retry_count < max_retries:
                self._requeue_with_increment()
            else:
                self._write_error(str(e))
                if self.job.get("requires_callback"):
                    self._send_callback(None, success=False, error=str(e))
                record_job_metric(self.job_type, "failed", time.time() - start)

    def _run_with_timeout(self):
        """Run execute_job() with TTL enforcement."""
        return asyncio.run(
            asyncio.wait_for(self.execute_job(), timeout=self.ttl)
        )

    @abstractmethod
    async def execute_job(self) -> dict:
        """Subclasses implement this. Returns the result dict."""
        pass

    def _send_callback(self, result, success: bool, error: str = None):
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

        try:
            with httpx.Client(timeout=5.0) as client:
                resp = client.post(
                    callback_url,
                    json=payload,
                    headers={"X-Yantra-Signature": self._sign_payload(payload)}
                )
                resp.raise_for_status()
        except Exception as e:
            self.logger.error("Callback failed for job %s: %s", self.job_id, e)
            # Callback failure does not fail the job — result is already in Supabase

    def _sign_payload(self, payload: dict) -> str:
        import hashlib, hmac, json, os
        secret = os.environ["YANTRA_CALLBACK_SECRET"].encode()
        body = json.dumps(payload, sort_keys=True).encode()
        return hmac.new(secret, body, hashlib.sha256).hexdigest()

    def _ttl_from_job(self, job: dict) -> float:
        from datetime import datetime, timezone
        expires_at = job.get("expires_at")
        if not expires_at:
            return 30.0
        expiry = datetime.fromisoformat(expires_at.replace("Z", "+00:00"))
        now = datetime.now(timezone.utc)
        remaining = (expiry - now).total_seconds()
        return max(remaining, 5.0)  # Always give at least 5s
```

---

## LLM Router

The routing table is a JSON file edited by admins. It maps each of the 14 defined ops to a primary provider, fallback provider, and routing parameters.

```json
{
  "routing_table_version": "1.0",
  "ops": [
    {
      "op_id": "clio_onboarding_turn",
      "description": "Clio's first 3 turns with a new user — highest quality required",
      "primary": "anthropic_claude",
      "fallback": "nvidia_nim_kimi",
      "max_tokens": 600,
      "temperature": 0.7,
      "quality_tier": "high_stakes"
    },
    {
      "op_id": "clio_standard_turn",
      "description": "Standard Clio chat turn",
      "primary": "nvidia_nim_kimi",
      "fallback": "moonshot_direct",
      "max_tokens": 500,
      "temperature": 0.7,
      "quality_tier": "high_volume"
    },
    {
      "op_id": "clio_connection_introduction",
      "description": "Clio introduces two users — requires nuanced, high-quality output",
      "primary": "anthropic_claude",
      "fallback": "nvidia_nim_kimi",
      "max_tokens": 400,
      "temperature": 0.6,
      "quality_tier": "high_stakes"
    },
    {
      "op_id": "sage_arc_transition",
      "description": "Sage facilitates a cluster arc phase transition",
      "primary": "nvidia_nim_kimi",
      "fallback": "moonshot_direct",
      "max_tokens": 500,
      "temperature": 0.65,
      "quality_tier": "high_volume"
    },
    {
      "op_id": "sage_conflict_intervention",
      "description": "Sage intervenes in a cluster values conflict",
      "primary": "anthropic_claude",
      "fallback": "nvidia_nim_kimi",
      "max_tokens": 400,
      "temperature": 0.6,
      "quality_tier": "high_stakes"
    },
    {
      "op_id": "sage_standard_post",
      "description": "Sage posts to cluster Pulse tab",
      "primary": "nvidia_nim_kimi",
      "fallback": "groq_llama3",
      "max_tokens": 300,
      "temperature": 0.7,
      "quality_tier": "high_volume"
    },
    {
      "op_id": "atlas_hook_generation",
      "description": "Atlas generates conversation hook per content card",
      "primary": "nvidia_nim_kimi",
      "fallback": "groq_llama3",
      "max_tokens": 256,
      "temperature": 0.3,
      "quality_tier": "high_volume"
    },
    {
      "op_id": "atlas_relevance_scoring",
      "description": "Atlas scores content relevance against AGGIL segment",
      "primary": "groq_llama3",
      "fallback": "groq_llama3",
      "max_tokens": 64,
      "temperature": 0.1,
      "quality_tier": "batch"
    },
    {
      "op_id": "scout_community_read",
      "description": "Scout reads 20+ posts from a target community to calibrate register",
      "primary": "groq_llama3",
      "fallback": "nvidia_nim_kimi",
      "max_tokens": 500,
      "temperature": 0.2,
      "quality_tier": "batch"
    },
    {
      "op_id": "scout_placement_write",
      "description": "Scout generates contextual placement message for a community",
      "primary": "nvidia_nim_kimi",
      "fallback": "moonshot_direct",
      "max_tokens": 400,
      "temperature": 0.5,
      "quality_tier": "high_volume"
    },
    {
      "op_id": "user_md_compression",
      "description": "Compress USER.md interaction history after 90 days",
      "primary": "nvidia_nim_kimi",
      "fallback": "groq_llama3",
      "max_tokens": 600,
      "temperature": 0.3,
      "quality_tier": "batch"
    },
    {
      "op_id": "cluster_health_score",
      "description": "Daily cluster health scoring job",
      "primary": "groq_llama3",
      "fallback": null,
      "max_tokens": 200,
      "temperature": 0.1,
      "quality_tier": "batch"
    },
    {
      "op_id": "tool_proposal_analysis",
      "description": "Superior agent analyzes gaps and proposes tools for its subordinate agent — high reasoning task",
      "primary": "anthropic_claude",
      "fallback": "nvidia_nim_kimi",
      "max_tokens": 800,
      "temperature": 0.4,
      "quality_tier": "high_stakes",
      "_note": "Used when: Sage proposes Atlas tools, Clio proposes Sage/Scout tools, Observer proposes Clio tools"
    },
    {
      "op_id": "pre_check_structured",
      "description": "Lightweight structured pre-check — radical shift gate, scope preservation, PII scan",
      "primary": "groq_llama3",
      "fallback": "groq_llama3",
      "max_tokens": 128,
      "temperature": 0.1,
      "quality_tier": "batch",
      "_note": "Returns structured boolean + reason. Fast and cheap — must not block real-time flows."
    }
  ]
}
```

### Provider Implementation Pattern

```python
# llm/providers/nvidia_nim.py

import os
import httpx
from .base_provider import BaseProvider

class NvidiaNimProvider(BaseProvider):
    BASE_URL = "https://integrate.api.nvidia.com/v1"
    FALLBACK_URL = "https://api.moonshot.ai/v1"

    async def complete(self, messages: list, op_config: dict) -> str:
        headers = {"Authorization": f"Bearer {os.environ['NVIDIA_NIM_API_KEY']}"}
        body = {
            "model": "moonshot/kimi-k2-5",
            "messages": messages,
            "max_tokens": op_config["max_tokens"],
            "temperature": op_config["temperature"]
        }

        async with httpx.AsyncClient(timeout=25.0) as client:
            try:
                resp = await client.post(
                    f"{self.BASE_URL}/chat/completions",
                    json=body,
                    headers=headers
                )
                resp.raise_for_status()
                return resp.json()["choices"][0]["message"]["content"]

            except (httpx.HTTPStatusError, httpx.TimeoutException) as e:
                # NIM failed — escalate to fallback
                self.logger.warning("NIM call failed: %s. Using Moonshot fallback.", e)
                return await self._fallback_complete(messages, op_config)

    async def _fallback_complete(self, messages, op_config) -> str:
        headers = {"Authorization": f"Bearer {os.environ['MOONSHOT_API_KEY']}"}
        body = {
            "model": "moonshot-v1-8k",
            "messages": messages,
            "max_tokens": op_config["max_tokens"],
            "temperature": op_config["temperature"]
        }
        async with httpx.AsyncClient(timeout=20.0) as client:
            resp = await client.post(
                f"{self.FALLBACK_URL}/chat/completions",
                json=body,
                headers=headers
            )
            resp.raise_for_status()
            return resp.json()["choices"][0]["message"]["content"]
```

---

## Rate Limiter

Atlas hook generation and Clio turns share the NIM quota. Rate limiting is enforced using a Redis token bucket — atomic, shared across all workers.

```python
# llm/rate_limiter.py

import redis
import time

class RateLimiter:
    """
    Token bucket rate limiter backed by Redis.
    Shared across all workers consuming the same provider quota.
    """

    BUCKET_CONFIGS = {
        "nvidia_nim":    {"capacity": 40, "refill_per_minute": 40},
        "anthropic":     {"capacity": 5,  "refill_per_minute": 5},
        "groq":          {"capacity": 100, "refill_per_minute": 100},
    }

    def __init__(self, redis_client: redis.Redis):
        self.redis = redis_client

    def acquire(self, provider: str, tokens: int = 1, timeout_seconds: float = 25.0) -> bool:
        """
        Attempt to acquire `tokens` from `provider`'s bucket.
        Blocks up to timeout_seconds. Returns True if acquired, False if timed out.
        """
        config = self.BUCKET_CONFIGS[provider]
        bucket_key = f"ratelimit:{provider}:tokens"
        last_refill_key = f"ratelimit:{provider}:last_refill"
        deadline = time.time() + timeout_seconds

        while time.time() < deadline:
            current = float(self.redis.get(bucket_key) or config["capacity"])
            last_refill = float(self.redis.get(last_refill_key) or time.time())
            now = time.time()

            # Refill tokens based on elapsed time
            elapsed_minutes = (now - last_refill) / 60.0
            refilled = min(
                config["capacity"],
                current + elapsed_minutes * config["refill_per_minute"]
            )

            if refilled >= tokens:
                # Atomically set new token count and last refill time
                pipe = self.redis.pipeline()
                pipe.set(bucket_key, refilled - tokens)
                pipe.set(last_refill_key, now)
                pipe.execute()
                return True

            # Not enough tokens — wait proportionally
            wait = (tokens - refilled) / config["refill_per_minute"] * 60
            time.sleep(min(wait, 1.0))

        return False  # Timed out waiting for tokens
```

---

## Cluster Tool Loader

`context/tool_loader.py` is responsible for loading cluster-specific tools from the `cluster_tools` Supabase table at job dispatch time. This is the final step of context assembly — after soul injection, user context, and skill loading.

### Why This Exists

Agents have **skills** (static capability descriptions) but not **tools** (runtime-callable functions) by default. A Telugu-language cluster needs Atlas to pull from Eenadu. A Female Founders cluster needs Scout to scan startup job boards. Static prompting cannot serve this diversity — cluster-specific tools can.

Tools do not change an agent's values, rules, or persona. They extend what the agent can **reach** for a specific cluster.

### Interface

```python
# context/tool_loader.py

import logging
from typing import List, Optional
from dataclasses import dataclass
from storage.supabase_client import get_supabase_client

logger = logging.getLogger("yantra.tool_loader")


@dataclass
class ClusterTool:
    """Represents an active tool loaded for a cluster."""
    tool_id: str
    tool_name: str
    agent: str              # atlas, sage, scout, clio
    tool_type: str          # data_source, api_connector, scraper, structured_fetch
    endpoint_or_config: dict  # Tool-specific configuration (URL, API keys ref, scrape rules)
    parameters: dict        # Default parameters for this tool
    activated_at: str       # ISO8601 timestamp


def load_cluster_tools(cluster_id: str, agent: str) -> List[ClusterTool]:
    """
    Load active tools for a given cluster and agent.
    
    Called by context/assembler.py as the final assembly step.
    Returns an empty list on any error (graceful degradation).
    
    Args:
        cluster_id: UUID of the cluster this job is for
        agent: Which agent is running (filters tools to only this agent's tools)
    
    Returns:
        List of ClusterTool objects, empty if none or on error
    """
    try:
        client = get_supabase_client()
        result = client.table("cluster_tools") \
            .select("*") \
            .eq("cluster_id", cluster_id) \
            .eq("agent", agent) \
            .eq("status", "active") \
            .is_("retired_at", "null") \
            .execute()

        if not result.data:
            return []

        tools = []
        for row in result.data:
            tools.append(ClusterTool(
                tool_id=row["id"],
                tool_name=row["tool_name"],
                agent=row["agent"],
                tool_type=row["tool_type"],
                endpoint_or_config=row["endpoint_or_config"],
                parameters=row.get("parameters", {}),
                activated_at=row["activated_at"],
            ))

        logger.info(
            "Loaded %d active tools for cluster=%s agent=%s",
            len(tools), cluster_id, agent
        )
        return tools

    except Exception as e:
        logger.warning(
            "Failed to load cluster tools for cluster=%s agent=%s: %s. "
            "Proceeding with zero tools (graceful degradation).",
            cluster_id, agent, e
        )
        return []


def format_tools_for_context(tools: List[ClusterTool]) -> str:
    """
    Format loaded tools as a human-readable context block for injection
    into the agent's system prompt.
    
    Returns empty string if no tools are loaded.
    """
    if not tools:
        return ""

    lines = ["## Active Cluster Tools\n"]
    for tool in tools:
        lines.append(f"### {tool.tool_name}")
        lines.append(f"- **Type:** {tool.tool_type}")
        lines.append(f"- **Active since:** {tool.activated_at}")
        if tool.parameters:
            lines.append(f"- **Default parameters:** {tool.parameters}")
        lines.append(f"- **Configuration:** {tool.endpoint_or_config}")
        lines.append("")

    return "\n".join(lines)
```

### Integration with Context Assembler

```python
# In context/assembler.py — final step of context assembly

from context.tool_loader import load_cluster_tools, format_tools_for_context

def assemble_context(job: dict) -> str:
    """Build the complete agent system prompt."""
    parts = []
    
    # ... existing assembly steps (soul, identity, user context, skills) ...
    
    # Step: Load cluster tools (final step)
    cluster_id = job["payload"].get("cluster_id")
    agent_name = _agent_name_from_job_type(job["job_type"])
    
    if cluster_id and agent_name:
        tools = load_cluster_tools(cluster_id, agent_name)
        tool_context = format_tools_for_context(tools)
        if tool_context:
            parts.append(tool_context)
    
    return "\n\n".join(parts)
```

### Graceful Degradation

If `load_cluster_tools` fails for any reason (Supabase timeout, network error, table not found), the worker proceeds with **zero cluster tools**. The agent operates with its default capabilities. This is logged as a warning, not an error — the job should never fail because tool loading failed.

---

## Tool Analysis Payload Schemas

These payload schemas define the structure of tool-related jobs dispatched via Redis.

### `ObserverToolAnalysisPayload`

Dispatched when Observer Domain 10 identifies an agent capability gap requiring tool analysis.

```json
{
  "analysis_trigger": "domain_finding | quarterly_sweep",
  "source_finding_id": "uuid — reference to observer_findings record that triggered this",
  "source_domain": "content_gaps | agent_performance | underserved_demographics",
  "target_agent": "clio | sage | scout | atlas",
  "cluster_ids": ["uuid"],
  "gap_summary": "Brief description of the identified gap",
  "supporting_data": {
    "synthesis_rate_pct": 34,
    "consecutive_synthesis_count": 8,
    "zero_match_rate_pct": null,
    "relevant_findings_count": 3
  }
}
```

### `CliToolProposalPayload`

Dispatched when Observer drafts a Clio tool proposal directly (Observer is Clio's immediate superior for tool proposals).

```json
{
  "source_finding_id": "uuid — observer_findings record",
  "target_agent": "clio",
  "cluster_id": "uuid | null — null for platform-wide tools",
  "gap_analysis": {
    "gap_type": "missing_capability | data_source_gap | workflow_gap",
    "gap_description": "Clio lacks ability to query premium cluster waitlists for new member matches",
    "evidence": "47 users in segment with zero cluster matches; waitlist exists but is unreachable"
  },
  "platform_rules_context": "Relevant platform rules excerpt for Clio's domain",
  "proposal_output_path": "maintenance/2026-05/[cluster_id]_[tool_name].md"
}
```

### `ClioToolAnalysisPayload`

Dispatched when admin approves Clio to analyze and propose tools for Sage or Scout.

```json
{
  "source_finding_id": "uuid — observer_findings record",
  "target_agent": "sage | scout",
  "cluster_id": "uuid",
  "cluster_aggil": {
    "age_range": [18, 24],
    "gender": "mixed",
    "geography": {"city": "Hyderabad", "area": "Gachibowli"},
    "interests": ["machine learning", "startup culture"],
    "languages": ["English", "Telugu"]
  },
  "cluster_arc_phase": "C",
  "agent_performance_data": {
    "sage_synthesis_rate_pct": null,
    "sage_intervention_count_30d": null,
    "scout_confidence_avg_30d": 0.62,
    "scout_inference_only_pct": 45
  },
  "proposal_output_path": "maintenance/2026-05/[cluster_id]_[tool_name].md"
}
```

### `SageToolAnalysisPayload`

Dispatched when admin approves Sage to analyze and propose tools for Atlas.

```json
{
  "source_finding_id": "uuid — observer_findings record",
  "target_agent": "atlas",
  "cluster_id": "uuid",
  "cluster_aggil": {
    "age_range": [25, 32],
    "gender": "female",
    "geography": {"city": "Hyderabad"},
    "interests": ["philosophy", "Telugu literature"],
    "languages": ["Telugu", "English"]
  },
  "cluster_arc_phase": "B",
  "atlas_performance_data": {
    "synthesis_rate_pct": 34,
    "consecutive_synthesis_count": 8,
    "synthesis_reasons": ["No Telugu-language sources in source list"],
    "last_3_refinement_rounds": [],
    "current_source_list": ["Google News India", "YourStory"]
  },
  "proposal_output_path": "maintenance/2026-05/[cluster_id]_[tool_name].md"
}
```

### `ObserverDigestPayload`

Dispatched daily to aggregate findings into admin notification.

```json
{
  "digest_window_hours": 24,
  "include_domains": ["all"],
  "severity_filter": "all",
  "format": "email | dashboard_push"
}
```

---

## Observer Worker

`workers/observer_worker.py` handles all Observer-related job types: domain observation jobs, tool analysis triggers, Clio tool proposal drafting, and daily digest aggregation.

### Job Types Handled

| Job Type | What It Does |
|---|---|
| `observer_tool_analysis` | Reads Domain 10 signals, identifies which agent needs tool analysis, surfaces trigger to admin or drafts Clio proposal directly |
| `cli_tool_proposal` | Observer drafts a Clio tool proposal using `tool_proposal_analysis` LLM op and writes it to `maintenance/` |
| `observer_daily_digest` | Aggregates past 24h findings into structured digest for admin |

> [!NOTE]
> The 9 domain observation jobs (`ObserverClusterHealth`, `ObserverGrowthRetention`, etc.) are scheduled via cron and dispatched as standard Observer jobs. Their cadences are defined in `Observer/AGGILO_OBSERVER_AGENTS.md`. The observer_worker handles all of these — the specific domain is determined by the job payload.

### Context Assembly

Observer is unique: it has **no soul injection** (no persona tier) and **no user context**. Its context is assembled from:

1. Platform Rules (`AGGILO_PLATFORM_RULES.md`) — governs what Observer may propose
2. Domain-specific data from Supabase — varies by which domain is being analyzed
3. Previous findings — for deduplication (see SPEC_ADDENDUM §4 finding signatures)

### Tool Proposal Flow

When `observer_tool_analysis` identifies a gap:

```
Observer reads Domain 10 signals
    ↓
Is the gap in Clio's capabilities?
    ├── YES → Observer drafts proposal directly
    │         → Uses tool_proposal_analysis LLM op (Claude primary)
    │         → Writes MD file to maintenance/[YYYY-MM]/
    │         → Records in tool_proposals table (status: pending)
    │         → Surfaces to admin dashboard for approval
    │
    └── NO → Observer surfaces finding to admin
             → Admin approves trigger
             → Appropriate superior agent job dispatched:
                 Sage gap → clio_tool_analysis job
                 Scout gap → clio_tool_analysis job
                 Atlas gap → sage_tool_analysis job
```

### Proposal Output

All tool proposals are written as human-readable markdown files using the standard template at `maintenance/templates/TOOL_PROPOSAL_TEMPLATE.md`. The proposal is also recorded in the `tool_proposals` database table for tracking.

---

## Tool Management Database Schema

Two new tables support the cluster tools and tool proposal system. These are in addition to the `observer_findings` table already specified in `Observer/AGGILO_OBSERVER_AGENTS.md`.

### `cluster_tools` — Active Tools Per Cluster

Loaded by `context/tool_loader.py` at job dispatch time.

```sql
CREATE TABLE cluster_tools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cluster_id UUID NOT NULL REFERENCES clusters(id),
    agent VARCHAR(32) NOT NULL,                   -- atlas, sage, scout, clio
    tool_name VARCHAR(128) NOT NULL,
    tool_type VARCHAR(64) NOT NULL,               -- data_source, api_connector, scraper, structured_fetch
    endpoint_or_config JSONB NOT NULL,            -- Tool-specific configuration
    parameters JSONB DEFAULT '{}',                -- Default parameters for this tool
    proposal_id UUID REFERENCES tool_proposals(id),  -- Which proposal led to this tool
    activated_at TIMESTAMP NOT NULL,
    retired_at TIMESTAMP,
    status VARCHAR(16) NOT NULL DEFAULT 'active', -- active, retired
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT valid_agent CHECK (agent IN ('atlas', 'sage', 'scout', 'clio')),
    CONSTRAINT valid_status CHECK (status IN ('active', 'retired')),
    CONSTRAINT valid_tool_type CHECK (tool_type IN ('data_source', 'api_connector', 'scraper', 'structured_fetch'))
);

-- Index for the primary query pattern (tool_loader.py)
CREATE INDEX idx_cluster_tools_active
    ON cluster_tools (cluster_id, agent, status)
    WHERE status = 'active' AND retired_at IS NULL;
```

### `tool_proposals` — Proposal Audit Trail

Tracks all proposals through their lifecycle: pending → approved → active → retired (or rejected).

```sql
CREATE TABLE tool_proposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proposed_by_agent VARCHAR(32) NOT NULL,       -- observer, clio, sage
    target_agent VARCHAR(32) NOT NULL,            -- clio, sage, scout, atlas
    cluster_id UUID REFERENCES clusters(id),      -- NULL = platform-wide tool
    tool_name VARCHAR(128) NOT NULL,
    proposal_doc_path TEXT NOT NULL,               -- Path in maintenance/ folder
    source_finding_id UUID REFERENCES observer_findings(id),  -- Observer finding that triggered this
    status VARCHAR(16) NOT NULL DEFAULT 'pending', -- pending, approved, rejected, active, retired
    admin_decision_at TIMESTAMP,
    admin_decision_by UUID,                        -- Admin user who decided
    admin_notes TEXT,                               -- Approval/rejection notes
    activated_at TIMESTAMP,                        -- When the tool was deployed and activated
    retired_at TIMESTAMP,                          -- When the tool was decommissioned
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT valid_proposer CHECK (proposed_by_agent IN ('observer', 'clio', 'sage')),
    CONSTRAINT valid_target CHECK (target_agent IN ('clio', 'sage', 'scout', 'atlas')),
    CONSTRAINT valid_proposal_status CHECK (status IN ('pending', 'approved', 'rejected', 'active', 'retired'))
);

-- Index for dashboard queries
CREATE INDEX idx_tool_proposals_status ON tool_proposals (status);
CREATE INDEX idx_tool_proposals_cluster ON tool_proposals (cluster_id) WHERE cluster_id IS NOT NULL;
```

### Tool Lifecycle State Machine

```
pending → approved → active → retired
    │         │
    └→ rejected (terminal)
```

- **pending**: Proposal written, awaiting admin review
- **approved**: Admin approved, awaiting engineer implementation
- **rejected**: Admin rejected with notes (terminal state)
- **active**: Tool implemented, tested, and loaded by `tool_loader.py` at dispatch time
- **retired**: Tool decommissioned (cluster needs changed, tool obsolete)

---

## Health & Monitoring

```python
# main.py (FastAPI app)

from fastapi import FastAPI
from monitoring.health import router as health_router
import redis
import os

app = FastAPI(title="Yantra", version="1.0")
app.include_router(health_router, prefix="/health")

@app.on_event("startup")
async def startup():
    # Verify Redis connection
    r = redis.from_url(os.environ["REDIS_URL"])
    r.ping()
    # Verify Supabase connection
    # Start consumer threads / workers
```

```python
# monitoring/health.py

from fastapi import APIRouter
import redis, os

router = APIRouter()

@router.get("")
async def health():
    checks = {}

    try:
        r = redis.from_url(os.environ["REDIS_URL"])
        r.ping()
        checks["redis"] = "ok"
        checks["queue_depths"] = {
            "high":   r.llen("yantra:high"),
            "medium": r.llen("yantra:medium"),
            "low":    r.llen("yantra:low"),
        }
    except Exception as e:
        checks["redis"] = f"error: {e}"

    checks["status"] = "ok" if all(v == "ok" or isinstance(v, dict) for v in checks.values()) else "degraded"
    return checks
```

---

## Laravel Dispatch Interface

Laravel dispatches jobs to Yantra via a service class that encapsulates all queue interaction.

```php
<?php
// app/Services/YantraDispatcher.php

namespace App\Services;

use Illuminate\Support\Str;
use Illuminate\Support\Facades\Redis;
use Carbon\Carbon;

class YantraDispatcher
{
    private static array $TTL_MAP = [
        'clio_turn'               => 30,
        'sage_cluster_event'      => 30,
        'atlas_brief'             => 30,
        'atlas_pulse_refresh'     => 120,
        'scout_outreach'          => 60,
        'scout_discovery'         => 120,
        'sage_reengagement'       => 45,
        // Tool system + Observer jobs
        'observer_tool_analysis'  => 120,
        'cli_tool_proposal'       => 60,
        'clio_tool_analysis'      => 120,
        'sage_tool_analysis'      => 120,
        'observer_daily_digest'   => 120,
    ];

    private static array $PRIORITY_MAP = [
        'clio_turn'               => 'high',
        'sage_cluster_event'      => 'high',
        'atlas_brief'             => 'medium',
        'atlas_pulse_refresh'     => 'low',
        'scout_outreach'          => 'medium',
        'scout_discovery'         => 'low',
        'sage_reengagement'       => 'medium',
        // Tool system + Observer jobs
        'observer_tool_analysis'  => 'low',
        'cli_tool_proposal'       => 'medium',
        'clio_tool_analysis'      => 'low',
        'sage_tool_analysis'      => 'low',
        'observer_daily_digest'   => 'low',
    ];

    public static function dispatch(
        string $jobType,
        array $payload,
        bool $requiresCallback = false,
        ?int $delaySecs = null
    ): string {
        $jobId = Str::uuid()->toString();
        $ttl = self::$TTL_MAP[$jobType] ?? 30;
        $priority = self::$PRIORITY_MAP[$jobType] ?? 'low';

        $job = [
            'job_id'           => $jobId,
            'job_type'         => $jobType,
            'priority'         => $priority,
            'dispatched_at'    => now()->toISOString(),
            'expires_at'       => now()->addSeconds($ttl)->toISOString(),
            'requires_callback' => $requiresCallback,
            'callback_url'     => $requiresCallback
                ? route('Yantra.result', ['jobId' => $jobId])
                : null,
            'callback_secret'  => self::signJobId($jobId),
            'retry_count'      => 0,
            'max_retries'      => 2,
            'payload'          => $payload,
        ];

        $queue = "Yantra:{$priority}";
        $serialized = json_encode($job);

        if ($delaySecs && $delaySecs > 0) {
            // Use sorted set for delayed dispatch
            Redis::zadd("yantra:delayed", now()->addSeconds($delaySecs)->timestamp, $serialized);
        } else {
            Redis::rpush($queue, $serialized);
        }

        return $jobId;
    }

    private static function signJobId(string $jobId): string
    {
        return hash_hmac('sha256', $jobId, config('services.Yantra.callback_secret'));
    }
}
```

**Usage in a controller:**

```php
// In ClioController@turn
$jobId = YantraDispatcher::dispatch(
    jobType: 'clio_turn',
    payload: [
        'user_id'              => $user->id,
        'session_id'           => $session->id,
        'message'              => $request->message,
        'conversation_history' => $session->history,
        'user_md_content'      => $userMd,
        'memory_md_content'    => $memoryMd,
        'active_persona'       => $user->active_persona,
        'subscription_tier'    => $user->subscription_tier,
    ],
    requiresCallback: true   // Clio turns need real-time response
);

// Store job_id in session — callback will match on this
$session->update(['pending_job_id' => $jobId]);
```

---

## Laravel Callback Handler

```php
<?php
// app/Http/Controllers/YantraResultController.php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class YantraResultController extends Controller
{
    public function receive(Request $request, string $jobId): \Illuminate\Http\Response
    {
        // 1. Verify HMAC signature
        $sig = $request->header('X-Yantra-Signature');
        $expected = hash_hmac('sha256', $request->getContent(), config('services.Yantra.callback_secret'));
        if (!hash_equals($expected, $sig ?? '')) {
            return response('Unauthorized', 401);
        }

        $data = $request->json()->all();

        // 2. Route result to the appropriate handler
        match ($data['job_type']) {
            'clio_turn'          => (new ClioResultHandler)->handle($jobId, $data),
            'sage_cluster_event' => (new SageResultHandler)->handle($jobId, $data),
            default              => logger()->warning("Unknown job_type in callback: {$data['job_type']}")
        };

        return response('OK', 200);
    }
}
```

---

## Environment Variables

```env
# Redis
REDIS_URL=redis://localhost:6379/0

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key

# LLM Providers
NVIDIA_NIM_API_KEY=your-nim-key
MOONSHOT_API_KEY=your-moonshot-key
GROQ_API_KEY=your-groq-key
ANTHROPIC_API_KEY=your-anthropic-key

# Internal Security
YANTRA_CALLBACK_SECRET=64-byte-random-hex

# Monitoring
PROMETHEUS_PORT=9090
LOG_LEVEL=INFO
```

---

**Yantra Bridge Spec · v1.1 · Internal — Architecture Document**
*v1.0: Initial architecture — 5 workers, 12 LLM ops, 3-lane Redis queue, Laravel bridge.*
*v1.1: Tool system — `tool_loader.py` added to context pipeline. `observer_worker.py` added. 5 new job types (observer_tool_analysis, cli_tool_proposal, clio_tool_analysis, sage_tool_analysis, observer_daily_digest). 2 new LLM ops (tool_proposal_analysis, pre_check_structured → 14 total). `cluster_tools` and `tool_proposals` SQL schemas. Full payload schemas for all tool-related jobs. Laravel dispatcher updated.*
