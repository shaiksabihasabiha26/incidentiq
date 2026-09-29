"use client";

import { ArrowUpRight, Database, LoaderCircle, Search, Sparkles, Tags, Waypoints } from "lucide-react";
import { useEffect, useState } from "react";
import type { RetrievedMemory } from "@/types";

export default function MemoryPage() {
  const [memories, setMemories] = useState<RetrievedMemory[]>([]);
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<"hindsight" | "demo">("demo");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastQuery, setLastQuery] = useState("resolved production incidents and lessons learned");
  const [seedState, setSeedState] = useState("");
  const [seeding, setSeeding] = useState(false);
  const [stats, setStats] = useState({ hindsight: false, bankId: "not configured" });

  useEffect(() => {
    fetch("/api/status").then((response) => response.json()).then((data) => setStats({ hindsight: Boolean(data.hindsight?.connected), bankId: data.bankId || "not configured" })).catch(() => setStats({ hindsight: false, bankId: "not configured" }));
    void searchMemories("resolved production incidents and lessons learned");
  }, []);

  async function searchMemories(search: string) {
    setLoading(true); setError(""); setLastQuery(search);
    try {
      const demo = JSON.parse(localStorage.getItem("incidentiq-demo-memories") || "[]");
      const response = await fetch("/api/memory/recall", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query: search, demoMemories: demo }) });
      const result = await response.json(); if (!response.ok) throw new Error(result.error || "Memory retrieval failed.");
      setMemories(result.memories || []); setMode(result.mode);
    } catch (searchError) { setError(searchError instanceof Error ? searchError.message : "Search unavailable."); }
    finally { setLoading(false); }
  }

  async function seedMemories() {
    setSeeding(true);
    setSeedState("Loading demo memories...");
    try { const response = await fetch("/api/memory/seed", { method: "POST" }); const result = await response.json(); if (!response.ok) throw new Error(result.error); setSeedState(result.added ? `Loaded ${result.added} new demo records; ${result.existing} were already present.` : "All demo records are already in Hindsight."); await searchMemories(lastQuery); }
    catch (seedError) { setSeedState(seedError instanceof Error ? seedError.message : "Could not seed Hindsight."); }
    finally { setSeeding(false); }
  }

  const services = new Set(memories.map((memory) => memory.service).filter(Boolean));
  const lessonCount = memories.filter((memory) => memory.text.toLowerCase().includes("lessons learned")).length;

  return <>
    <div className="page-heading"><div><div className="eyebrow">LONG-TERM OPERATIONAL CONTEXT</div><h1>Hindsight memory</h1><p>Everything IncidentIQ has learned from previous incidents.</p></div><span className={`memory-connection-badge ${stats.hindsight ? "connected" : ""}`}><i />{stats.hindsight ? "Connected to Hindsight" : "Demo memory · local synthetic records"}</span></div>
    <div className="memory-stats-grid"><MemoryStat icon={Database} label="Retrieved records" value={String(memories.length).padStart(2, "0")} /><MemoryStat icon={Waypoints} label="Services covered" value={String(services.size).padStart(2, "0")} /><MemoryStat icon={Sparkles} label="Lessons with evidence" value={String(lessonCount).padStart(2, "0")} /><MemoryStat icon={Tags} label="Memory bank" value={stats.hindsight ? stats.bankId : "Demo"} small /></div>
    <section className="memory-search-panel panel"><div className="memory-search-copy"><div className="panel-title">Search operational memory</div><div className="panel-subtitle">Each result below was returned by the selected memory source for your query.</div></div><form className="memory-search-form" onSubmit={(event) => { event.preventDefault(); if (query.trim().length >= 2) void searchMemories(query.trim()); }}><div className="memory-search-input"><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search incidents, root causes, services, resolutions..." aria-label="Search incident memories" minLength={2} /></div><button className="button button-primary" disabled={loading || query.trim().length < 2}>{loading ? <LoaderCircle className="spin" size={14} /> : <Search size={14} />} Recall</button></form><div className="memory-search-meta"><span><i className={mode === "hindsight" ? "online" : ""} /> {mode === "hindsight" ? `LIVE HINDSIGHT RECALL · BANK ${stats.bankId}` : "DEMO MEMORY · LOCAL SYNTHETIC RECORDS"}</span><span>QUERY: “{lastQuery}”</span></div></section>
    <div className="memory-results-heading"><div><span className="section-label">RETRIEVAL RESULTS</span><span className="result-number">{loading ? "..." : memories.length} {memories.length === 1 ? "RECORD" : "RECORDS"}</span></div><button className="button button-small button-quiet" disabled={loading} onClick={() => void searchMemories(lastQuery)}><ArrowUpRight size={12} /> Run recall again</button></div>
    {seedState && <div className={`seed-message ${seedState.startsWith("Could") || seedState.startsWith("Connect") ? "seed-error" : ""}`}>{seedState}</div>}
    {error && <div className="form-error"><Database size={14} />{error}</div>}
    {loading ? <div className="memory-card-grid">{[1, 2, 3].map((key) => <div className="panel memory-skeleton" key={key}><span className="skeleton" /><span className="skeleton" /><span className="skeleton" /></div>)}</div> : memories.length ? <div className="memory-card-grid">{memories.map((memory, index) => <MemoryResult key={`${memory.id}-${index}`} memory={memory} mode={mode} />)}</div> : <div className="panel empty-memory-list"><Database size={23} /><strong>No historical memories found.</strong><p>Try a broader service or symptom query. No records will be invented to fill this list.</p></div>}
    <section className="seed-panel"><div><span className="seed-icon"><Database size={15} /></span><span><strong>Prepare a persistent demo bank</strong><small>Load the synthetic incident set into Hindsight once. Existing demo records are checked before writes.</small></span></div><button className="button button-small" disabled={!stats.hindsight || loading || seeding} onClick={() => void seedMemories()}>{seeding ? <><LoaderCircle className="spin" size={12} /> Seeding...</> : stats.hindsight ? "Load demo memories" : "Connect Hindsight first"}{!seeding && <ArrowUpRight size={12} />}</button></section>
  </>;
}

function MemoryStat({ icon: Icon, label, value, small }: { icon: typeof Database; label: string; value: string; small?: boolean }) { return <div className="panel memory-stat"><span className="memory-stat-icon"><Icon size={14} /></span><span className="memory-stat-label">{label}</span><strong className={small ? "memory-bank-value" : ""}>{value}</strong></div>; }
function MemoryResult({ memory, mode }: { memory: RetrievedMemory; mode: string }) {
  return <article className="panel explorer-memory"><div className="explorer-memory-top"><div><span className="incident-id">{memory.id}</span><span className="explorer-source"><Database size={10} /> {mode === "hindsight" ? "HINDSIGHT RESULT" : "DEMO MEMORY"}</span></div><span className="explorer-score"><Sparkles size={11} /> RELEVANT</span></div><h3>{memory.title || "Incident record"}</h3><div className="explorer-meta"><span>{memory.service || "Unknown service"}</span>{memory.date && <><i />{memory.date.slice(0, 10)}</>}</div><div className="explorer-fact"><span>ROOT CAUSE</span><p>{memory.rootCause || memory.text.slice(0, 160)}</p></div>{memory.resolution && <div className="explorer-fact"><span>RESOLUTION</span><p>{memory.resolution}</p></div>}{memory.outcome && <div className="explorer-outcome"><Sparkles size={12} />{memory.outcome}</div>}<details className="memory-source-text"><summary>View full retrieved memory</summary><pre>{memory.text}</pre></details></article>;
}