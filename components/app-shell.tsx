"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, ArrowUpRight, Bell, BookOpenCheck, ChevronDown, CircleHelp, Command, Database, Gauge, Layers3, Plus, Settings2, ShieldCheck, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";

const navigation = [
  { label: "Overview", href: "/", icon: Gauge },
  { label: "Incidents", href: "/incidents", icon: Activity, count: "04" },
  { label: "Memory", href: "/memory", icon: Database },
  { label: "Learning", href: "/learning", icon: BookOpenCheck },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [connected, setConnected] = useState<boolean | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    fetch("/api/status").then((response) => response.json()).then((data) => setConnected(Boolean(data.hindsight?.connected))).catch(() => setConnected(false));
  }, []);

  return <div className="app-frame">
    <aside className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`}>
      <Link href="/" className="brand" onClick={() => setMobileOpen(false)}>
        <span className="brand-mark"><Activity size={19} strokeWidth={2.2} /></span>
        <span><strong>incident<span>iq</span></strong><small>RESPONSE INTELLIGENCE</small></span>
      </Link>
      <div className="workspace-switch">
        <span className="workspace-avatar">N</span>
        <span className="workspace-copy"><strong>Northstar Systems</strong><small>Production workspace</small></span>
        <ChevronDown size={15} />
      </div>
      <div className="nav-caption">WORKSPACE</div>
      <nav className="side-nav" aria-label="Main navigation">
        {navigation.map(({ label, href, icon: Icon, count }) => <Link key={href} href={href} onClick={() => setMobileOpen(false)} className={`nav-link ${pathname === href || (href !== "/" && pathname.startsWith(href)) ? "nav-active" : ""}`}>
          <Icon size={17} /><span>{label}</span>{count && <span className="nav-count">{count}</span>}
        </Link>)}
      </nav>
      <div className="nav-caption nav-caption-spaced">OPERATIONS</div>
      <Link href="/incidents/new" onClick={() => setMobileOpen(false)} className="nav-link"><Plus size={17} /><span>New incident</span><span className="shortcut">N</span></Link>
      <Link href="/settings" onClick={() => setMobileOpen(false)} className={`nav-link ${pathname === "/settings" ? "nav-active" : ""}`}><Settings2 size={17} /><span>System status</span></Link>
      <div className="sidebar-bottom">
        <div className={`memory-status ${connected ? "is-connected" : ""}`}>
          <span className="status-light" />
          <span><strong>{connected ? "Hindsight connected" : "Demo mode"}</strong><small>{connected ? "Persistent memory active" : "Hindsight not connected"}</small></span>
          <ArrowUpRight size={14} />
        </div>
        <div className="profile-row"><span className="profile-avatar">AM</span><span><strong>Alex Morgan</strong><small>On-call engineer</small></span><ChevronDown size={15} /></div>
      </div>
    </aside>
    {mobileOpen && <button className="mobile-scrim" aria-label="Close menu" onClick={() => setMobileOpen(false)} />}
    <main className="main-area">
      <header className="topbar">
        <button className="mobile-menu" aria-label="Open navigation" onClick={() => setMobileOpen(!mobileOpen)}><Layers3 size={18} /></button>
        <div className="breadcrumb"><span>Northstar Systems</span><span className="crumb-slash">/</span><strong>{navigation.find((item) => pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href)))?.label || (pathname.includes("analysis") ? "Incident analysis" : pathname.includes("new") ? "New incident" : "Operations")}</strong></div>
        <div className="topbar-actions"><span className="env-badge"><span />PRODUCTION</span><button className="icon-button" aria-label="Notifications"><Bell size={17} /><i /></button><span className="topbar-divider" /><Link href="/settings" className="help-link"><CircleHelp size={16} /><span>Help</span></Link><span className="command-chip"><Command size={12} /> K</span></div>
      </header>
      {!connected && <div className="demo-banner"><span className="banner-pulse" /><strong>Demo mode</strong><span>Hindsight is not connected. Historical records below are labeled Demo Memory and are not live retrieval results.</span><Link href="/settings">Configure connection <ArrowUpRight size={13} /></Link></div>}
      <div className="page-content">{children}</div>
      <footer className="app-footer"><span><ShieldCheck size={13} /> IncidentIQ · Operational intelligence</span><span><Zap size={12} /> Synthetic demo scenario · runtime status in settings</span></footer>
    </main>
  </div>;
}