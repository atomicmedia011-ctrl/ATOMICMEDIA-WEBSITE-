import React, { useEffect, useState } from "react";
import {
  Activity, ArrowUpRight, BriefcaseBusiness, CheckCircle2,
  FileText, Image, MessageSquare, MessageSquareQuote,
  Pencil, RadioTower, Sparkles, Users, Clock, Zap
} from "lucide-react";
import { api } from "../api/client";

function StatCard({ label, value, icon: Icon, caption, color }) {
  const [displayed, setDisplayed] = useState(0);
  const target = typeof value === "number" ? value : 0;

  useEffect(() => {
    if (!target) return;
    let start = 0;
    const step = Math.ceil(target / 30);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setDisplayed(target); clearInterval(timer); }
      else setDisplayed(start);
    }, 24);
    return () => clearInterval(timer);
  }, [target]);

  return (
    <div className="metric">
      <div className="metric-icon" style={color ? { background: color + "22", color } : {}}>
        <Icon size={18} />
      </div>
      <div className="metric-value">{typeof value === "number" ? displayed : (value ?? "—")}</div>
      <div className="metric-label">{label}</div>
      {caption && <div className="metric-caption">{caption}</div>}
    </div>
  );
}

function GreetingBar({ name }) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const now = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  return (
    <div className="dashboard-greeting">
      <div className="greeting-text">
        <p className="eyebrow">Atomic Media Command Center</p>
        <h1>{greeting}, {name?.split(" ")[0] || "Admin"} 👋</h1>
        <p>{now} — Manage every inch of your website from here.</p>
      </div>
      <div className="greeting-badge">
        <RadioTower size={16} />
        Website is Live
      </div>
    </div>
  );
}

export default function Dashboard({ setView }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);

  useEffect(() => {
    api("/api/auth/me").then(setUser).catch(() => {});
    api("/api/admin/dashboard")
      .then(r => { setData(r); setError(""); })
      .catch(e => { setData(null); setError(e.message); });
  }, []);

  const counts = data?.counts || {};

  const cards = [
    ["Total Projects", counts.totalProjects, BriefcaseBusiness, "Portfolio items", "#4f46e5"],
    ["Active Services", counts.activeServices ?? counts.totalServices, Sparkles, "Live on site", "#8b5cf6"],
    ["Contact Leads", counts.leads, MessageSquare, "Enquiries received", "#10b981"],
    ["Testimonials", counts.totalTestimonials, MessageSquareQuote, "Client reviews", "#f59e0b"],
    ["Blog Posts", counts.totalBlogPosts, FileText, "Published articles", "#3b82f6"],
    ["Media Assets", counts.totalMedia, Image, "Files uploaded", "#06b6d4"],
  ];

  const quickActions = [
    ["Add Project", "projects"],
    ["Edit Hero", "hero"],
    ["Manage Services", "services"],
    ["Review Leads", "leads"],
    ["Media Library", "media"],
    ["Website Settings", "settings"],
    ["Blog Posts", "blogs"],
    ["Team Members", "team"],
  ];

  return (
    <section className="workspace">
      <GreetingBar name={user?.name} />

      <div className="metric-grid">
        {cards.map(([label, value, Icon, caption, color]) => (
          <StatCard key={label} label={label} value={value ?? 0} icon={Icon} caption={caption} color={color} />
        ))}
      </div>

      {error && <div className="panel" style={{ borderColor: "rgba(239,68,68,0.2)", background: "var(--danger-bg)", color: "var(--danger)", marginBottom: 16 }}>⚠ Dashboard data unavailable: {error}</div>}

      <div className="dashboard-grid">
        {/* Quick Actions */}
        <div className="panel">
          <div className="panel-title-row">
            <div>
              <p className="eyebrow">Fast edits</p>
              <h2 className="panel-title" style={{ marginBottom: 0 }}>Quick Actions</h2>
            </div>
            <Pencil size={18} style={{ color: "var(--text-muted)" }} />
          </div>
          <div className="quick-grid">
            {quickActions.map(([label, target]) => (
              <button className="quick-action" key={target} onClick={() => setView(target)}>
                <span>{label}</span>
                <ArrowUpRight size={15} />
              </button>
            ))}
          </div>
        </div>

        {/* Recent Leads */}
        <div className="panel">
          <div className="panel-title-row">
            <div>
              <p className="eyebrow">Recent messages</p>
              <h2 className="panel-title" style={{ marginBottom: 0 }}>Contact Leads</h2>
            </div>
            <button className="btn-secondary compact" onClick={() => setView("leads")}>View All</button>
          </div>
          {(data?.recentLeads || []).length ? (
            <div className="mini-list">
              {data.recentLeads.map(lead => (
                <div className="mini-row" key={lead._id}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <strong style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>{lead.name || lead.email || "New lead"}</strong>
                    <small>{lead.serviceRequired || lead.company || lead.email || "Contact request"}</small>
                  </div>
                  <span className={`badge badge-${lead.status === "converted" ? "success" : lead.status === "contacted" ? "info" : lead.status === "rejected" ? "danger" : "brand"}`}>
                    {lead.status || "new"}
                  </span>
                </div>
              ))}
            </div>
          ) : <div className="empty-state">No leads yet. They'll appear here after visitors submit the contact form.</div>}
        </div>

        {/* System Status */}
        <div className="panel">
          <div className="panel-title-row">
            <div>
              <p className="eyebrow">System overview</p>
              <h2 className="panel-title" style={{ marginBottom: 0 }}>CMS Status</h2>
            </div>
            <Activity size={18} style={{ color: "var(--text-muted)" }} />
          </div>
          <div className="status-list">
            {[
              "Protected admin routes",
              "JWT session active",
              "MongoDB connected",
              "CRUD APIs wired",
              "Media uploads enabled",
              "Email notifications ready",
            ].map(item => (
              <div className="status-line" key={item}>
                <CheckCircle2 size={16} />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Media */}
        <div className="panel">
          <div className="panel-title-row">
            <div>
              <p className="eyebrow">Recent uploads</p>
              <h2 className="panel-title" style={{ marginBottom: 0 }}>Media Activity</h2>
            </div>
            <button className="btn-secondary compact" onClick={() => setView("media")}>Library</button>
          </div>
          {(data?.recentUploads || []).length ? (
            <div className="mini-list">
              {data.recentUploads.slice(0, 6).map(asset => (
                <div className="mini-row" key={asset._id}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <strong style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>{asset.title || asset.originalName || "Media asset"}</strong>
                    <small>{asset.folder || "root"}</small>
                  </div>
                  <span className={`badge ${asset.type === "video" ? "badge-info" : "badge-muted"}`}>{asset.type || "file"}</span>
                </div>
              ))}
            </div>
          ) : <div className="empty-state">Upload images and videos to build your media library.</div>}
        </div>
      </div>
    </section>
  );
}
