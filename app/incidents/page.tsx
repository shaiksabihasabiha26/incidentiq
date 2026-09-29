"use client";

import Link from "next/link";
import { Activity, Clock3, Plus, Search, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { demoIncidents } from "@/lib/demo/incidents";
import type { Incident } from "@/types";

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState(demoIncidents);
  const [filter, setFilter] = useState("");
  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      try { const local = JSON.parse(localStorage.getItem("incidentiq-incidents") || "[]") as Incident[]; if (active && local.length) setIncidents([...local, ...demoIncidents.filter((item) => !local.some((stored) => stored.id === item.id))]); }
      catch { /* Use built-in synthetic incidents if local state is malformed. */ }
    });
    return () => { active = false; };
  }, []);
  const visible = useMemo(() => incidents.filter((item) => `${item.id} ${item.title} ${item.service} ${item.status}`.toLowerCase().includes(filter.toLowerCase())), [incidents, filter]);
  return <>
    <div className="page-heading"><div><div className="eyebrow">OPERATIONS <span>·</span> INCIDENT LOG</div><h1>Incidents</h1><p>Track active response and the lessons attached to resolved events.</p></div><Link href="/incidents/new" className="button button-primary"><Plus size={14} /> New incident</Link></div>
    <div className="incident-toolbar panel"><div className="search-wrap"><Search size={14} /><input value={filter} onChange={(event) => setFilter(event.target.value)} placeholder="Filter by incident, service, or status..." aria-label="Filter incidents" /></div><span className="incident-count">{visible.length} INCIDENTS</span></div>
    <div className="panel incident-list-panel"><div className="incident-list-header"><span>INCIDENT</span><span>SERVICE</span><span>SEVERITY</span><span>STATUS</span><span>MEMORY</span><span>UPDATED</span></div>{visible.map((incident) => <Link href={`/incidents/${incident.id}`} className="incident-list-row incident-list-link" key={incident.id}><div className="list-incident-title"><span className="incident-id">{incident.id}</span><strong>{incident.title}</strong><small>{incident.errorCode || incident.description}</small></div><span className="service-cell">{incident.service}</span><Severity severity={incident.severity} /><span className={`status-pill ${incident.status === "Resolved" ? "resolved" : ""}`}><i />{incident.status}</span><span className={incident.id === "INC-104" ? "match-indicator" : "no-match"}>{incident.id === "INC-104" ? <><Sparkles size={11} /> 2 matches</> : incident.status === "Resolved" ? "Learned" : "—"}</span><span className="list-date"><Clock3 size={11} />{new Date(incident.timestamp || incident.createdAt).toLocaleDateString([], { month: "short", day: "numeric" })}</span></Link>)}{visible.length === 0 && <div className="empty-state"><Activity size={20} /><strong>No incidents match</strong><p>Adjust the filter or report a new event.</p></div>}</div>
  </>;
}

function Severity({ severity }: { severity: string }) { return <span className={`severity severity-${severity.toLowerCase()}`}><i />{severity}</span>; }