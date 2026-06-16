import React, { useEffect, useMemo, useState } from "react";
import { Download, Search } from "lucide-react";
import { api } from "../api/client";
import { useToast } from "../components/Toast";

const statuses = ["new", "contacted", "converted", "rejected"];

export default function Leads() {
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const notify = useToast();

  async function load() {
    setLoading(true);
    try {
      const data = await api("/api/admin/leads");
      setItems(data.items || []);
    } catch (error) {
      notify(error.message, "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const needle = query.toLowerCase();
    return items.filter((lead) => {
      const matchesStatus = status === "all" || lead.status === status;
      const matchesQuery = `${lead.name} ${lead.email} ${lead.phone} ${lead.company} ${lead.serviceRequired} ${lead.message}`.toLowerCase().includes(needle);
      return matchesStatus && matchesQuery;
    });
  }, [items, query, status]);

  async function updateStatus(lead, nextStatus) {
    try {
      const saved = await api(`/api/admin/leads/${lead._id}`, { method: "PATCH", body: { status: nextStatus } });
      setItems((current) => current.map((item) => item._id === saved._id ? saved : item));
      notify("Lead status updated");
    } catch (error) {
      notify(error.message, "error");
    }
  }

  return (
    <section className="workspace">
      <div className="section-head">
        <div>
          <p className="eyebrow">Contact form</p>
          <h1>Leads</h1>
          <p className="section-description">Search, filter, and update every website enquiry without touching code.</p>
        </div>
        <a className="button-link" href="/api/admin/leads/export.csv"><Download size={18} /> Export CSV</a>
      </div>

      <div className="toolbar-row">
        <div className="project-search">
          <Search size={18} />
          <input placeholder="Search name, email, phone, service, message" value={query} onChange={(event) => setQuery(event.target.value)} />
        </div>
        <select value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="all">All statuses</option>
          {statuses.map((item) => <option value={item} key={item}>{item}</option>)}
        </select>
      </div>

      <div className="table lead-table">
        <div className="table-row table-head">
          <strong>Lead</strong>
          <span>Service</span>
          <span>Message</span>
          <span>Status</span>
          <span>Received</span>
        </div>
        {loading && <div className="empty-state">Loading leads...</div>}
        {!loading && !filtered.length && <div className="empty-state">No leads match this view.</div>}
        {filtered.map((lead) => (
          <div className="table-row" key={lead._id}>
            <div>
              <strong>{lead.name || "Unnamed lead"}</strong>
              <small>{lead.email || "No email"} {lead.phone ? `· ${lead.phone}` : ""}</small>
            </div>
            <span>{lead.serviceRequired || lead.company || "-"}</span>
            <span>{lead.message || "-"}</span>
            <select value={lead.status || "new"} onChange={(event) => updateStatus(lead, event.target.value)}>
              {statuses.map((item) => <option value={item} key={item}>{item}</option>)}
            </select>
            <small>{lead.createdAt ? new Date(lead.createdAt).toLocaleString() : "-"}</small>
          </div>
        ))}
      </div>
    </section>
  );
}
