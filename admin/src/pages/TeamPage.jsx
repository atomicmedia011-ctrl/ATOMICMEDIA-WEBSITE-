import React, { useEffect, useMemo, useState } from "react";
import { Copy, Eye, ExternalLink, Plus, Save, Search, Star, Trash2 } from "lucide-react";
import { api, assetUrl } from "../api/client";
import ConfirmModal from "../components/ConfirmModal";
import MediaField from "../components/MediaField";
import { useToast } from "../components/Toast";

function slugify(v) {
  return String(v || "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

const blank = {
  name: "", position: "", bio: "", profilePicture: null,
  videos: [], reels: [], socialLinks: {}, isCore: false, enabled: true, order: 0
};

const socialPlatforms = [
  { key: "instagram", label: "Instagram", placeholder: "https://instagram.com/…" },
  { key: "linkedin", label: "LinkedIn", placeholder: "https://linkedin.com/in/…" },
  { key: "twitter", label: "X / Twitter", placeholder: "https://x.com/…" },
  { key: "facebook", label: "Facebook", placeholder: "https://facebook.com/…" },
  { key: "youtube", label: "YouTube", placeholder: "https://youtube.com/@…" },
];

export default function TeamPage() {
  const [items, setItems] = useState([]);
  const [active, setActive] = useState(null);
  const [query, setQuery] = useState("");
  const [confirm, setConfirm] = useState(null);
  const [saving, setSaving] = useState(false);
  const notify = useToast();

  async function load() {
    const r = await api("/api/admin/team?limit=100");
    const list = r.items || [];
    setItems(list);
    setActive(cur => {
      const found = cur?._id ? list.find(m => m._id === cur._id) : null;
      return found || list[0] || { ...blank };
    });
  }

  useEffect(() => { load().catch(e => notify(e.message, "error")); }, []);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return items.filter(m => `${m.name} ${m.position}`.toLowerCase().includes(q));
  }, [items, query]);

  function updateField(f, v) { setActive(cur => ({ ...cur, [f]: v })); }

  function updateSocial(k, v) {
    setActive(cur => ({ ...cur, socialLinks: { ...(cur.socialLinks || {}), [k]: v } }));
  }

  async function save() {
    if (!active?.name?.trim()) { notify("Name is required", "error"); return; }
    setSaving(true);
    try {
      const body = { ...active, order: Number(active.order || 0) };
      const method = body._id ? "PATCH" : "POST";
      const path = body._id ? `/api/admin/team/${body._id}` : "/api/admin/team";
      const saved = await api(path, { method, body });
      notify(body._id ? "Team member updated ✓" : "Team member created ✓");
      setActive(saved); await load();
    } catch (e) { notify(e.message, "error"); }
    finally { setSaving(false); }
  }

  async function duplicate() {
    const copy = { ...active, _id: undefined, name: `${active.name} Copy` };
    const saved = await api("/api/admin/team", { method: "POST", body: copy });
    notify("Duplicated"); setActive(saved); await load();
  }

  async function remove() {
    await api(`/api/admin/team/${confirm._id}`, { method: "DELETE" });
    setConfirm(null); notify("Deleted"); await load();
  }

  async function quickToggle(field) {
    if (!active?._id) { updateField(field, !active[field]); return; }
    const saved = await api(`/api/admin/team/${active._id}`, { method: "PATCH", body: { [field]: !active[field] } });
    setActive(saved); await load();
  }

  const thumb = active?.profilePicture?.url || "";
  const folder = `team/${slugify(active?.name || "member")}`;
  const isNew = !active?._id;

  return (
    <section className="workspace">
      <div className="page-header">
        <div className="page-header-text">
          <p className="eyebrow">Content CMS</p>
          <h1>Team</h1>
          <p>Manage your team members — profile photos, bio, designations, social links, and core-member placement.</p>
        </div>
        <div className="page-header-actions">
          <button className="btn-secondary" onClick={() => setActive({ ...blank })}><Plus size={16} /> Add Member</button>
          {active?._id && <button className="btn-secondary" onClick={duplicate}><Copy size={16} /> Duplicate</button>}
          <button onClick={save} disabled={saving}><Save size={16} /> {isNew ? "Create" : "Update"}</button>
          {active?._id && <button className="btn-danger" onClick={() => setConfirm(active)}><Trash2 size={16} /></button>}
        </div>
      </div>

      <div className="project-grid-layout">
        <aside className="project-browser">
          <div className="project-search">
            <Search size={15} />
            <input placeholder="Search team…" value={query} onChange={e => setQuery(e.target.value)} />
          </div>
          <div className="project-list">
            {filtered.map(m => (
              <button key={m._id} className={`project-list-card${active?._id === m._id ? " active" : ""}`} onClick={() => setActive(m)}>
                <div className="project-list-image" style={{ borderRadius: "50%" }}>
                  {m.profilePicture?.url
                    ? <img src={assetUrl(m.profilePicture.url)} alt={m.name} style={{ borderRadius: "50%" }} />
                    : <span style={{ fontSize: 20 }}>👤</span>}
                </div>
                <div>
                  <strong>{m.name}</strong>
                  <small>{m.position || "—"}</small>
                  <small>
                    {m.isCore && <span className="badge badge-brand" style={{ fontSize: 9, padding: "1px 6px" }}>Core</span>}
                    {" "}
                    <span className={`badge ${m.enabled ? "badge-success" : "badge-muted"}`} style={{ fontSize: 9, padding: "1px 6px" }}>
                      {m.enabled ? "Visible" : "Hidden"}
                    </span>
                  </small>
                </div>
              </button>
            ))}
            {!filtered.length && <div className="empty-state" style={{ margin: 12 }}>No team members found.</div>}
          </div>
          <button className="browser-add-btn" onClick={() => setActive({ ...blank })}><Plus size={15} /> Add Member</button>
        </aside>

        {active && (
          <div className="editor-panel">
            <div className="preview-strip">
              <div className="preview-image" style={{ borderRadius: "50%", overflow: "hidden", width: 80, height: 80, flexShrink: 0 }}>
                {thumb ? <img src={assetUrl(thumb)} alt={active.name} style={{ borderRadius: "50%" }} /> : <span style={{ fontSize: 28 }}>👤</span>}
              </div>
              <div className="preview-info">
                <h2>{active.name || "New Member"}</h2>
                <p>{active.position || "Add their designation below."}</p>
                <div className="preview-pills">
                  <button className={`pill${active.enabled ? " active" : ""}`} onClick={() => quickToggle("enabled")}>
                    <Eye size={13} /> {active.enabled ? "Visible" : "Hidden"}
                  </button>
                  <button className={`pill${active.isCore ? " active" : ""}`} onClick={() => quickToggle("isCore")}>
                    <Star size={13} /> {active.isCore ? "Core Member" : "Make Core"}
                  </button>
                </div>
              </div>
            </div>

            <div className="editor-body">
              <div className="form-grid">
                <label className="field">
                  <span>Full Name *</span>
                  <input value={active.name || ""} onChange={e => updateField("name", e.target.value)} placeholder="Jane Smith" />
                </label>
                <label className="field">
                  <span>Position / Designation</span>
                  <input value={active.position || ""} onChange={e => updateField("position", e.target.value)} placeholder="Senior Photographer" />
                </label>
                <label className="field">
                  <span>Display Order</span>
                  <input type="number" value={active.order || 0} onChange={e => updateField("order", e.target.value)} />
                </label>
              </div>

              <div className="divider" />
              <div className="form-grid cols-1">
                <label className="field">
                  <span>Bio</span>
                  <textarea rows={5} value={active.bio || ""} onChange={e => updateField("bio", e.target.value)} placeholder="A short biography about this team member…" />
                </label>
              </div>

              <div className="divider" />
              <div className="editor-section-title">Profile Photo &amp; Media</div>
              <div className="project-media-section">
                <MediaField label="Profile Photo" value={active.profilePicture} accept="image" defaultFolder={folder} onChange={v => updateField("profilePicture", v)} />
                <MediaField label="Videos" value={active.videos || []} accept="video" multiple defaultFolder={`${folder}/videos`} onChange={v => updateField("videos", v)} />
                <MediaField label="Reels" value={active.reels || []} accept="video" multiple defaultFolder={`${folder}/reels`} onChange={v => updateField("reels", v)} />
              </div>

              <div className="divider" />
              <div className="editor-section-title"><ExternalLink size={14} /> Social Links</div>
              <div className="form-grid">
                {socialPlatforms.map(({ key, label, placeholder }) => (
                  <label key={key} className="field">
                    <span>{label}</span>
                    <input value={(active.socialLinks || {})[key] || ""} onChange={e => updateSocial(key, e.target.value)} placeholder={placeholder} />
                  </label>
                ))}
              </div>
            </div>

            <div className="editor-actions">
              <button className="btn-secondary" onClick={() => active?._id ? load() : setActive({ ...blank })}>Cancel</button>
              <button onClick={save} disabled={saving}><Save size={15} /> {isNew ? "Create Member" : "Save Changes"}</button>
            </div>
          </div>
        )}
      </div>

      <ConfirmModal
        open={!!confirm}
        title="Remove team member?"
        body={`Remove "${confirm?.name}" from the CMS?`}
        onCancel={() => setConfirm(null)}
        onConfirm={remove}
      />
    </section>
  );
}
