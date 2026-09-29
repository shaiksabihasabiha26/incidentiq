"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, CircleHelp, FilePlus2, LoaderCircle, ShieldAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Incident } from "@/types";

const defaultIncident = {
  title: "Payment API returning 503 errors", service: "Payments API", severity: "Critical",
  errorCode: "503 Service Unavailable", description: "Payment requests are intermittently failing with 503 responses.",
  symptoms: "Elevated request failures\nDatabase connection timeout\nIncreased API latency\nConnection pool warnings",
  recentChanges: "Payment traffic increased by 35% after a promotional campaign.",
  affectedUsers: "Approximately 18% of payment requests.", timestamp: new Date().toISOString().slice(0, 16),
};

export default function NewIncidentPage() {
  const router = useRouter();
  const [form, setForm] = useState(defaultIncident);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function update(field: keyof typeof form, value: string) { setForm((current) => ({ ...current, [field]: value })); }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setError("");
    try {
      const localMemories = JSON.parse(localStorage.getItem("incidentiq-demo-memories") || "[]");
      const response = await fetch("/api/incidents/analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ incident: { ...form, timestamp: new Date(form.timestamp).toISOString(), symptoms: form.symptoms.split(/\n+/).map((item) => item.trim()).filter(Boolean) }, demoMemories: localMemories }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Incident analysis could not be started.");
      sessionStorage.setItem("incidentiq-current-analysis", JSON.stringify(data));
      const existing = JSON.parse(localStorage.getItem("incidentiq-incidents") || "[]") as Incident[];
      localStorage.setItem("incidentiq-incidents", JSON.stringify([data.incident, ...existing].slice(0, 30)));
      router.push("/incidents/analysis");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Network error. Please retry.");
      setLoading(false);
    }
  }

  return <>
    <div className="backline"><Link href="/incidents" className="back-link"><ArrowLeft size={13} /> Incidents</Link><span>/</span><span>New incident</span></div>
    <div className="page-heading new-incident-heading"><div><div className="eyebrow">INCIDENT RESPONSE <span>·</span> INTAKE</div><h1>Report an incident</h1><p>Capture the signal. IncidentIQ will search your operational memory before recommending a response.</p></div><span className="form-step"><span>01</span> INCIDENT DETAILS <i /> <span>02</span> ANALYSIS</span></div>
    <form className="incident-form-layout" onSubmit={submit}>
      <div className="form-main">
        <section className="panel form-section"><div className="form-section-heading"><span className="form-section-icon"><FilePlus2 size={15} /></span><div><div className="panel-title">Incident details</div><div className="panel-subtitle">What are you seeing in production?</div></div><span className="required-note">* REQUIRED</span></div>
          <div className="field-grid">
            <Field label="Incident title" required className="field-full"><input className="input" required minLength={5} maxLength={140} value={form.title} onChange={(event) => update("title", event.target.value)} placeholder="e.g. Payment API returning 503" /></Field>
            <Field label="Service" required><input className="input" required value={form.service} onChange={(event) => update("service", event.target.value)} placeholder="Payments API" /></Field>
            <Field label="Severity" required><select className="select" value={form.severity} onChange={(event) => update("severity", event.target.value)}><option>Critical</option><option>High</option><option>Medium</option><option>Low</option></select></Field>
            <Field label="Error code"><input className="input" value={form.errorCode} onChange={(event) => update("errorCode", event.target.value)} placeholder="HTTP 503" /></Field>
            <Field label="Incident time"><input className="input" type="datetime-local" value={form.timestamp} onChange={(event) => update("timestamp", event.target.value)} /></Field>
            <Field label="Description" required className="field-full"><textarea className="textarea" required minLength={10} maxLength={2000} rows={3} value={form.description} onChange={(event) => update("description", event.target.value)} placeholder="Describe what is failing and when it began." /></Field>
            <Field label="Symptoms" required className="field-full"><textarea className="textarea" required rows={4} value={form.symptoms} onChange={(event) => update("symptoms", event.target.value)} placeholder="One symptom per line" /><span className="field-hint">One signal per line helps memory recall find related incidents.</span></Field>
            <Field label="Recent changes"><textarea className="textarea" rows={2} value={form.recentChanges} onChange={(event) => update("recentChanges", event.target.value)} placeholder="Deployments, traffic changes, config updates..." /></Field>
            <Field label="Affected users"><textarea className="textarea" rows={2} value={form.affectedUsers} onChange={(event) => update("affectedUsers", event.target.value)} placeholder="Estimated scope or impact" /></Field>
          </div>
        </section>
        {error && <div className="form-error"><ShieldAlert size={15} />{error}</div>}
        <div className="form-actions"><Link href="/" className="button button-quiet"><ArrowLeft size={14} /> Cancel</Link><button disabled={loading} className="button button-primary" type="submit">{loading ? <><LoaderCircle className="spin" size={14} /> Searching operational memory...</> : <>Analyze incident <ArrowRight size={14} /></>}</button></div>
      </div>
      <aside className="form-aside"><div className="panel memory-guide"><span className="guide-icon"><CircleHelp size={15} /></span><div className="section-label">BEFORE YOU ANALYZE</div><h3>Start with the signal.</h3><p>IncidentIQ searches historical incident memory using service, error, symptoms, and recent changes. Better incident context makes for a more useful recall.</p><div className="guide-flow"><span>INCIDENT SIGNAL</span><ArrowRight size={12} /><span>MEMORY RECALL</span></div></div><div className="aside-note"><ShieldAlert size={13} /><span>Recommendations are investigation guidance. Verify current telemetry before changing production systems.</span></div></aside>
    </form>
  </>;
}

function Field({ label, required, className = "", children }: { label: string; required?: boolean; className?: string; children: React.ReactNode }) { return <label className={`field ${className}`}><span className="field-label">{label}{required && <i className="required-star"> *</i>}</span>{children}</label>; }