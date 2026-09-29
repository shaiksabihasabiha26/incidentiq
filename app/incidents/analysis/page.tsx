"use client";

import Link from "next/link";
import { Activity, AlertCircle, ArrowLeft, ArrowRight, BadgeCheck, Check, CheckCircle2, Clock3, Database, LoaderCircle, Save, ShieldAlert, Sparkles, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import type { Incident, IncidentAnalysis, Resolution, RetrievedMemory } from "@/types";

type AnalysisData = { incident: Incident; memories: RetrievedMemory[]; analysis: IncidentAnalysis; memoryMode: "hindsight" | "demo"; reflection?: { summary: string; supportingIncidents: string[] } | null; memoryNotice?: string };
const initialResolution: Resolution = {
  rootCause: "PostgreSQL connection pool exhaustion caused by increased traffic.",
  resolutionApplied: "Increased connection pool from 20 to 50 and restarted affected workers.",
  whatWorked: "Increasing pool capacity immediately reduced database timeout errors.",
  whatDidNotWork: "Initial worker restart alone did not resolve the issue.",
  impact: "503 rate decreased from 18% to below 1%.",
  lessonsLearned: "For similar Payments incidents, check connection pool saturation before restarting application workers.",
};
const checklist = ["Inspect DB connection utilization", "Inspect application connection pool", "Check recent deployment", "Compare traffic volume", "Check database latency", "Review previous successful resolution"];

export default function IncidentAnalysisPage() {
  const [data, setData] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [checked, setChecked] = useState<string[]>([]);
  const [resolveOpen, setResolveOpen] = useState(false);
  const [resolution, setResolution] = useState(initialResolution);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ text: string; error?: boolean } | null>(null);
  const [resolved, setResolved] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      try { const stored = sessionStorage.getItem("incidentiq-current-analysis"); if (stored && active) setData(JSON.parse(stored) as AnalysisData); }
      catch { /* Invalid session data is handled as an empty analysis. */ }
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, []);

  function notify(text: string, error = false) { setToast({ text, error }); window.setTimeout(() => setToast(null), 3200); }
  function toggleCheck(item: string) { setChecked((current) => current.includes(item) ? current.filter((value) => value !== item) : [...current, item]); }

  async function saveResolution(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!data) return; setSaving(true);
    try {
      const response = await fetch("/api/incidents/resolve", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ incident: data.incident, resolution, relevantIncident: data.analysis.supportingIncidents[0] }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Learning could not be saved.");
      const nextIncident = { ...data.incident, status: "Resolved" as const, rootCause: resolution.rootCause, resolution: resolution.resolutionApplied };
      const current = JSON.parse(localStorage.getItem("incidentiq-incidents") || "[]") as Incident[];
      localStorage.setItem("incidentiq-incidents", JSON.stringify([nextIncident, ...current.filter((item) => item.id !== nextIncident.id)].slice(0, 30)));
      if (!result.saved) {
        const memory: RetrievedMemory = { id: data.incident.id, source: "demo", date: data.incident.timestamp, service: data.incident.service, title: data.incident.title, rootCause: resolution.rootCause, resolution: resolution.resolutionApplied, outcome: resolution.impact, text: [`Incident ID: ${data.incident.id}`, `Incident title: ${data.incident.title}`, `Service: ${data.incident.service}`, `Date: ${data.incident.timestamp}`, `Symptoms: ${data.incident.symptoms.join("; ")}`, `Error: ${data.incident.errorCode}`, `Root cause: ${resolution.rootCause}`, `Resolution: ${resolution.resolutionApplied}`, `What worked: ${resolution.whatWorked}`, `What did not work: ${resolution.whatDidNotWork}`, `Impact: ${resolution.impact}`, `Lessons learned: ${resolution.lessonsLearned}`, `Relevant previous incident: ${data.analysis.supportingIncidents[0] || "None"}`, "Outcome: Resolved"].join("\n") };
        const existing = JSON.parse(localStorage.getItem("incidentiq-demo-memories") || "[]") as RetrievedMemory[];
        localStorage.setItem("incidentiq-demo-memories", JSON.stringify([memory, ...existing.filter((item) => item.id !== memory.id)].slice(0, 30)));
        notify(result.message || "Saved as browser-only Demo Memory; Hindsight did not retain it.");
      } else notify(result.message || "Learning retained in Hindsight.");
      setData({ ...data, incident: nextIncident }); setResolved(true); setResolveOpen(false);
    } catch (saveError) { notify(saveError instanceof Error ? saveError.message : "Could not save learning.", true); }
    finally { setSaving(false); }
  }

  if (loading) return <div className="analysis-loading"><span className="skeleton" /><span className="skeleton" /><span className="skeleton" /></div>;
  if (!data) return <div className="analysis-empty"><div className="empty-state panel"><AlertCircle size={24} /><strong>No active analysis</strong><p>Start with an incident so IncidentIQ can search memory and build an evidence-based response.</p><Link href="/incidents/new" className="button button-primary"><Activity size={14} /> New incident</Link></div></div>;
  const { incident, memories, analysis } = data;

  return <>
    <div className="backline"><Link href="/incidents" className="back-link"><ArrowLeft size={13} /> Incidents</Link><span>/</span><span>{incident.id}</span></div>
    <div className="analysis-page-heading"><div><div className="eyebrow">INCIDENT ANALYSIS <span>·</span> {incident.id}</div><h1>{incident.title}</h1><div className="analysis-subline"><span>{incident.service}</span><i /> <Severity severity={incident.severity} /><i /> <span className="status-pill"><i />{resolved ? "Resolved" : "Analyzing with IncidentIQ"}</span></div></div><span className="analysis-source-badge"><span className="source-dot" />{data.memoryMode === "hindsight" ? "HINDSIGHT RECALL" : "DEMO MEMORY"}</span></div>
    <div className="analysis-layout">
      <main className="analysis-main">
        <section className="analysis-block current-incident-block"><BlockTitle number="01" title="Current incident" trailing={incident.timestamp ? new Date(incident.timestamp).toLocaleString([], { dateStyle: "medium", timeStyle: "short" }) : "Just now"} /><div className="current-incident-card panel"><div className="incident-summary-top"><span className="incident-id-large">{incident.id}</span><span className="tag">{incident.errorCode || "No error code"}</span><span className="tag affected-tag"><Activity size={11} /> {incident.affectedUsers || "Impact not estimated"}</span></div><p>{incident.description}</p><div className="incident-symptoms">{incident.symptoms.map((symptom) => <span key={symptom}><i />{symptom}</span>)}</div>{incident.recentChanges && <div className="recent-change"><Clock3 size={12} /><span><b>Recent change</b> {incident.recentChanges}</span></div>}</div></section>

        <section className="analysis-block memory-block"><BlockTitle number="02" title="Hindsight memory" trailing={<span className="memory-result-count"><Database size={12} /> {memories.length} {memories.length === 1 ? "memory" : "memories"} found</span>} /><div className="memory-intro"><span className="memory-icon"><Sparkles size={15} /></span><div><strong>Relevant incidents remembered from previous operations</strong><small>{data.memoryMode === "hindsight" ? "Retrieved from your configured Hindsight bank for this incident." : "Synthetic local demo records. Not returned by Hindsight."}</small></div></div>
          {memories.length ? <div className="memory-results">{memories.map((memory, index) => <MemoryCard key={`${memory.id}-${index}`} memory={memory} relevance={index === 0 ? "Closest match" : "Related record"} />)}</div> : <div className="empty-memory"><Database size={18} /><span><strong>No relevant historical memories found.</strong><small>{data.memoryMode === "hindsight" ? "This query returned no matching Hindsight records. The plan below uses generic incident response guidance." : "No local demo memory matched. Generic incident guidance is shown below."}</small></span></div>}
        </section>

        <section className="analysis-block"><BlockTitle number="03" title="Pattern detection" /><div className="pattern-card panel"><span className="pattern-marker"><Sparkles size={14} /></span><div><div className="pattern-headline">{memories.length ? "Potential pattern detected" : "No historical pattern found"}</div><p>{analysis.pattern}</p>{analysis.supportingIncidents.length > 0 && <div className="pattern-links">{analysis.supportingIncidents.map((id) => <span key={id} className="tag"><Database size={10} /> {id}</span>)}</div>}{data.reflection && <div className="hindsight-reflection"><span>HINDSIGHT REFLECT</span><p>{data.reflection.summary}</p><small>Evidence: {data.reflection.supportingIncidents.join(", ")}</small></div>}</div></div>{data.memoryNotice && <div className="memory-fallback-notice"><AlertCircle size={12} />{data.memoryNotice}</div>}</section>

        <section className="recommendation-card"><div className="recommendation-top"><span className="recommendation-icon"><Sparkles size={17} /></span><div><div className="recommendation-kicker">INCIDENTIQ RESPONSE GUIDANCE</div><h2>Recommended response</h2></div><span className="confidence-pill"><span />{analysis.confidence} confidence</span></div><p className="recommendation-summary">{analysis.summary}</p><ol className="recommendation-list">{analysis.recommendation.map((step, index) => <li key={`${step}-${index}`}><span>{String(index + 1).padStart(2, "0")}</span><p>{step}</p></li>)}</ol><div className="why-box"><div><Sparkles size={13} /><strong>Why this recommendation?</strong></div><p>{analysis.whyRelevant}</p></div><div className="recommendation-safety"><ShieldAlert size={13} /> Confirm the observed condition and rollback plan before changing production.</div></section>

        <section className="analysis-block plan-block"><BlockTitle number="04" title="Investigation plan" trailing={<span className="check-progress">{checked.length}/{checklist.length} complete</span>} /><div className="checklist panel">{analysis.investigationSteps.concat(checklist).filter((item, index, all) => all.indexOf(item) === index).slice(0, 6).map((item) => <button key={item} className={`check-item ${checked.includes(item) ? "check-done" : ""}`} onClick={() => toggleCheck(item)}><span className="check-box">{checked.includes(item) && <Check size={12} />}</span><span>{item}</span></button>)}</div></section>
      </main>
      <aside className="analysis-aside">
        <section className="panel evidence-panel"><BlockTitle number="05" title="Evidence" /><div className="evidence-metric"><span>CONFIDENCE</span><strong>{analysis.confidence}</strong><div className="confidence-bar"><i style={{ width: analysis.confidence === "High" ? "84%" : analysis.confidence === "Moderate" ? "58%" : "27%" }} /></div><small>Based on retrieved records and current incident context.</small></div><div className="evidence-line"><span>Historical records</span><strong>{memories.length}</strong></div><div className="evidence-line"><span>Supporting incidents</span><strong>{analysis.supportingIncidents.length}</strong></div><div className="evidence-line"><span>LLM analysis</span><strong>{analysis.llmConnected ? "Groq" : "Rule-based"}</strong></div><div className="evidence-foot"><AlertCircle size={12} /> Confidence is guidance, not a probability of cause.</div></section>
        <section className="panel response-actions"><div className="panel-title">Incident actions</div><p>Record what happened so the next response starts with better context.</p><button className="button button-primary action-wide" onClick={() => { setResolution(initialResolution); setResolveOpen(true); }}><BadgeCheck size={14} /> {resolved ? "Update resolution" : "Mark incident resolved"}</button><button className="button action-wide" onClick={() => { setResolution(initialResolution); setResolveOpen(true); }}><Save size={14} /> Store learning</button><Link className="button button-quiet action-wide" href="/incidents/new"><Activity size={14} /> Start new incident</Link><Link className="action-memory-link" href="/memory">Explore memory <ArrowRight size={13} /></Link></section>
        <section className="panel memory-advantage"><div className="section-label">MEMORY ADVANTAGE</div><h3>Same signal. Better first move.</h3><div className="compare-row"><span className="compare-label">WITHOUT MEMORY</span><p>Check logs, database health, recent deployments, and network connectivity.</p></div><div className="compare-divider"><span /></div><div className="compare-row compare-after"><span className="compare-label">{data.memoryMode === "hindsight" ? "WITH HINDSIGHT" : "WITH DEMO MEMORY"}</span><p>{memories[0] ? `${memories[0].id} recorded ${memories[0].rootCause || "a similar symptom"}. ${memories[0].resolution || "Review that incident before choosing a mitigation."}` : "No retrieved evidence yet. Start with current telemetry and build the memory as you resolve this incident."}</p></div></section>
      </aside>
    </div>
    {resolveOpen && <ResolveDialog resolution={resolution} setResolution={setResolution} saving={saving} onClose={() => setResolveOpen(false)} onSubmit={saveResolution} connected={data.memoryMode === "hindsight"} />}
    {toast && <div className={`toast ${toast.error ? "toast-error" : ""}`} role="status">{toast.error && <AlertCircle size={14} />}{toast.text}</div>}
  </>;
}

function BlockTitle({ number, title, trailing }: { number: string; title: string; trailing?: React.ReactNode }) { return <div className="block-title"><span className="block-number">{number}</span><h2>{title}</h2>{trailing && <span className="block-trailing">{trailing}</span>}</div>; }
function Severity({ severity }: { severity: string }) { return <span className={`severity severity-${severity.toLowerCase()}`}><i />{severity}</span>; }
function MemoryCard({ memory, relevance }: { memory: RetrievedMemory; relevance: string }) { return <article className="memory-card"><div className="memory-card-header"><div><span className="memory-id">{memory.id}</span><span className="memory-source"><Database size={10} /> {memory.source === "hindsight" ? "HINDSIGHT" : "DEMO MEMORY"}</span></div><span className="relevance-chip">{relevance}</span></div><h3>{memory.title || memory.service || "Historical incident"}</h3><div className="memory-meta"><span>{memory.service || "Service not specified"}</span>{memory.date && <><i />{memory.date.slice(0, 10)}</>}</div>{memory.rootCause && <div className="memory-fact"><strong>ROOT CAUSE</strong><p>{memory.rootCause}</p></div>}{memory.resolution && <div className="memory-fact"><strong>RESOLUTION</strong><p>{memory.resolution}</p></div>}{memory.outcome && <div className="memory-outcome"><CheckCircle2 size={12} />{memory.outcome}</div>}<div className="memory-why"><Sparkles size={11} /><span>Why it matters: this record was returned for the current incident query.</span></div></article>; }

function ResolveDialog({ resolution, setResolution, saving, onClose, onSubmit, connected }: { resolution: Resolution; setResolution: (resolution: Resolution) => void; saving: boolean; onClose: () => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void; connected: boolean }) {
  function update(key: keyof Resolution, value: string) { setResolution({ ...resolution, [key]: value }); }
  return <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="resolution-dialog" role="dialog" aria-modal="true" aria-labelledby="resolve-title"><div className="dialog-heading"><div><div className="eyebrow">POST-INCIDENT LEARNING</div><h2 id="resolve-title">Record the resolution</h2><p>Capture the evidence an engineer will need next time.</p></div><button className="icon-button dialog-close" aria-label="Close dialog" onClick={onClose}><X size={17} /></button></div><form onSubmit={onSubmit}><div className="resolution-grid">{(Object.keys(resolution) as (keyof Resolution)[]).map((key) => <label key={key} className={`field ${key === "whatDidNotWork" || key === "lessonsLearned" ? "field-full" : ""}`}><span className="field-label">{resolutionLabel(key)}{key !== "whatDidNotWork" && <i className="required-star"> *</i>}</span><textarea className="textarea resolution-textarea" required={key !== "whatDidNotWork"} maxLength={1200} rows={key === "lessonsLearned" ? 3 : 2} value={resolution[key]} onChange={(event) => update(key, event.target.value)} /></label>)}</div><div className={`dialog-memory-note ${connected ? "connected-note" : ""}`}><Database size={14} /><span><strong>{connected ? "Will retain to Hindsight" : "Demo mode: Hindsight not connected"}</strong><small>{connected ? "This resolution will be retained to your configured Hindsight bank." : "Saved learning stays in this browser and is labeled Demo Memory; it is not persistent Hindsight storage."}</small></span></div><div className="dialog-actions"><button type="button" className="button button-quiet" onClick={onClose}>Cancel</button><button disabled={saving} type="submit" className="button button-primary">{saving ? <><LoaderCircle className="spin" size={14} /> Saving...</> : <><Save size={14} /> {connected ? "Save to Hindsight" : "Save demo learning"}</>}</button></div></form></section></div>;
}
function resolutionLabel(key: keyof Resolution) { return ({ rootCause: "Root cause", resolutionApplied: "Resolution applied", whatWorked: "What worked", whatDidNotWork: "What did not work", impact: "Impact", lessonsLearned: "Lessons learned" })[key]; }