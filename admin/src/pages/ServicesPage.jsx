import React, { useEffect, useMemo, useState } from "react";
import { Copy, Eye, Plus, Save, Search, Trash2 } from "lucide-react";
import { api, assetUrl } from "../api/client";
import ConfirmModal from "../components/ConfirmModal";
import MediaField from "../components/MediaField";
import { useToast } from "../components/Toast";

function slugify(v) {
  return String(v || "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

const blank = {
  title: "", slug: "", category: "", summary: "", body: "",
  icon: "", order: 0, enabled: true, image: null, images: [], videos: [], reels: [], seo: {}
};

const categoryOptions = [
  "Photography", "Videography", "Social Media", "Branding", "Web Design",
  "Event Coverage", "Commercial", "Corporate", "Wedding", "Product"
];

export default function ServicesPage() {
  const [items, setItems] = useState([]);
  const [active, setActive] = useState(null);
  const [query, setQuery] = useState("");
  const [confirm, setConfirm] = useState(null);
  const [saving, setSaving] = useState(false);
  const notify = useToast();

  async function load() {
    const r = await api("/api/admin/services?limit=100");
    const list = r.items || [];
    setItems(list);
    setActive(cur => {
      const found = cur?._id ? list.find(s => s._id === cur._id) : null;
      return found || list[0] || { ...blank };
    });
  }

  useEffect(() => { load().catch(e => notify(e.message, "error")); }, []);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return items.filter(s => `${s.title} ${s.category} ${s.slug}`.toLowerCase().includes(q));
  }, [items, query]);

  function updateField(f, v) {
    setActive(cur => {
      const next = { ...cur, [f]: v };
      if (f === "title" && !cur._id && !cur.slug) next.slug = slugify(v);
      return next;
    });
  }

  async function save() {
    if (!active?.title?.trim()) { notify("Title is required", "error"); return; }
    setSaving(true);
    try {
      const body = { ...active, order: Number(active.order || 0) };
      if (!body.slug && body.title) body.slug = slugify(body.title);
      const method = body._id ? "PATCH" : "POST";
      const path = body._id ? `/api/admin/services/${body._id}` : "/api/admin/services";
      const saved = await api(path, { method, body });
      notify(body._id ? "Service updated ✓" : "Service created ✓");
      setActive(saved);
      await load();
    } catch (e) { notify(e.message, "error"); }
    finally { setSaving(false); }
  }

  async function duplicate() {
    const copy = { ...active, _id: undefined, title: `${active.title} Copy`, slug: `${active.slug}-copy` };
    const saved = await api("/api/admin/services", { method: "POST", body: copy });
    notify("Duplicated"); setActive(saved); await load();
  }

  async function remove() {
    await api(`/api/admin/services/${confirm._id}`, { method: "DELETE" });
    setConfirm(null); notify("Service deleted"); await load();
  }

  async function quickToggle() {
    if (!active?._id) { updateField("enabled", !active.enabled); return; }
    const saved = await api(`/api/admin/services/${active._id}`, { method: "PATCH", body: { enabled: !active.enabled } });
    setActive(saved); await load();
  }

  const thumb = active?.image?.url || active?.images?.[0]?.url || "";
  const isNew = !active?._id;

  return (
    <section className="workspace">
      <div className="page-header">
        <div className="page-header-text">
          <p className="eyebrow">Content CMS</p>
          <h1>Services</h1>
          <p>Manage all service offerings displayed on the website — edit descriptions, categories, icons, media, and ordering.</p>
        </div>
        <div className="page-header-actions">
          <button className="btn-secondary" onClick={() => setActive({ ...blank })}>
            <Plus size={16} /> New Service
          </button>
          {active?._id && <button className="btn-secondary" onClick={duplicate}><Copy size={16} /> Duplicate</button>}
          <button onClick={save} disabled={saving}><Save size={16} /> {isNew ? "Create" : "Update"}</button>
          {active?._id && <button className="btn-danger" onClick={() => setConfirm(active)}><Trash2 size={16} /></button>}
        </div>
      </div>

      <div className="project-grid-layout">
        <aside className="project-browser">
          <div className="project-search">
            <Search size={15} />
            <input placeholder="Search services…" value={query} onChange={e => setQuery(e.target.value)} />
          </div>
          <div className="project-list">
            {filtered.map(s => (
              <button key={s._id} className={`project-list-card${active?._id === s._id ? " active" : ""}`} onClick={() => setActive(s)}>
                <div className="project-list-image">
                  {s.image?.url ? <img src={assetUrl(s.image.url)} alt={s.title} /> : <span style={{ fontSize: 24 }}>{s.icon || "⚡"}</span>}
                </div>
                <div>
                  <strong>{s.title}</strong>
                  <small>{s.category || "Uncategorised"}</small>
                  <small>
                    <span className={`badge ${s.enabled ? "badge-success" : "badge-muted"}`} style={{ fontSize: 9, padding: "1px 6px" }}>
                      {s.enabled ? "Live" : "Hidden"}
                    </span>
                  </small>
                </div>
              </button>
            ))}
            {!filtered.length && <div className="empty-state" style={{ margin: 12 }}>No services found.</div>}
          </div>
          <button className="browser-add-btn" onClick={() => setActive({ ...blank })}><Plus size={15} /> Add Service</button>
        </aside>

        {active && (
          <div className="editor-panel">
            <div className="preview-strip">
              <div className="preview-image">
                {thumb ? <img src={assetUrl(thumb)} alt={active.title} /> : <span style={{ fontSize: 32 }}>{active.icon || "⚡"}</span>}
              </div>
              <div className="preview-info">
                <h2>{active.title || "New Service"}</h2>
                <p>{active.summary || "Add a summary to preview it here."}</p>
                <div className="preview-pills">
                  <button className={`pill${active.enabled ? " active" : ""}`} onClick={quickToggle}>
                    <Eye size={13} /> {active.enabled ? "Visible" : "Hidden"}
                  </button>
                </div>
              </div>
            </div>

            <div className="editor-body">
              <div className="form-grid">
                <label className="field">
                  <span>Service Title *</span>
                  <input value={active.title || ""} onChange={e => updateField("title", e.target.value)} placeholder="Photography" />
                </label>
                <label className="field">
                  <span>URL Slug</span>
                  <input value={active.slug || ""} onChange={e => updateField("slug", e.target.value)} />
                </label>
                <label className="field">
                  <span>Category</span>
                  <select value={active.category || ""} onChange={e => updateField("category", e.target.value)}>
                    <option value="">— Select category —</option>
                    {categoryOptions.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </label>
                <label className="field">
                  <span>Icon (emoji or text)</span>
                  <input value={active.icon || ""} onChange={e => updateField("icon", e.target.value)} placeholder="📸 or camera" />
                </label>
                <label className="field">
                  <span>Display Order</span>
                  <input type="number" value={active.order || 0} onChange={e => updateField("order", e.target.value)} />
                </label>
              </div>

              <div className="divider" />
              <div className="form-grid cols-1">
                <label className="field">
                  <span>Short Summary</span>
                  <textarea rows={3} value={active.summary || ""} onChange={e => updateField("summary", e.target.value)} placeholder="One sentence describing this service…" />
                </label>
                <label className="field">
                  <span>Full Description</span>
                  <textarea rows={7} value={active.body || ""} onChange={e => updateField("body", e.target.value)} placeholder="Detailed description, what's included, outcomes…" />
                </label>
              </div>

              <div className="divider" />
              <div className="editor-section-title"><span>Media</span></div>
              <div className="project-media-section">
                <MediaField label="Featured Image" value={active.image} accept="image" defaultFolder={`services/${active.slug || "new"}`} onChange={v => updateField("image", v)} />
                <MediaField label="Gallery Images" value={active.images || []} accept="image" multiple defaultFolder={`services/${active.slug || "new"}/photos`} onChange={v => updateField("images", v)} />
                <MediaField label="Videos" value={active.videos || []} accept="video" multiple defaultFolder={`services/${active.slug || "new"}/videos`} onChange={v => updateField("videos", v)} />
                <MediaField label="Reels" value={active.reels || []} accept="video" multiple defaultFolder={`services/${active.slug || "new"}/reels`} onChange={v => updateField("reels", v)} />
              </div>
            </div>

            <div className="editor-actions">
              <button className="btn-secondary" onClick={() => active?._id ? load() : setActive({ ...blank })}>Cancel</button>
              <button onClick={save} disabled={saving}><Save size={15} /> {isNew ? "Create Service" : "Save Changes"}</button>
            </div>
          </div>
        )}
      </div>

      <ConfirmModal
        open={!!confirm}
        title="Delete service?"
        body={`Remove "${confirm?.title}" from the CMS? This cannot be undone.`}
        onCancel={() => setConfirm(null)}
        onConfirm={remove}
      />
    </section>
  );
}
