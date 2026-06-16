import React, { useEffect, useState } from "react";
import {
  Activity, ArrowUpRight, BriefcaseBusiness, CheckCircle2, FileText,
  Image, MessageSquare, MessageSquareQuote, Pencil, RadioTower, Sparkles
} from "lucide-react";
import { api } from "../api/client";
import StatCard from "../components/StatCard";

export default function Dashboard({ setView }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api("/api/admin/dashboard")
      .then((result) => {
        setData(result);
        setError("");
      })
      .catch((requestError) => {
        setData(null);
        setError(requestError.message);
      });
  }, []);

  const counts = data?.counts || {};
  const cards = [
    ["Total Projects", counts.totalProjects, BriefcaseBusiness, "Portfolio items synced to the site"],
    ["Active Services", counts.activeServices ?? counts.totalServices, Sparkles, "Service pages available to visitors"],
    ["Contact Leads", counts.leads, MessageSquare, "Messages captured from forms"],
    ["Testimonials", counts.totalTestimonials, MessageSquareQuote, "Client proof records"],
    ["Blog Posts", counts.totalBlogPosts, FileText, "Insights and articles"],
    ["Media Assets", counts.totalMedia, Image, "Images and videos in library"]
  ];

  const quickActions = [
    ["Edit Hero", "hero"],
    ["Add Project", "projects"],
    ["Manage Services", "services"],
    ["Review Leads", "leads"],
    ["Open Media", "media"],
    ["Website Settings", "settings"]
  ];

  return (
    <section className="workspace">
      <div className="section-head hero-admin-head">
        <div>
          <p className="eyebrow">Atomic Media Command Center</p>
          <h1>Dashboard</h1>
          <p className="section-description">Control the public website content, media, leads, SEO, and brand assets from one premium admin panel.</p>
        </div>
        <div className="status-card">
          <RadioTower size={20} />
          <div>
            <strong>Website Online</strong>
            <small>Frontend content refreshes after admin updates and page reload.</small>
          </div>
        </div>
      </div>

      <div className="metric-grid">
        {cards.map(([label, value, Icon, caption]) => (
          <StatCard key={label} label={label} value={value ?? "-"} icon={Icon} caption={caption} />
        ))}
      </div>

      {error && <div className="panel error-panel">Dashboard data could not be loaded: {error}</div>}

      <div className="dashboard-grid">
        <div className="panel quick-panel">
          <div className="panel-title-row">
            <div>
              <p className="eyebrow">Fast edits</p>
              <h2>Quick Actions</h2>
            </div>
            <Pencil size={20} />
          </div>
          <div className="quick-grid">
            {quickActions.map(([label, target]) => (
              <button className="quick-action" key={target} onClick={() => setView(target)}>
                <span>{label}</span>
                <ArrowUpRight size={17} />
              </button>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="panel-title-row">
            <div>
              <p className="eyebrow">Recent messages</p>
              <h2>Contact Leads</h2>
            </div>
            <button className="secondary compact" onClick={() => setView("leads")}>View All</button>
          </div>
          {(data?.recentLeads || []).length ? (
            <div className="mini-list">
              {data.recentLeads.map((lead) => (
                <div className="mini-row" key={lead._id}>
                  <div>
                    <strong>{lead.name || lead.email || "New lead"}</strong>
                    <small>{lead.serviceRequired || lead.company || lead.email || "Contact request"}</small>
                  </div>
                  <span className="status-dot">{lead.status || "new"}</span>
                </div>
              ))}
            </div>
          ) : <div className="empty-state">No recent messages yet.</div>}
        </div>

        <div className="panel">
          <div className="panel-title-row">
            <div>
              <p className="eyebrow">System overview</p>
              <h2>Website Status</h2>
            </div>
            <Activity size={20} />
          </div>
          <div className="status-list">
            {["Protected admin routes", "JWT session login", "CRUD APIs connected", "Media upload enabled"].map((item) => (
              <div className="status-line" key={item}><CheckCircle2 size={18} /><span>{item}</span></div>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="panel-title-row">
            <div>
              <p className="eyebrow">Recent uploads</p>
              <h2>Media Activity</h2>
            </div>
            <button className="secondary compact" onClick={() => setView("media")}>Library</button>
          </div>
          {(data?.recentUploads || []).length ? (
            <div className="mini-list">
              {data.recentUploads.slice(0, 5).map((asset) => (
                <div className="mini-row" key={asset._id}>
                  <div>
                    <strong>{asset.title || asset.originalName || "Media asset"}</strong>
                    <small>{asset.folder || asset.url}</small>
                  </div>
                  <span className="status-dot">{asset.type || "file"}</span>
                </div>
              ))}
            </div>
          ) : <div className="empty-state">Upload images and videos to start building the library.</div>}
        </div>
      </div>
    </section>
  );
}
