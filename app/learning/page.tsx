"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, Database, GitCompareArrows, Lightbulb, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { demoMemories } from "@/lib/demo/incidents";
import type { RetrievedMemory } from "@/types";

export default function LearningPage() {
  const [memories, setMemories] = useState<RetrievedMemory[]>(demoMemories);
  const [connected, setConnected] = useState(false);
  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      try { const local = JSON.parse(localStorage.getItem("incidentiq-demo-memories") || "[]") as RetrievedMemory[]; if (active) setMemories([...local, ...demoMemories.filter((item) => !local.some((stored) => stored.id === item.id))]); }
      catch { /* Keep synthetic seed timeline. */ }
    });
    fetch("/api/status").then((response) => response.json()).then((data) => setConnected(Boolean(data.hindsight?.connected))).catch(() => setConnected(false));
    return () => { active = false; };
  }, []);
  return <>
    <div className="page-heading"><div><div className="eyebrow">OPERATIONAL LEARNING</div><h1>Learning timeline</h1><p>Every resolved incident leaves the next response with more context.</p></div><span className="timeline-source"><i />{connected ? "LIVE HINDSIGHT BANK" : "DEMO MEMORY + LOCAL LEARNINGS"}</span></div>
    <section className="memory-advantage wide-advantage panel"><div className="advantage-title"><span className="memory-icon"><GitCompareArrows size={15} /></span><div><div className="section-label">THE MEMORY ADVANTAGE</div><h2>From generic triage to evidence-backed response</h2></div></div><div className="advantage-columns"><div className="advantage-column"><span className="compare-label">WITHOUT HISTORICAL MEMORY</span><div className="generic-quote">“Check service logs, database health, recent deployments, and network connectivity.”</div><small>Broad triage. No operational context.</small></div><div className="advantage-connector"><ArrowRight size={17} /></div><div className="advantage-column advantage-with"><span className="compare-label">WITH {connected ? "HINDSIGHT" : "DEMO MEMORY"}</span><div className="specific-quote"><Sparkles size={13} />“INC-102 had the same Payments + PostgreSQL connection timeout pattern. The pool increase from 20 to 50 brought the error rate below 1%.”</div><small>Historical evidence plus a verifiable prior outcome.</small></div></div></section>
    <div className="timeline-heading"><div><span className="section-label">LEARNED OPERATIONS</span><h2>Incident history</h2></div><span className="timeline-record-count">{memories.length} MEMORY RECORDS</span></div>
    <section className="timeline-list">{memories.map((memory, index) => <article className="timeline-entry" key={`${memory.id}-${index}`}><div className="timeline-rail"><span className={`timeline-dot ${memory.id.startsWith("INC-") ? "" : "new-dot"}`}><CheckCircle2 size={14} /></span><i /></div><div className="timeline-content panel"><div className="timeline-entry-top"><span className="incident-id">{memory.id}</span><span className="timeline-date">{memory.date || "Date not recorded"}</span><span className={`explorer-source ${memory.source === "hindsight" ? "real-source" : ""}`}><Database size={10} />{memory.source === "hindsight" ? "HINDSIGHT" : "DEMO MEMORY"}</span></div><h3>{memory.title}</h3><div className="timeline-service">{memory.service || "Service not specified"}</div><div className="timeline-learning"><Lightbulb size={13} /><span><strong>Root cause learned</strong>{memory.rootCause || "No root cause recorded in this memory."}</span></div>{memory.resolution && <div className="timeline-learning resolution-learned"><CheckCircle2 size={13} /><span><strong>Successful response</strong>{memory.resolution}{memory.outcome ? ` ${memory.outcome}` : ""}</span></div>}<details className="timeline-full-text"><summary>View memory record</summary><pre>{memory.text}</pre></details></div></article>)}</section>
    <section className="learning-cta"><div><span className="learning-cta-icon"><Database size={16} /></span><span><strong>Make the next incident more informed.</strong><small>Resolve a production event and retain its root cause, response, impact, and lesson.</small></span></div><Link href="/incidents/new" className="button button-primary">Start an incident <ArrowRight size={13} /></Link></section>
  </>;
}