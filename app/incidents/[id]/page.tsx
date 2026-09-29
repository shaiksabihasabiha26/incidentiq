"use client";

import Link from "next/link";
import { Activity, ArrowLeft, ArrowRight, CalendarClock, CheckCircle2, Clock3, Database, FileText, ShieldAlert } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { Incident } from "@/types";
import { demoIncidents } from "@/lib/demo/incidents";

export default function IncidentDetailsPage() {
  const params = useParams<{ id: string }>();
  const [incident, setIncident] = useState<Incident | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      try {
        const saved = JSON.parse(localStorage.getItem("incidentiq-incidents") || "[]") as Incident[];
        const found = saved.find((item) => item.id.toLowerCase() === params.id.toLowerCase()) || demoIncidents.find((item) => item.id.toLowerCase() === params.id.toLowerCase()) || null;
        if (active) setIncident(found);
      } catch {
        if (active) setIncident(demoIncidents.find((item) => item.id.toLowerCase() === params.id.toLowerCase()) || null);
      }
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [params.id]);

  if (loading) return <div className="detail-loading"><span className="skeleton" /><span className="skeleton" /><span className="skeleton" /></div>;
  if (!incident) return <div className="detail-not-found panel"><FileText size={24} /><h1>Incident not found</h1><p>This incident is not in the synthetic sample or this browser’s incident history.</p><Link href="/incidents" className="button"><ArrowLeft size={13} /> Back to incidents</Link></div>;

  const isCurrent = incident.id === (() => { try { return JSON.parse(sessionStorage.getItem("incidentiq-current-analysis") || "null")?.incident?.id; } catch { return undefined; } })();
  return <>
    <div className="backline"><Link href="/incidents" className="back-link"><ArrowLeft size={13} /> Incidents</Link><span>/</span><span>{incident.id}</span></div>
    <div className="page-heading detail-heading"><div><div className="eyebrow">INCIDENT RECORD <span>·</span> {incident.id}</div><h1>{incident.title}</h1><div className="detail-meta"><span>{incident.service}</span><i /><span className={`severity severity-${incident.severity.toLowerCase()}`}><i />{incident.severity}</span><i /><span className={`status-pill ${incident.status === "Resolved" ? "resolved" : ""}`}><i />{incident.status}</span></div></div>{isCurrent && <Link href="/incidents/analysis" className="button button-primary"><Activity size={14} /> View analysis</Link>}</div>
    <div className="detail-layout"><main className="detail-main">
      <section className="panel detail-section"><div className="detail-section-title"><FileText size={14} /><strong>Incident summary</strong></div><p>{incident.description}</p><div className="detail-facts"><Fact label="ERROR CODE" value={incident.errorCode || "Not supplied"} /><Fact label="AFFECTED USERS" value={incident.affectedUsers || "Not estimated"} /><Fact label="REPORTED AT" value={new Date(incident.timestamp || incident.createdAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })} /></div><div className="detail-subsection"><span className="section-label">OBSERVED SYMPTOMS</span><div className="incident-symptoms">{incident.symptoms.map((symptom) => <span key={symptom}><i />{symptom}</span>)}</div></div>{incident.recentChanges && <div className="detail-change"><CalendarClock size={13} /><span><strong>Recent changes</strong>{incident.recentChanges}</span></div>}</section>
      {incident.status === "Resolved" && <section className="panel detail-section"><div className="detail-section-title"><CheckCircle2 size={14} /><strong>Recorded outcome</strong><span className="explorer-source"><Database size={10} />{isCurrent && (() => { try { return JSON.parse(sessionStorage.getItem("incidentiq-current-analysis") || "null")?.memoryMode === "hindsight" ? "HINDSIGHT" : "DEMO MEMORY"; } catch { return "DEMO MEMORY"; } })()}</span></div><div className="detail-facts"><Fact label="ROOT CAUSE" value={incident.rootCause || "Not recorded"} /><Fact label="RESOLUTION" value={incident.resolution || "Not recorded"} /></div><div className="detail-memory-note"><ShieldAlert size={13} /><span>Resolved incident state is stored in this browser’s incident history. Persistent Hindsight retention is reported separately after resolution.</span></div></section>}
      <section className="panel detail-section"><div className="detail-section-title"><Clock3 size={14} /><strong>Activity</strong></div><div className="detail-activity"><span className="activity-marker"><Activity size={11} /></span><span><strong>{incident.status === "Resolved" ? "Incident resolved" : "Investigation opened"}</strong><small>{new Date(incident.timestamp || incident.createdAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}</small></span><span className="activity-kind">{incident.status === "Resolved" ? "OUTCOME RECORDED" : "INCIDENT CREATED"}</span></div></section>
    </main><aside className="detail-aside"><section className="panel detail-action-panel"><span className="section-label">NEXT ACTION</span><h2>{incident.status === "Investigating" ? "Continue investigation" : "Carry the learning forward"}</h2><p>{isCurrent ? "Review the retrieved evidence and response guidance for this incident." : incident.status === "Resolved" ? "A similar future event can recall this incident once it is retained in Hindsight." : "Analyze this event against historical context before choosing a response."}</p>{isCurrent ? <Link href="/incidents/analysis" className="button button-primary detail-action"><Activity size={13} /> Open analysis <ArrowRight size={13} /></Link> : <Link href="/incidents/new" className="button button-primary detail-action"><Activity size={13} /> Start new analysis <ArrowRight size={13} /></Link>}</section><section className="panel detail-safety"><ShieldAlert size={13} /><span>Validate current telemetry and rollback options before applying production changes.</span></section></aside></div>
  </>;
}

function Fact({ label, value }: { label: string; value: string }) { return <div className="detail-fact"><span>{label}</span><strong>{value}</strong></div>; }