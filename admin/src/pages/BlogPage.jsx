import React, { useEffect, useMemo, useState } from "react";
import { BookOpen, Calendar, Copy, Eye, Globe, Image as ImageIcon, Plus, Save, Search, Tag, Trash2 } from "lucide-react";
import { api, assetUrl } from "../api/client";
import ConfirmModal from "../components/ConfirmModal";
import MediaField from "../components/MediaField";
import { useToast } from "../components/Toast";

const TABS = [
  { id: "content", label: "Content", icon: BookOpen },
  { id: "media", label: "Media", icon: ImageIcon },
  { id: "seo", label: "SEO", icon: Globe },
];

function slugify(v) {
  return String(v || "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

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
        <span key={tag} className="tag-chip">{tag}<button type="button" onClick={() => remove(tag)}>×</button></span>
      ))}
      <input className="tag-input-inner" value={input} placeholder={tags.length ? "" : placeholder}
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

const blank = {
  title: "", slug: "", excerpt: "", content: "", featuredImage: null,
  images: [], videos: [], reels: [], categories: [], tags: [],
  status: "draft", publishedAt: "", seo: {}
};

export default function BlogPage() {
  const [items, setItems] = useState([]);
  const [active, setActive] = useState(null);
  const [tab, setTab] = useState("content");
  const [query, setQuery] = useState("");
  const [confirm, setConfirm] = useState(null);
  const [saving, setSaving] = useState(false);
  const notify = useToast();

  async function load() {
    const r = await api("/api/admin/blogs?limit=200");
    const list = r.items || [];
    setItems(list);
    setActive(cur => {
      const found = cur?._id ? list.find(b => b._id === cur._id) : null;
      return found || list[0] || { ...blank };
    });
  }

  useEffect(() => { load().catch(e => notify(e.message, "error")); }, []);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return items.filter(b => `${b.title} ${b.slug} ${(b.categories || []).join(" ")}`.toLowerCase().includes(q));
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
      const body = { ...active };
      if (!body.slug && body.title) body.slug = slugify(body.title);
      if (body.status === "published" && !body.publishedAt) body.publishedAt = new Date().toISOString();
      const method = body._id ? "PATCH" : "POST";
      const path = body._id ? `/api/admin/blogs/${body._id}` : "/api/admin/blogs";
      const saved = await api(path, { method, body });
      notify(body._id ? "Post updated ✓" : "Post created ✓");
      setActive(saved); await load();
    } catch (e) { notify(e.message, "error"); }
    finally { setSaving(false); }
  }

  async function duplicate() {
    const copy = { ...active, _id: undefined, title: `${active.title} Copy`, slug: `${active.slug}-copy`, status: "draft" };
    const saved = await api("/api/admin/blogs", { method: "POST", body: copy });
    notify("Duplicated"); setActive(saved); await load();
  }

  async function remove() {
    await api(`/api/admin/blogs/${confirm._id}`, { method: "DELETE" });
    setConfirm(null); notify("Deleted"); await load();
  }

  async function togglePublish() {
    const newStatus = active.status === "published" ? "draft" : "published";
    const body = { status: newStatus };
    if (newStatus === "published" && !active.publishedAt) body.publishedAt = new Date().toISOString();
    if (!active?._id) { updateField("status", newStatus); return; }
    const saved = await api(`/api/admin/blogs/${active._id}`, { method: "PATCH", body });
    setActive(saved); await load();
  }

  const thumb = active?.featuredImage?.url || "";
  const isNew = !active?._id;
  const isPublished = active?.status === "published";

  return (
    <section className="workspace">
      <div className="page-header">
        <div className="page-header-text">
          <p className="eyebrow">Content CMS</p>
          <h1>Blog</h1>
          <p>Write and publish articles, insights, and case studies. Manage SEO, featured images, categories, and tags.</p>
        </div>
        <div className="page-header-actions">
          <button className="btn-secondary" onClick={() => { setActive({ ...blank }); setTab("content"); }}><Plus size={16} /> New Post</button>
          {active?._id && <button className="btn-secondary" onClick={duplicate}><Copy size={16} /> Duplicate</button>}
          <button onClick={save} disabled={saving}><Save size={16} /> {isNew ? "Create" : "Save"}</button>
          <button className={isPublished ? "btn-secondary" : ""} style={isPublished ? {} : {}} onClick={togglePublish}>
            <Eye size={16} /> {isPublished ? "Unpublish" : "Publish"}
          </button>
          {active?._id && <button className="btn-danger" onClick={() => setConfirm(active)}><Trash2 size={16} /></button>}
        </div>
      </div>

      <div className="project-grid-layout">
        <aside className="project-browser">
          <div className="project-search">
            <Search size={15} />
            <input placeholder="Search posts…" value={query} onChange={e => setQuery(e.target.value)} />
          </div>
          <div className="project-list">
            {filtered.map(b => (
              <button key={b._id} className={`project-list-card${active?._id === b._id ? " active" : ""}`} onClick={() => { setActive(b); setTab("content"); }}>
                <div className="project-list-image">
                  {b.featuredImage?.url ? <img src={assetUrl(b.featuredImage.url)} alt={b.title} /> : <BookOpen size={18} style={{ color: "var(--text-dim)" }} />}
                </div>
                <div>
                  <strong style={{ fontSize: 13 }}>{b.title}</strong>
                  <small>
                    <span className={`badge ${b.status === "published" ? "badge-success" : "badge-muted"}`} style={{ fontSize: 9, padding: "1px 6px" }}>
                      {b.status || "draft"}
                    </span>
                  </small>
                  <small>{b.publishedAt ? new Date(b.publishedAt).toLocaleDateString() : "Unpublished"}</small>
                </div>
              </button>
            ))}
            {!filtered.length && <div className="empty-state" style={{ margin: 12 }}>No posts yet.</div>}
          </div>
          <button className="browser-add-btn" onClick={() => { setActive({ ...blank }); setTab("content"); }}><Plus size={15} /> New Post</button>
        </aside>

        {active && (
          <div className="editor-panel">
            <div className="preview-strip">
              <div className="preview-image">
                {thumb ? <img src={assetUrl(thumb)} alt={active.title} /> : <BookOpen size={22} style={{ color: "var(--text-dim)" }} />}
              </div>
              <div className="preview-info">
                <h2>{active.title || "New Post"}</h2>
                <p>{active.excerpt || "Add an excerpt to preview it here."}</p>
                <div className="preview-pills">
                  <span className={`badge ${isPublished ? "badge-success" : "badge-muted"}`}>{isPublished ? "Published" : "Draft"}</span>
                  {active.publishedAt && <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{new Date(active.publishedAt).toLocaleDateString()}</span>}
                </div>
              </div>
            </div>

            <div className="editor-tabs">
              {TABS.map(({ id, label, icon: Icon }) => (
                <button key={id} className={`tab-btn${tab === id ? " active" : ""}`} onClick={() => setTab(id)}>
                  <Icon size={14} />{label}
                </button>
              ))}
            </div>

            {tab === "content" && (
              <div className="editor-body">
                <div className="form-grid">
                  <label className="field">
                    <span>Post Title *</span>
                    <input value={active.title || ""} onChange={e => updateField("title", e.target.value)} placeholder="My Blog Post" />
                  </label>
                  <label className="field">
                    <span>URL Slug</span>
                    <input value={active.slug || ""} onChange={e => updateField("slug", e.target.value)} />
                  </label>
                  <label className="field">
                    <span>Status</span>
                    <select value={active.status || "draft"} onChange={e => updateField("status", e.target.value)}>
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                    </select>
                  </label>
                  <label className="field">
                    <span>Publish Date</span>
                    <input type="datetime-local" value={active.publishedAt ? new Date(active.publishedAt).toISOString().slice(0, 16) : ""} onChange={e => updateField("publishedAt", e.target.value)} />
                  </label>
                </div>
                <div className="divider" />
                <div className="form-grid cols-1">
                  <label className="field">
                    <span>Categories</span>
                    <TagInput value={active.categories} onChange={v => updateField("categories", v)} placeholder="Type and press Enter…" />
                  </label>
                  <label className="field">
                    <span>Tags</span>
                    <TagInput value={active.tags} onChange={v => updateField("tags", v)} placeholder="photography, behind-the-scenes…" />
                  </label>
                  <label className="field">
                    <span>Excerpt / Summary</span>
                    <textarea rows={3} value={active.excerpt || ""} onChange={e => updateField("excerpt", e.target.value)} placeholder="Brief description of this post…" />
                  </label>
                  <label className="field">
                    <span>Post Content</span>
                    <textarea rows={16} value={active.content || ""} onChange={e => updateField("content", e.target.value)} placeholder="Write your full article here…" />
                  </label>
                </div>
              </div>
            )}

            {tab === "media" && (
              <div className="editor-body">
                <div className="project-media-section">
                  <MediaField label="Featured Image" value={active.featuredImage} accept="image" defaultFolder={`blog/${active.slug || "post"}`} onChange={v => updateField("featuredImage", v)} />
                  <MediaField label="Gallery Images" value={active.images || []} accept="image" multiple defaultFolder={`blog/${active.slug || "post"}/images`} onChange={v => updateField("images", v)} />
                  <MediaField label="Videos" value={active.videos || []} accept="video" multiple defaultFolder={`blog/${active.slug || "post"}/videos`} onChange={v => updateField("videos", v)} />
                  <MediaField label="Reels" value={active.reels || []} accept="video" multiple defaultFolder={`blog/${active.slug || "post"}/reels`} onChange={v => updateField("reels", v)} />
                </div>
              </div>
            )}

            {tab === "seo" && (
              <div className="editor-body">
                <div className="editor-section-title"><Globe size={14} /> SEO Settings</div>
                <div className="form-grid cols-1">
                  {["metaTitle", "metaDescription", "canonicalUrl"].map(k => (
                    <label key={k} className="field">
                      <span>{k.replace(/([A-Z])/g, " $1").replace(/^./, c => c.toUpperCase())}</span>
                      {k === "metaDescription"
                        ? <textarea rows={3} value={(typeof active.seo === "object" ? active.seo?.[k] : "") || ""} onChange={e => updateField("seo", { ...(active.seo || {}), [k]: e.target.value })} />
                        : <input value={(typeof active.seo === "object" ? active.seo?.[k] : "") || ""} onChange={e => updateField("seo", { ...(active.seo || {}), [k]: e.target.value })} />}
                    </label>
                  ))}
                  <MediaField label="OG Image" value={(typeof active.seo === "object" && active.seo?.ogImage) || null} accept="image" defaultFolder={`blog/${active.slug || "post"}`} onChange={v => updateField("seo", { ...(active.seo || {}), ogImage: v })} />
                </div>
              </div>
            )}

            <div className="editor-actions">
              <button className="btn-secondary" onClick={() => active?._id ? load() : setActive({ ...blank })}>Cancel</button>
              <button onClick={save} disabled={saving}><Save size={15} /> {isNew ? "Create Post" : "Save Changes"}</button>
            </div>
          </div>
        )}
      </div>

      <ConfirmModal
        open={!!confirm}
        title="Delete blog post?"
        body={`Remove "${confirm?.title}" permanently?`}
        onCancel={() => setConfirm(null)}
        onConfirm={remove}
      />
    </section>
  );
}
