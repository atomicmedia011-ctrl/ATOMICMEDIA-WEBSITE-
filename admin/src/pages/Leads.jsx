import React, { useEffect, useMemo, useState } from "react";
import { Download, Eye, LayoutGrid, List, Mail, MessageCircle, Phone, Search, X } from "lucide-react";
import { api } from "../api/client";
import { useToast } from "../components/Toast";

const STATUSES = ["new", "contacted", "converted", "rejected"];

const STATUS_CONFIG = {
  new: { label: "New", color: "badge-brand" },
  contacted: { label: "Contacted", color: "badge-info" },
  converted: { label: "Converted", color: "badge-success" },
  rejected: { label: "Rejected", color: "badge-danger" },
};

function LeadDetail({ lead, onClose, onStatusChange }) {
  if (!lead) return null;
  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ width: "min(620px, 96vw)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <h2 style={{ marginBottom: 4 }}>{lead.name || "Unnamed Lead"}</h2>
            <span className={`badge ${STATUS_CONFIG[lead.status || "new"]?.color || "badge-muted"}`}>
              {STATUS_CONFIG[lead.status || "new"]?.label}
            </span>
          </div>
          <button className="btn-icon" onClick={onClose}><X size={16} /></button>
        </div>

        <div style={{ display: "grid", gap: 12 }}>
          {[
            ["Email", lead.email, Mail],
            ["Phone", lead.phone, Phone],
            ["WhatsApp", lead.whatsapp, MessageCircle],
            ["Company", lead.company, null],
            ["Service Required", lead.serviceRequired, null],
            ["Source Page", lead.sourcePage, null],
          ].filter(([, val]) => val).map(([label, val, Icon]) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "rgba(255,255,255,0.04)", borderRadius: "var(--r)", border: "1px solid var(--line)" }}>
              {Icon && <Icon size={14} style={{ color: "var(--text-muted)", flexShrink: 0 }} />}
              <span style={{ color: "var(--text-muted)", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", width: 120, flexShrink: 0 }}>{label}</span>
              <span style={{ fontSize: 13, color: "var(--text)" }}>{val}</span>
            </div>
          ))}

          {lead.message && (
            <div style={{ padding: "12px", background: "rgba(255,255,255,0.04)", borderRadius: "var(--r)", border: "1px solid var(--line)" }}>
              <div style={{ color: "var(--text-muted)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Message</div>
              <p style={{ fontSize: 14, color: "var(--text-soft)", lineHeight: 1.6, margin: 0 }}>{lead.message}</p>
            </div>
          )}

          <div>
            <div style={{ color: "var(--text-muted)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Update Status</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {STATUSES.map(s => (
                <button
                  key={s}
                  className={lead.status === s ? "" : "btn-secondary"}
                  style={{ minHeight: 34, fontSize: 12 }}
                  onClick={() => onStatusChange(lead, s)}
                >
                  {STATUS_CONFIG[s].label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--line)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <small style={{ color: "var(--text-muted)" }}>Received {lead.createdAt ? new Date(lead.createdAt).toLocaleString() : "—"}</small>
          <button className="btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

export default function Leads() {
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [view, setView] = useState("table"); // "table" | "kanban"
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const notify = useToast();

  async function load() {
    setLoading(true);
    try {
      const data = await api("/api/admin/leads");
      setItems(data.items || []);
    } catch (e) { notify(e.message, "error"); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return items.filter(lead => {
      const matchStatus = statusFilter === "all" || lead.status === statusFilter;
      const matchQuery = `${lead.name} ${lead.email} ${lead.phone} ${lead.company} ${lead.serviceRequired} ${lead.message}`.toLowerCase().includes(q);
      return matchStatus && matchQuery;
    });
  }, [items, query, statusFilter]);

  async function updateStatus(lead, status) {
    try {
      const saved = await api(`/api/admin/leads/${lead._id}`, { method: "PATCH", body: { status } });
      setItems(cur => cur.map(l => l._id === saved._id ? saved : l));
      if (detail?._id === lead._id) setDetail(saved);
      notify("Status updated ✓");
    } catch (e) { notify(e.message, "error"); }
  }

  const byStatus = status => filtered.filter(l => (l.status || "new") === status);

  return (
    <section className="workspace">
      <div className="page-header">
        <div className="page-header-text">
          <p className="eyebrow">CRM</p>
          <h1>Leads</h1>
          <p>Manage every enquiry from your website. Update status, view messages, and export contacts.</p>
        </div>
        <div className="page-header-actions">
          <button className={`btn-secondary${view === "table" ? " active" : ""}`} onClick={() => setView("table")} style={view === "table" ? { borderColor: "var(--brand)", color: "var(--brand-bright)" } : {}}>
            <List size={15} /> Table
          </button>
          <button className={`btn-secondary${view === "kanban" ? " active" : ""}`} onClick={() => setView("kanban")} style={view === "kanban" ? { borderColor: "var(--brand)", color: "var(--brand-bright)" } : {}}>
            <LayoutGrid size={15} /> Kanban
          </button>
          <a className="button-link" href="/api/admin/leads/export.csv"><Download size={15} /> Export CSV</a>
        </div>
      </div>

      {/* Filters */}
      <div className="leads-toolbar">
        <div className="project-search" style={{ flex: "1 1 260px", maxWidth: 420 }}>
          <Search size={15} />
          <input placeholder="Search name, email, service, message…" value={query} onChange={e => setQuery(e.target.value)} />
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {["all", ...STATUSES].map(s => (
            <button
              key={s}
              className={statusFilter === s ? "" : "btn-secondary"}
              style={{ minHeight: 34, fontSize: 12, padding: "0 12px" }}
              onClick={() => setStatusFilter(s)}
            >
              {s === "all" ? "All" : STATUS_CONFIG[s].label}
              {s !== "all" && <span className="nav-btn-badge">{items.filter(l => (l.status || "new") === s).length}</span>}
            </button>
          ))}
        </div>
      </div>

      {loading && <div className="empty-state">Loading leads…</div>}

      {/* Table view */}
      {!loading && view === "table" && (
        <div className="leads-table">
          <div className="table-head-row">
            <strong>Lead</strong>
            <span>Service / Company</span>
            <span>Message</span>
            <span>Status</span>
            <span>Received</span>
          </div>
          {!filtered.length && (
            <div className="empty-state" style={{ borderRadius: 0, border: 0, borderTop: "1px solid var(--line)" }}>
              No leads match this filter.
            </div>
          )}
          {filtered.map(lead => (
            <div className="table-data-row" key={lead._id} onClick={() => setDetail(lead)} style={{ cursor: "pointer" }}>
              <div>
                <strong>{lead.name || "Unnamed"}</strong>
                <small>{lead.email || "—"} {lead.phone ? `· ${lead.phone}` : ""}</small>
              </div>
              <span style={{ color: "var(--text-soft)", fontSize: 13 }}>{lead.serviceRequired || lead.company || "—"}</span>
              <span style={{ color: "var(--text-muted)", fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{lead.message || "—"}</span>
              <span className={`badge ${STATUS_CONFIG[lead.status || "new"]?.color || "badge-muted"}`}>
                {STATUS_CONFIG[lead.status || "new"]?.label}
              </span>
              <small>{lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : "—"}</small>
            </div>
          ))}
        </div>
      )}

      {/* Kanban view */}
      {!loading && view === "kanban" && (
        <div className="lead-kanban">
          {STATUSES.map(status => (
            <div key={status} className="kanban-col">
              <div className="kanban-col-header">
                <h3>{STATUS_CONFIG[status].label}</h3>
                <span className={`badge ${STATUS_CONFIG[status].color}`}>{byStatus(status).length}</span>
              </div>
              <div className="kanban-cards">
                {byStatus(status).length === 0 && (
                  <div style={{ fontSize: 12, color: "var(--text-dim)", textAlign: "center", padding: "12px 0" }}>Empty</div>
                )}
                {byStatus(status).map(lead => (
                  <div key={lead._id} className="kanban-card" onClick={() => setDetail(lead)}>
                    <strong>{lead.name || "Unnamed Lead"}</strong>
                    <small>{lead.serviceRequired || lead.company || lead.email || "—"}</small>
                    {lead.message && (
                      <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6, lineHeight: 1.5, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                        {lead.message}
                      </p>
                    )}
                    <div style={{ marginTop: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <small style={{ color: "var(--text-dim)", fontSize: 10 }}>{lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : ""}</small>
                      <Eye size={12} style={{ color: "var(--text-dim)" }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <LeadDetail lead={detail} onClose={() => setDetail(null)} onStatusChange={updateStatus} />
    </section>
  );
}
