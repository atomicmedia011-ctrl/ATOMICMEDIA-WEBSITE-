import React, { useEffect, useMemo, useState } from "react";
import {
  Check, ChevronRight, Eye, FolderOpen, Image as ImageIcon,
  Info, Layers, Plus, RotateCcw, Save, Search, Settings2, Trash2, Upload
} from "lucide-react";
import { api, assetUrl } from "../api/client";
import ConfirmModal from "../components/ConfirmModal";
import MediaField from "../components/MediaField";
import { useToast } from "../components/Toast";

const TABS = [
  { id: "info", label: "Info", icon: Info },
  { id: "media", label: "Media", icon: ImageIcon },
  { id: "seo", label: "SEO", icon: Layers },
  { id: "advanced", label: "Advanced", icon: Settings2 },
];

const blankProject = {
  title: "", slug: "", excerpt: "", body: "", client: "", year: "",
  liveUrl: "", projectType: "", eventType: "", mediaFolder: "",
  categories: [], technologies: [], featured: false, enabled: true,
  order: 0, coverImage: null, images: [], videos: [], reels: [],
  detailSections: [], seo: {}
};

function slugify(v) {
  return String(v || "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function parseList(v) {
  return Array.isArray(v) ? v : String(v || "").split(",").map(s => s.trim()).filter(Boolean);
}

function parseJson(v, fb) {
  if (typeof v !== "string") return v || fb;
  if (!v.trim()) return fb;
  try { return JSON.parse(v); } catch { return fb; }
}

function folderFromProject(p) {
  const type = slugify(p.projectType || p.eventType || "general") || "general";
  const slug = slugify(p.slug || p.title || "new-project") || "new-project";
  return `projects/${type}/${slug}`;
}

function primaryImage(p) {
  return p?.coverImage?.url || p?.images?.[0]?.url || "";
}

// Tag chip input
function TagInput({ value = [], onChange, placeholder }) {
  const [input, setInput] = useState("");
  const tags = Array.isArray(value) ? value : String(value || "").split(",").map(s => s.trim()).filter(Boolean);

  function add(tag) {
    const t = tag.trim();
    if (t && !tags.includes(t)) onChange([...tags, t]);
    setInput("");
  }

  function remove(tag) { onChange(tags.filter(t => t !== tag)); }

  return (
    <div className="tag-input-wrap" onClick={e => e.currentTarget.querySelector("input")?.focus()}>
      {tags.map(tag => (
        <span key={tag} className="tag-chip">
          {tag}
          <button type="button" onClick={() => remove(tag)}>×</button>
        </span>
      ))}
      <input
        className="tag-input-inner"
        value={input}
        placeholder={tags.length ? "" : placeholder}
        onChange={e => setInput(e.target.value)}
        onKeyDown={e => {
          if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(input); }
          if (e.key === "Backspace" && !input && tags.length) remove(tags[tags.length - 1]);
        }}
        onBlur={() => { if (input.trim()) add(input); }}
      />
    </div>
  );
}

export default function ProjectManager() {
  const [projects, setProjects] = useState([]);
  const [active, setActive] = useState(blankProject);
  const [tab, setTab] = useState("info");
  const [query, setQuery] = useState("");
  const [confirm, setConfirm] = useState(null);
  const [saving, setSaving] = useState(false);
  const notify = useToast();

  async function load() {
    const r = await api("/api/admin/projects?limit=200");
    const list = r.items || [];
    setProjects(list);
    setActive(cur => {
      const found = cur?._id ? list.find(p => p._id === cur._id) : null;
      return found || list[0] || blankProject;
    });
  }

  useEffect(() => { load().catch(e => notify(e.message, "error")); }, []);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return projects.filter(p =>
      `${p.title} ${p.slug} ${(p.categories || []).join(" ")}`.toLowerCase().includes(q)
    );
  }, [projects, query]);

  function updateField(field, value) {
    setActive(cur => {
      const next = { ...cur, [field]: value };
      if (field === "title" && !cur._id && !cur.slug) next.slug = slugify(value);
      if (["title", "slug", "projectType", "eventType"].includes(field) && !cur.mediaFolder)
        next.mediaFolder = folderFromProject(next);
      return next;
    });
  }

  function buildPayload() {
    const slug = active.slug || slugify(active.title);
    const mediaFolder = active.mediaFolder || folderFromProject({ ...active, slug });
    return {
      ...active, slug, mediaFolder,
      categories: parseList(active.categories),
      technologies: parseList(active.technologies),
      order: Number(active.order || 0),
      detailSections: parseJson(active.detailSections, []),
      seo: parseJson(active.seo, {})
    };
  }

  async function save() {
    if (!active.title?.trim()) { notify("Title is required", "error"); return; }
    setSaving(true);
    try {
      const body = buildPayload();
      const method = body._id ? "PATCH" : "POST";
      const path = body._id ? `/api/admin/projects/${body._id}` : "/api/admin/projects";
      const saved = await api(path, { method, body });
      notify(body._id ? "Project updated ✓" : "Project created ✓");
      setActive(saved);
      await load();
    } catch (e) { notify(e.message, "error"); }
    finally { setSaving(false); }
  }

  async function duplicate() {
    const copy = {
      ...buildPayload(), _id: undefined,
      title: `${active.title} Copy`,
      slug: `${active.slug || slugify(active.title)}-copy`,
      mediaFolder: `${active.mediaFolder || folderFromProject(active)}-copy`,
      featured: false, order: Number(active.order || 0) + 1
    };
    const saved = await api("/api/admin/projects", { method: "POST", body: copy });
    notify("Project duplicated");
    setActive(saved);
    await load();
  }

  async function deleteProject() {
    await api(`/api/admin/projects/${confirm._id}`, { method: "DELETE" });
    setConfirm(null);
    notify("Project deleted");
    setActive(blankProject);
    await load();
  }

  async function quickToggle(field) {
    if (!active._id) { updateField(field, !active[field]); return; }
    const saved = await api(`/api/admin/projects/${active._id}`, { method: "PATCH", body: { [field]: !active[field] } });
    setActive(saved);
    await load();
  }

  const folder = active.mediaFolder || folderFromProject(active);
  const isNew = !active._id;

  return (
    <section className="workspace">
      {/* Page header */}
      <div className="page-header">
        <div className="page-header-text">
          <p className="eyebrow">Portfolio CMS</p>
          <h1>Projects</h1>
          <p>Add, edit, reorder, and publish projects. Each project supports cover images, photo galleries, videos, reels, and SEO.</p>
        </div>
        <div className="page-header-actions">
          <button className="btn-secondary" onClick={() => { setActive(blankProject); setTab("info"); }}>
            <Plus size={16} /> New Project
          </button>
          {active?._id && (
            <button className="btn-secondary" onClick={duplicate}><RotateCcw size={16} /> Duplicate</button>
          )}
          <button onClick={save} disabled={saving}>
            <Save size={16} /> {isNew ? "Create" : "Update"}
          </button>
          {active?._id && (
            <button className="btn-danger" onClick={() => setConfirm(active)}><Trash2 size={16} /></button>
          )}
        </div>
      </div>

      <div className="project-grid-layout">
        {/* Left: project browser */}
        <aside className="project-browser">
          <div className="project-search">
            <Search size={15} />
            <input placeholder="Search projects…" value={query} onChange={e => setQuery(e.target.value)} />
          </div>
          <div className="project-list">
            {filtered.map(p => (
              <button
                key={p._id}
                className={`project-list-card${active?._id === p._id ? " active" : ""}`}
                onClick={() => { setActive(p); setTab("info"); }}
              >
                <div className="project-list-image">
                  {primaryImage(p) ? <img src={assetUrl(primaryImage(p))} alt={p.title} /> : <span>No image</span>}
                </div>
                <div>
                  <strong>{p.title}</strong>
                  <small>
                    <span className={`badge ${p.enabled ? "badge-success" : "badge-muted"}`} style={{ fontSize: 9, padding: "1px 6px" }}>
                      {p.enabled ? "Live" : "Hidden"}
                    </span>
                    {" "}{p.featured ? "⭐ Featured" : ""}
                  </small>
                  <small style={{ marginTop: 2 }}>{p.projectType || p.eventType || "—"}</small>
                </div>
              </button>
            ))}
            {!filtered.length && <div className="empty-state" style={{ margin: 12 }}>No projects found.</div>}
          </div>
          <button className="browser-add-btn" onClick={() => { setActive(blankProject); setTab("info"); }}>
            <Plus size={15} /> Add New Project
          </button>
        </aside>

        {/* Right: editor */}
        <div className="editor-panel">
          {/* Preview strip */}
          <div className="preview-strip">
            <div className="preview-image">
              {primaryImage(active)
                ? <img src={assetUrl(primaryImage(active))} alt={active.title} />
                : <ImageIcon size={22} style={{ color: "var(--text-dim)" }} />}
            </div>
            <div className="preview-info">
              <h2>{active.title || "New Project"}</h2>
              <p>{active.excerpt || "Add a short description for this project."}</p>
              <div className="preview-pills">
                <button className={`pill${active.enabled ? " active" : ""}`} onClick={() => quickToggle("enabled")}>
                  <Eye size={13} /> {active.enabled ? "Visible" : "Hidden"}
                </button>
                <button className={`pill${active.featured ? " active" : ""}`} onClick={() => quickToggle("featured")}>
                  <Check size={13} /> {active.featured ? "Featured" : "Make Featured"}
                </button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="editor-tabs">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button key={id} className={`tab-btn${tab === id ? " active" : ""}`} onClick={() => setTab(id)}>
                <Icon size={14} />{label}
              </button>
            ))}
          </div>

          {/* Tab: Info */}
          {tab === "info" && (
            <div className="editor-body">
              <div className="form-grid">
                <label className="field">
                  <span>Project Title *</span>
                  <input value={active.title || ""} onChange={e => updateField("title", e.target.value)} placeholder="My Awesome Project" />
                </label>
                <label className="field">
                  <span>URL Slug</span>
                  <input value={active.slug || ""} onChange={e => updateField("slug", e.target.value)} placeholder="auto-generated" />
                </label>
                <label className="field">
                  <span>Client</span>
                  <input value={active.client || ""} onChange={e => updateField("client", e.target.value)} placeholder="Client name" />
                </label>
                <label className="field">
                  <span>Year</span>
                  <input value={active.year || ""} onChange={e => updateField("year", e.target.value)} placeholder="2024" />
                </label>
                <label className="field">
                  <span>Project Type</span>
                  <input value={active.projectType || ""} onChange={e => updateField("projectType", e.target.value)} placeholder="Wedding, corporate, product…" />
                </label>
                <label className="field">
                  <span>Event Type</span>
                  <input value={active.eventType || ""} onChange={e => updateField("eventType", e.target.value)} placeholder="Launch, campaign, reel shoot…" />
                </label>
                <label className="field">
                  <span>Live Website URL</span>
                  <input value={active.liveUrl || ""} onChange={e => updateField("liveUrl", e.target.value)} placeholder="https://example.com" />
                </label>
                <label className="field">
                  <span>Display Order</span>
                  <input type="number" value={active.order || 0} onChange={e => updateField("order", e.target.value)} />
                </label>
              </div>

              <div className="divider" />

              <div className="form-grid cols-1">
                <label className="field">
                  <span>Categories</span>
                  <TagInput value={active.categories} onChange={v => updateField("categories", v)} placeholder="Type and press Enter…" />
                </label>
                <label className="field">
                  <span>Technologies Used</span>
                  <TagInput value={active.technologies} onChange={v => updateField("technologies", v)} placeholder="React, GSAP, Node.js…" />
                </label>
                <label className="field">
                  <span>Short Description / Excerpt</span>
                  <textarea rows={3} value={active.excerpt || ""} onChange={e => updateField("excerpt", e.target.value)} placeholder="One or two sentences describing this project…" />
                </label>
                <label className="field">
                  <span>Full Project Details</span>
                  <textarea rows={6} value={active.body || ""} onChange={e => updateField("body", e.target.value)} placeholder="Detailed description, context, and outcomes…" />
                </label>
              </div>
            </div>
          )}

          {/* Tab: Media */}
          {tab === "media" && (
            <div className="editor-body">
              <div className="editor-section-title">
                <FolderOpen size={14} /> Media Folder: <code style={{ color: "var(--brand-bright)", fontSize: 12 }}>{folder}</code>
              </div>
              <div className="form-grid cols-1">
                <label className="field">
                  <span>Folder Path</span>
                  <input value={folder} onChange={e => updateField("mediaFolder", e.target.value)} />
                </label>
              </div>
              <div className="divider" />
              <div className="project-media-section">
                <div className="media-section-title"><Upload size={16} /> Upload Media</div>
                <MediaField label="Cover Image" value={active.coverImage} accept="image" defaultFolder={folder} onChange={v => updateField("coverImage", v)} />
                <MediaField label="Project Photos" value={active.images || []} accept="image" multiple defaultFolder={`${folder}/photos`} onChange={v => updateField("images", v)} />
                <MediaField label="Project Videos" value={active.videos || []} accept="video" multiple defaultFolder={`${folder}/videos`} onChange={v => updateField("videos", v)} />
                <MediaField label="Project Reels" value={active.reels || []} accept="video" multiple defaultFolder={`${folder}/reels`} onChange={v => updateField("reels", v)} />
              </div>
            </div>
          )}

          {/* Tab: SEO */}
          {tab === "seo" && (
            <div className="editor-body">
              <div className="editor-section-title"><Layers size={14} /> Search Engine Optimization</div>
              <div className="form-grid cols-1">
                {["metaTitle", "metaDescription", "canonicalUrl"].map(k => (
                  <label key={k} className="field">
                    <span>{k.replace(/([A-Z])/g, " $1").replace(/^./, c => c.toUpperCase())}</span>
                    {k === "metaDescription"
                      ? <textarea rows={3} value={(typeof active.seo === "object" ? active.seo?.[k] : "") || ""} onChange={e => updateField("seo", { ...(active.seo || {}), [k]: e.target.value })} />
                      : <input value={(typeof active.seo === "object" ? active.seo?.[k] : "") || ""} onChange={e => updateField("seo", { ...(active.seo || {}), [k]: e.target.value })} />
                    }
                  </label>
                ))}
                <MediaField label="OG Image" value={(typeof active.seo === "object" && active.seo?.ogImage) || null} accept="image" defaultFolder={folder} onChange={v => updateField("seo", { ...(active.seo || {}), ogImage: v })} />
              </div>
            </div>
          )}

          {/* Tab: Advanced */}
          {tab === "advanced" && (
            <div className="editor-body">
              <div className="editor-section-title"><Settings2 size={14} /> Advanced / Developer</div>
              <div className="form-grid cols-1">
                <label className="field">
                  <span>Detail Sections JSON</span>
                  <textarea
                    rows={10}
                    value={typeof active.detailSections === "string" ? active.detailSections : JSON.stringify(active.detailSections || [], null, 2)}
                    onChange={e => updateField("detailSections", e.target.value)}
                  />
                </label>
                <label className="field">
                  <span>SEO JSON (raw)</span>
                  <textarea
                    rows={8}
                    value={typeof active.seo === "string" ? active.seo : JSON.stringify(active.seo || {}, null, 2)}
                    onChange={e => updateField("seo", e.target.value)}
                  />
                </label>
              </div>
            </div>
          )}

          {/* Actions bar */}
          <div className="editor-actions">
            <button className="btn-secondary" onClick={() => active?._id ? load() : setActive(blankProject)}>
              Cancel
            </button>
            <button onClick={save} disabled={saving}>
              <Save size={15} /> {isNew ? "Create Project" : "Save Changes"}
            </button>
          </div>
        </div>
      </div>

      <ConfirmModal
        open={!!confirm}
        title="Delete project?"
        body={`This will permanently remove "${confirm?.title}" from the CMS. Uploaded media files remain in the library.`}
        onCancel={() => setConfirm(null)}
        onConfirm={deleteProject}
      />
    </section>
  );
}
