import React, { useEffect, useMemo, useState } from "react";
import { Copy, Eye, Plus, Save, Search, Star, Trash2 } from "lucide-react";
import { api, assetUrl } from "../api/client";
import ConfirmModal from "../components/ConfirmModal";
import MediaField from "../components/MediaField";
import { useToast } from "../components/Toast";

const blank = {
  clientName: "", designation: "", company: "", quote: "",
  rating: 5, image: null, video: null, reels: [], enabled: true, order: 0
};

function StarRating({ value = 5, onChange }) {
  return (
    <div style={{ display: "flex", gap: 4 }}>
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          style={{
            background: "none", border: "none", cursor: "pointer", padding: "4px",
            color: n <= value ? "#f59e0b" : "var(--text-dim)", fontSize: 22,
            minHeight: "unset", boxShadow: "none"
          }}
        >★</button>
      ))}
    </div>
  );
}

export default function TestimonialsPage() {
  const [items, setItems] = useState([]);
  const [active, setActive] = useState(null);
  const [query, setQuery] = useState("");
  const [confirm, setConfirm] = useState(null);
  const [saving, setSaving] = useState(false);
  const notify = useToast();

  async function load() {
    const r = await api("/api/admin/testimonials?limit=100");
    const list = r.items || [];
    setItems(list);
    setActive(cur => {
      const found = cur?._id ? list.find(t => t._id === cur._id) : null;
      return found || list[0] || { ...blank };
    });
  }

  useEffect(() => { load().catch(e => notify(e.message, "error")); }, []);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return items.filter(t => `${t.clientName} ${t.company} ${t.quote}`.toLowerCase().includes(q));
  }, [items, query]);

  function updateField(f, v) { setActive(cur => ({ ...cur, [f]: v })); }

  async function save() {
    if (!active?.clientName?.trim()) { notify("Client name is required", "error"); return; }
    setSaving(true);
    try {
      const body = { ...active, rating: Number(active.rating || 5), order: Number(active.order || 0) };
      const method = body._id ? "PATCH" : "POST";
      const path = body._id ? `/api/admin/testimonials/${body._id}` : "/api/admin/testimonials";
      const saved = await api(path, { method, body });
      notify(body._id ? "Testimonial updated ✓" : "Testimonial created ✓");
      setActive(saved); await load();
    } catch (e) { notify(e.message, "error"); }
    finally { setSaving(false); }
  }

  async function duplicate() {
    const copy = { ...active, _id: undefined, clientName: `${active.clientName} Copy` };
    const saved = await api("/api/admin/testimonials", { method: "POST", body: copy });
    notify("Duplicated"); setActive(saved); await load();
  }

  async function remove() {
    await api(`/api/admin/testimonials/${confirm._id}`, { method: "DELETE" });
    setConfirm(null); notify("Deleted"); await load();
  }

  async function quickToggle() {
    if (!active?._id) { updateField("enabled", !active.enabled); return; }
    const saved = await api(`/api/admin/testimonials/${active._id}`, { method: "PATCH", body: { enabled: !active.enabled } });
    setActive(saved); await load();
  }

  const thumb = active?.image?.url || "";
  const isNew = !active?._id;

  return (
    <section className="workspace">
      <div className="page-header">
        <div className="page-header-text">
          <p className="eyebrow">Social Proof</p>
          <h1>Testimonials</h1>
          <p>Manage client reviews, star ratings, photos, and video testimonials shown across the website.</p>
        </div>
        <div className="page-header-actions">
          <button className="btn-secondary" onClick={() => setActive({ ...blank })}><Plus size={16} /> Add Review</button>
          {active?._id && <button className="btn-secondary" onClick={duplicate}><Copy size={16} /> Duplicate</button>}
          <button onClick={save} disabled={saving}><Save size={16} /> {isNew ? "Create" : "Update"}</button>
          {active?._id && <button className="btn-danger" onClick={() => setConfirm(active)}><Trash2 size={16} /></button>}
        </div>
      </div>

      <div className="project-grid-layout">
        <aside className="project-browser">
          <div className="project-search">
            <Search size={15} />
            <input placeholder="Search testimonials…" value={query} onChange={e => setQuery(e.target.value)} />
          </div>
          <div className="project-list">
            {filtered.map(t => (
              <button key={t._id} className={`project-list-card${active?._id === t._id ? " active" : ""}`} onClick={() => setActive(t)}>
                <div className="project-list-image" style={{ borderRadius: "50%" }}>
                  {t.image?.url ? <img src={assetUrl(t.image.url)} alt={t.clientName} style={{ borderRadius: "50%" }} /> : <span style={{ fontSize: 20 }}>💬</span>}
                </div>
                <div>
                  <strong>{t.clientName}</strong>
                  <small>{t.company || t.designation || "—"}</small>
                  <small style={{ color: "#f59e0b" }}>{"★".repeat(t.rating || 5)}</small>
                </div>
              </button>
            ))}
            {!filtered.length && <div className="empty-state" style={{ margin: 12 }}>No testimonials yet.</div>}
          </div>
          <button className="browser-add-btn" onClick={() => setActive({ ...blank })}><Plus size={15} /> Add Review</button>
        </aside>

        {active && (
          <div className="editor-panel">
            {/* Live quote preview */}
            <div style={{
              padding: "20px 24px",
              borderBottom: "1px solid var(--line)",
              background: "linear-gradient(135deg, rgba(255,107,0,0.06), rgba(99,102,241,0.04))"
            }}>
              <div style={{ display: "grid", gridTemplateColumns: "60px 1fr", gap: 16, alignItems: "center" }}>
                <div style={{ width: 60, height: 60, borderRadius: "50%", overflow: "hidden", background: "rgba(255,255,255,0.06)", display: "grid", placeItems: "center", fontSize: 22, flexShrink: 0, border: "2px solid var(--line)" }}>
                  {thumb ? <img src={assetUrl(thumb)} alt={active.clientName} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : "👤"}
                </div>
                <div>
                  <p style={{ color: "var(--text-soft)", fontSize: 14, lineHeight: 1.6, fontStyle: "italic", marginBottom: 8 }}>
                    "{active.quote || "Add the client's quote below…"}"
                  </p>
                  <strong style={{ fontSize: 14 }}>{active.clientName || "Client Name"}</strong>
                  {active.designation && <span style={{ color: "var(--text-muted)", fontSize: 12, marginLeft: 6 }}>— {active.designation}{active.company ? `, ${active.company}` : ""}</span>}
                  <div style={{ marginTop: 4, color: "#f59e0b" }}>{"★".repeat(active.rating || 5)}</div>
                </div>
              </div>
            </div>

            <div className="editor-body">
              <div className="form-grid">
                <label className="field">
                  <span>Client Name *</span>
                  <input value={active.clientName || ""} onChange={e => updateField("clientName", e.target.value)} placeholder="Jane Smith" />
                </label>
                <label className="field">
                  <span>Designation</span>
                  <input value={active.designation || ""} onChange={e => updateField("designation", e.target.value)} placeholder="CEO, Bride, Marketing Manager…" />
                </label>
                <label className="field">
                  <span>Company / Brand</span>
                  <input value={active.company || ""} onChange={e => updateField("company", e.target.value)} placeholder="Acme Inc." />
                </label>
                <label className="field">
                  <span>Display Order</span>
                  <input type="number" value={active.order || 0} onChange={e => updateField("order", e.target.value)} />
                </label>
              </div>

              <div className="divider" />
              <label className="field">
                <span>Star Rating</span>
                <StarRating value={active.rating || 5} onChange={v => updateField("rating", v)} />
              </label>

              <div className="divider" />
              <div className="form-grid cols-1">
                <label className="field">
                  <span>Quote / Review</span>
                  <textarea rows={6} value={active.quote || ""} onChange={e => updateField("quote", e.target.value)} placeholder="What did they say about your work?" />
                </label>
              </div>

              <div className="divider" />
              <div className="editor-section-title">Media</div>
              <div className="form-grid cols-1">
                <label className="field">
                  <span>Visibility</span>
                  <button className={`pill${active.enabled ? " active" : ""}`} style={{ width: "fit-content" }} onClick={quickToggle}>
                    <Eye size={13} /> {active.enabled ? "Visible on site" : "Hidden"}
                  </button>
                </label>
              </div>
              <div className="project-media-section">
                <MediaField label="Client Photo" value={active.image} accept="image" defaultFolder="testimonials/photos" onChange={v => updateField("image", v)} />
                <MediaField label="Video Testimonial" value={active.video} accept="video" defaultFolder="testimonials/videos" onChange={v => updateField("video", v)} />
                <MediaField label="Reels" value={active.reels || []} accept="video" multiple defaultFolder="testimonials/reels" onChange={v => updateField("reels", v)} />
              </div>
            </div>

            <div className="editor-actions">
              <button className="btn-secondary" onClick={() => active?._id ? load() : setActive({ ...blank })}>Cancel</button>
              <button onClick={save} disabled={saving}><Save size={15} /> {isNew ? "Create Testimonial" : "Save Changes"}</button>
            </div>
          </div>
        )}
      </div>

      <ConfirmModal
        open={!!confirm}
        title="Delete testimonial?"
        body={`Remove the review from "${confirm?.clientName}"?`}
        onCancel={() => setConfirm(null)}
        onConfirm={remove}
      />
    </section>
  );
}
