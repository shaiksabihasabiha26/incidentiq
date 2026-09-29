"use client";

import Link from "next/link";
import { Activity, ArrowRight, ArrowUpRight, Clock3, Database, Gauge, Plus, Radio, RefreshCw, ShieldCheck, Sparkles, Zap, type LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { demoIncidents, demoMemories } from "@/lib/demo/incidents";
import type { Incident } from "@/types";

export default function DashboardPage() {
  const [incidents, setIncidents] = useState(demoIncidents);
  const [memoryCount, setMemoryCount] = useState(8);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      try {
        const local = JSON.parse(localStorage.getItem("incidentiq-incidents") || "[]") as Incident[];
        if (active && local.length) setIncidents([...local, ...demoIncidents].slice(0, 8));
        const memories = JSON.parse(localStorage.getItem("incidentiq-demo-memories") || "[]");
        if (active) setMemoryCount(demoMemories.length + memories.length);
      } catch { /* Ignore invalid local demo state and keep the safe seed view. */ }
    });
    fetch("/api/status").then((response) => response.json()).then((data) => setConnected(Boolean(data.hindsight?.connected))).catch(() => setConnected(false));
    return () => { active = false; };
  }, []);

  const active = incidents.filter((incident) => incident.status === "Investigating").length;
  const resolved = incidents.filter((incident) => incident.status === "Resolved").length;

  return <>
    <div className="page-heading">
      <div><div className="eyebrow">TUESDAY, SEPTEMBER 29, 2026 <span className="footer-dot">·</span> ON-CALL OVERVIEW</div><h1>Good morning, Alex</h1><p>Here’s what’s happening across your production systems.</p></div>
      <Link href="/incidents/new" className="button button-primary"><Plus size={15} /> New incident</Link>
    </div>
    <div className="stat-grid">
      <Stat icon={Radio} label="Active incidents" value={String(active).padStart(2, "0")} detail="1 critical needs attention" tone="red" />
      <Stat icon={ShieldCheck} label="Resolved in sample" value={String(resolved).padStart(2, "0")} detail="Synthetic incident records" />
      <Stat icon={Database} label="Memories stored" value={String(memoryCount).padStart(2, "0")} detail={connected ? "Hindsight persistent bank" : "Synthetic demo records"} />
      <Stat icon={Zap} label="Recorded outcomes" value={String(demoIncidents.filter((incident) => incident.status === "Resolved").length).padStart(2, "0")} detail="Synthetic incident records" />
    </div>
    <div className="dashboard-grid">
      <section className="panel incident-table-panel">
        <div className="panel-header"><div className="panel-header-left"><Activity size={16} color="#a8d591" /><div><div className="panel-title">Incident intelligence</div><div className="panel-subtitle">Recent production activity</div></div></div><Link href="/incidents" className="button button-small button-quiet">All incidents <ArrowRight size={13} /></Link></div>
        <div className="table-wrap"><table className="incident-table"><thead><tr><th>INCIDENT</th><th>SERVICE</th><th>SEVERITY</th><th>STATUS</th><th>MEMORY</th></tr></thead><tbody>
          {incidents.slice(0, 6).map((incident) => <tr key={incident.id}><td><Link href={`/incidents/${incident.id}`} className="incident-title-cell"><span className="incident-id">{incident.id}</span><strong>{incident.title}</strong></Link></td><td className="service-cell">{incident.service}</td><td><SeverityBadge severity={incident.severity} /></td><td><span className={`status-pill ${incident.status === "Resolved" ? "resolved" : ""}`}><i />{incident.status}</span></td><td>{incident.id === "INC-104" ? <span className="match-indicator"><Sparkles size={12} /> 2 matches</span> : incident.id === "INC-102" ? <span className="match-indicator"><Database size={12} /> Learned</span> : <span className="no-match">—</span>}</td></tr>)}
        </tbody></table></div>
      </section>
      <aside className="intel-stack">
        <section className="panel memory-feature"><div className="feature-top"><div className="feature-heading"><span className="feature-icon"><Sparkles size={14} /></span><span className="feature-kicker">INCIDENTIQ INTELLIGENCE</span></div><span className="live-badge">{connected ? "LIVE MEMORY" : "DEMO MEMORY"}</span></div><h3>Memory advantage</h3><p>Your production history turns into a better first move. The current Payments incident matches a prior connection-pool failure.</p><div className="memory-proof"><Database size={14} /><div><strong>INC-102 · PAYMENTS</strong><span>Pool raised 20 → 50. 503 rate fell from 18% to &lt;1%.</span></div></div><Link href="/incidents/analysis" className="memory-feature-link"><span>View incident analysis</span><ArrowUpRight size={13} /></Link></section>
        <section className="panel quick-actions"><div className="panel-title">Quick access</div><QuickAction href="/incidents/new" icon={Plus} title="Report an incident" detail="Start a new investigation" /><QuickAction href="/memory" icon={Database} title="Search incident memory" detail="Recall relevant past events" /><QuickAction href="/learning" icon={Clock3} title="Learning timeline" detail="See how the system evolves" /></section>
      </aside>
    </div>
    <div className="lower-dashboard"><div className="feed-heading"><span className="section-label">SAMPLE SYSTEM PULSE</span><span className="feed-live">SYNTHETIC TELEMETRY</span></div><div className="pulse-grid"><PulseItem icon={Gauge} name="Payments API" status="Degraded" detail="503 rate 18.4% · sample incident" danger /><PulseItem icon={Database} name="PostgreSQL · primary" status="Healthy" detail="Pool pressure elevated · sample" /><PulseItem icon={RefreshCw} name="Order workers" status="Healthy" detail="p95 latency 184ms · sample" /></div></div>
  </>;
}

function Stat({ icon: Icon, label, value, detail, tone }: { icon: LucideIcon; label: string; value: string; detail: React.ReactNode; tone?: string }) { return <section className="panel stat-card"><div className="stat-top"><span>{label}</span><span className="stat-icon"><Icon size={14} /></span></div><div className={`stat-value ${tone === "red" ? "stat-red" : ""}`}>{value}</div><div className="stat-foot">{detail}</div><span className="stat-glow" /></section>; }
function SeverityBadge({ severity }: { severity: string }) { const key = severity.toLowerCase(); return <span className={`severity severity-${key}`}><i />{severity}</span>; }
function QuickAction({ href, icon: Icon, title, detail }: { href: string; icon: LucideIcon; title: string; detail: string }) { return <Link href={href} className="quick-action"><span className="quick-action-icon"><Icon size={14} /></span><span><strong>{title}</strong><small>{detail}</small></span><ArrowUpRight size={13} /></Link>; }
function PulseItem({ icon: Icon, name, status, detail, danger }: { icon: LucideIcon; name: string; status: string; detail: string; danger?: boolean }) { return <div className="pulse-item"><Icon size={14} /><span className="pulse-copy"><strong>{name}</strong><small>{detail}</small></span><span className={`pulse-status ${danger ? "pulse-danger" : ""}`}><i />{status}</span></div>; }