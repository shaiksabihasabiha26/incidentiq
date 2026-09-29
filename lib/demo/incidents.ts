import type { Incident, RetrievedMemory } from "@/types";

export const demoIncidents: Incident[] = [
  {
    id: "INC-104", title: "Payment API returning 503", service: "Payments", severity: "Critical",
    errorCode: "HTTP 503", description: "Payment requests intermittently fail during a sustained traffic increase.",
    symptoms: ["Elevated request failures", "Database connection timeout", "Increased API latency", "Connection pool warnings"],
    recentChanges: "Payment traffic increased by 35% after a promotional campaign.", affectedUsers: "18% of payment requests",
    timestamp: "2026-09-29T09:18:00.000Z", status: "Investigating", createdAt: "2026-09-29T09:18:00.000Z",
  },
  {
    id: "INC-103", title: "Checkout latency spike", service: "Checkout", severity: "High", errorCode: "p95 > 2.4s",
    description: "Checkout latency rose after a cache hit-rate decline.", symptoms: ["p95 latency above 2.4s", "Redis cache saturation"],
    recentChanges: "Catalog cache key format changed in release 4.18.", affectedUsers: "11% of active checkouts", timestamp: "2026-09-25T12:00:00.000Z",
    status: "Resolved", rootCause: "Redis hot keys saturated a small shard set.", resolution: "Rebalanced keys and raised cache capacity.", createdAt: "2026-09-25T12:00:00.000Z",
  },
  {
    id: "INC-102", title: "Database connection pool exhausted", service: "Payments", severity: "High", errorCode: "SQLSTATE 53300",
    description: "PostgreSQL connection acquisition timed out during a traffic spike.", symptoms: ["18% request errors", "Pool at max 20 connections", "Database acquisition timeout"],
    recentChanges: "Promotional traffic increased request concurrency by 32%.", affectedUsers: "18% of payment requests", timestamp: "2026-09-18T14:22:00.000Z",
    status: "Resolved", rootCause: "PostgreSQL connection pool maxed out under increased concurrency.",
    resolution: "Raised the pool from 20 to 50 and restarted affected workers.", createdAt: "2026-09-18T14:22:00.000Z",
  },
  {
    id: "INC-101", title: "Redis cache saturation", service: "Orders", severity: "Medium", errorCode: "CACHE_TIMEOUT",
    description: "Order reads fell through to the primary database after cache saturation.", symptoms: ["Cache timeouts", "Database read load +46%"],
    recentChanges: "A bulk catalog refresh ran during peak traffic.", affectedUsers: "7% of order lookups", timestamp: "2026-09-14T11:10:00.000Z",
    status: "Resolved", rootCause: "Refresh job created hot keys on one Redis shard.", resolution: "Rescheduled refresh and rebalanced shards.", createdAt: "2026-09-14T11:10:00.000Z",
  },
];

export const demoMemories: RetrievedMemory[] = [
  {
    id: "INC-102", source: "demo", date: "2026-09-18", service: "Payments", title: "Database connection pool exhausted",
    rootCause: "PostgreSQL connection pool maxed out during a promotional traffic spike; acquisition timeouts drove 503s.",
    resolution: "Raised the pool from 20 to 50 and restarted affected workers.", outcome: "Error rate fell from 18% to below 1%.",
    text: "Incident ID: INC-102\nIncident title: Database connection pool exhausted\nService: Payments\nDate: 2026-09-18\nSymptoms: 18% request errors; pool at max 20 connections; database acquisition timeout\nRoot cause: PostgreSQL connection pool maxed out under increased concurrency during promotional traffic.\nResolution: Raised pool from 20 to 50 and restarted affected workers.\nOutcome: Error rate fell from 18% to below 1%.\nLessons learned: Check connection pool saturation before restarting application workers.",
  },
  {
    id: "INC-097", source: "demo", date: "2026-08-11", service: "Payments", title: "Payment worker acquisition timeouts",
    rootCause: "Long-running payment reconciliation requests held database connections beyond the pool wait threshold.",
    resolution: "Isolated reconciliation workers and tuned connection idle limits.", outcome: "Timeouts returned to baseline within 12 minutes.",
    text: "Incident ID: INC-097\nIncident title: Payment worker acquisition timeouts\nService: Payments\nDate: 2026-08-11\nSymptoms: PostgreSQL acquisition timeouts and rising 5xx responses.\nRoot cause: Long-running reconciliation requests held pool connections.\nResolution: Isolated reconciliation workers and tuned connection idle limits.\nOutcome: Timeouts returned to baseline within 12 minutes.\nLessons learned: Compare active connections with worker concurrency before restarting pods.",
  },
  {
    id: "INC-089", source: "demo", date: "2026-06-02", service: "Checkout", title: "Checkout latency from Redis hot keys",
    rootCause: "A small set of campaign keys overloaded two Redis shards during a traffic surge.",
    resolution: "Rebalanced hot keys and moved the campaign refresh to a lower-traffic window.", outcome: "p95 latency improved from 2.4s to 410ms.",
    text: "Incident ID: INC-089\nIncident title: Checkout latency from Redis hot keys\nService: Checkout\nDate: 2026-06-02\nSymptoms: Redis queueing and checkout p95 latency of 2.4s.\nRoot cause: Campaign hot keys overloaded two Redis shards during traffic surge.\nResolution: Rebalanced hot keys and moved refresh to a lower-traffic window.\nOutcome: p95 latency improved from 2.4s to 410ms.\nLessons learned: Inspect shard-level key skew instead of increasing global cache capacity first.",
  },
  {
    id: "INC-083", source: "demo", date: "2026-04-17", service: "Orders", title: "Order API timeout from database lock contention",
    rootCause: "A migration held row locks while batch updates overlapped with order writes.",
    resolution: "Paused the batch job and reran the migration in smaller chunks.", outcome: "Write latency returned to normal in 9 minutes.",
    text: "Incident ID: INC-083\nIncident title: Order API timeout\nService: Orders\nDate: 2026-04-17\nSymptoms: Database lock waits and order write timeouts.\nRoot cause: Migration row locks overlapped with batch updates.\nResolution: Paused batch work and reran migration in smaller chunks.\nOutcome: Write latency returned to normal in 9 minutes.",
  },
  {
    id: "INC-078", source: "demo", date: "2026-03-29", service: "Identity", title: "Authentication failures after credential expiry",
    rootCause: "A rotated service credential was not propagated to one production worker group.",
    resolution: "Refreshed the secret mount and added an expiry alert.", outcome: "Authentication success returned to 99.99%.",
    text: "Incident ID: INC-078\nIncident title: Authentication failures\nService: Identity\nDate: 2026-03-29\nSymptoms: Elevated 401s from one worker group.\nRoot cause: Expired service credential was not propagated.\nResolution: Refreshed secret mount and added expiry alert.\nOutcome: Authentication success returned to 99.99%.",
  },
  {
    id: "INC-071", source: "demo", date: "2026-02-09", service: "Notifications", title: "Notification delivery backlog",
    rootCause: "Consumer concurrency was capped below arrival rate after a broker partition rebalance.",
    resolution: "Restored consumer parallelism and drained the oldest queue partitions.", outcome: "Backlog cleared in 23 minutes.",
    text: "Incident ID: INC-071\nIncident title: Notification delivery backlog\nService: Notifications\nDate: 2026-02-09\nSymptoms: Queue depth grew to 180k messages.\nRoot cause: Consumer concurrency fell below arrival rate after broker rebalance.\nResolution: Restored consumer parallelism and drained oldest partitions.\nOutcome: Backlog cleared in 23 minutes.",
  },
  {
    id: "INC-064", source: "demo", date: "2026-01-18", service: "Search", title: "Search API latency from shard imbalance",
    rootCause: "A shard relocation concentrated high-cardinality queries on a single Elasticsearch node.",
    resolution: "Completed shard rebalance and limited expensive aggregations.", outcome: "p99 search latency fell by 71%.",
    text: "Incident ID: INC-064\nIncident title: Search API latency\nService: Search\nDate: 2026-01-18\nSymptoms: Elasticsearch p99 latency above 3s.\nRoot cause: Shard relocation concentrated queries on one node.\nResolution: Rebalanced shards and limited expensive aggregations.\nOutcome: p99 latency fell by 71%.",
  },
  {
    id: "INC-059", source: "demo", date: "2025-12-06", service: "Media Workers", title: "Image processing failures",
    rootCause: "Worker memory pressure increased after large source images bypassed the resize preprocessor.",
    resolution: "Restored preprocessing and constrained worker concurrency by image size.", outcome: "Failed jobs dropped from 14% to 0.2%.",
    text: "Incident ID: INC-059\nIncident title: Image processing failures\nService: Media Workers\nDate: 2025-12-06\nSymptoms: Worker OOM kills and retry queue growth.\nRoot cause: Large source images bypassed resize preprocessing.\nResolution: Restored preprocessing and constrained concurrency by image size.\nOutcome: Failed jobs dropped from 14% to 0.2%.",
  },
  {
    id: "INC-052", source: "demo", date: "2025-11-12", service: "Payments", title: "Payment webhook delivery timeouts",
    rootCause: "A third-party processor exceeded the webhook client timeout while retries synchronized.",
    resolution: "Added exponential backoff with jitter and separated webhook workers from API workers.", outcome: "Webhook delivery recovered without increasing payment API latency.",
    text: "Incident ID: INC-052\nIncident title: Payment webhook failures\nService: Payments\nDate: 2025-11-12\nSymptoms: Third-party timeouts and synchronized retries.\nRoot cause: Processor latency exceeded client timeout.\nResolution: Added exponential backoff with jitter and isolated webhook workers.\nOutcome: Delivery recovered without affecting payment API latency.",
  },
];