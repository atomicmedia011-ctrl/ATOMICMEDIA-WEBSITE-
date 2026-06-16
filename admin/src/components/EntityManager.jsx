import React, { useEffect, useMemo, useState } from "react";
import { Check, Copy, Eye, Plus, Save, Search, Trash2, Upload } from "lucide-react";
import { api, assetUrl } from "../api/client";
import ConfirmModal from "./ConfirmModal";
import MediaField from "./MediaField";
import { useToast } from "./Toast";

const configs = {
  services: {
    title: "Services",
    endpoint: "/api/admin/services",
    fields: ["title", "slug", "category", "summary", "body", "icon", "image", "images", "videos", "reels", "order", "enabled", "seo"],
    media: { icon: "image", image: "image", images: "image[]", videos: "video[]", reels: "video[]" },
    description: "Edit service content, icons, photos, videos, reels, SEO, ordering, and visibility."
  },
  projects: {
    title: "Projects",
    endpoint: "/api/admin/projects",
    fields: ["title", "slug", "excerpt", "body", "client", "year", "categories", "technologies", "liveUrl", "coverImage", "images", "videos", "featured", "enabled", "order"],
    media: { coverImage: "image", images: "image[]", videos: "video[]" }
  },
  testimonials: {
    title: "Testimonials",
    endpoint: "/api/admin/testimonials",
    fields: ["clientName", "designation", "company", "quote", "rating", "image", "video", "reels", "enabled", "order"],
    media: { image: "image", video: "video", reels: "video[]" },
    description: "Edit client quote, rating, photo, testimonial video, reels, ordering, and visibility."
  },
  team: {
    title: "Team",
    endpoint: "/api/admin/team",
    fields: ["name", "position", "bio", "profilePicture", "videos", "reels", "socialLinks", "isCore", "enabled", "order"],
    media: { profilePicture: "image", videos: "video[]", reels: "video[]" },
    description: "Edit team profile, profile photo, bio, designation, core-member placement, videos, reels, social links, ordering, and visibility."
  },
  blogs: {
    title: "Blog Posts",
    endpoint: "/api/admin/blogs",
    fields: ["title", "slug", "excerpt", "content", "featuredImage", "images", "videos", "reels", "categories", "tags", "status", "publishedAt", "seo"],
    media: { featuredImage: "image", images: "image[]", videos: "video[]", reels: "video[]" },
    description: "Create and edit posts with featured image, image gallery, videos, reels, tags, categories, and SEO."
  },
  sections: { title: "Page Sections", endpoint: "/api/admin/pages", fields: ["page", "title", "sections", "seo"], description: "Edit homepage/about/project page section JSON, toggles, reorder values, media selectors, and SEO." },
  about: {
    title: "About Section",
    endpoint: "/api/admin/pages",
    fields: ["page", "title", "sections", "seo"],
    defaults: { page: "about", title: "About Atomic Media", sections: [] },
    description: "Manage the About title, description, mission, vision, stats, and team intro content from one JSON-backed content record."
  },
  settings: {
    title: "Website Settings",
    endpoint: "/api/admin/settings",
    fields: ["key", "companyName", "logo", "darkLogo", "favicon", "heroHeading", "heroSubheading", "heroCtaText", "heroCtaLink", "heroBackgroundImage", "heroBackgroundVideo", "loadingAnimationAsset", "heroImages", "heroVideos", "reels", "contact", "socialLinks", "footer", "theme", "seo", "metaKeywords"],
    media: { logo: "image", darkLogo: "image", favicon: "image", heroBackgroundImage: "image", heroBackgroundVideo: "video", loadingAnimationAsset: "image", heroImages: "image[]", heroVideos: "video[]", reels: "video[]" },
    defaults: { key: "global", companyName: "Atomic Media" },
    description: "Edit global logo, favicon, hero images, hero videos, reels, contact information, footer, theme, and SEO."
  },
  seo: { title: "SEO Management", endpoint: "/api/admin/pages", fields: ["page", "title", "seo"], description: "Update meta title, meta description, canonical URL, Open Graph image, and schema JSON per page." },
  hero: {
    title: "Hero Section",
    endpoint: "/api/admin/settings",
    fields: ["key", "heroHeading", "heroSubheading", "heroCtaText", "heroCtaLink", "heroBackgroundImage", "heroBackgroundVideo", "loadingAnimationAsset", "logo", "heroImages", "heroVideos", "reels", "seo"],
    media: { heroBackgroundImage: "image", heroBackgroundVideo: "video", loadingAnimationAsset: "image", logo: "image", heroImages: "image[]", heroVideos: "video[]", reels: "video[]" },
    defaults: { key: "global" },
    description: "Edit the homepage hero heading, subheading, CTA, background image/video, logo/loading asset, and supporting hero media."
  },
  security: { title: "Security Settings", endpoint: "/api/admin/settings", fields: ["key", "security"], defaults: { key: "global" } }
};

function emptyFrom(fields, media = {}, defaults = {}) {
  return { ...Object.fromEntries(fields.map((field) => [
    field,
    field === "enabled" || field === "isCore" ? true : field === "featured" ? false : field === "order" ? 0 : media[field]?.endsWith("[]") ? [] : ""
  ])), ...defaults };
}

function withDefaults(item, fields, media = {}, defaults = {}) {
  return { ...emptyFrom(fields, media, defaults), ...(item || {}) };
}

function normalizeValue(key, value) {
  if (key === "categories" || key === "tags" || key === "technologies" || key === "metaKeywords") {
    return Array.isArray(value) ? value : String(value || "").split(",").map((item) => item.trim()).filter(Boolean);
  }
  if (key === "order" || key === "rating") return Number(value || 0);
  if (typeof value === "string" && /^[\[{]/.test(value.trim())) {
    try { return JSON.parse(value); } catch { return value; }
  }
  if (value === "true") return true;
  if (value === "false") return false;
  return value;
}

function itemTitle(item) {
  return item.title || item.name || item.clientName || item.page || item.companyName || item.email || "Untitled";
}

function itemSubtitle(item) {
  return item.slug || item.status || item.position || item.company || item.updatedAt || "Draft";
}

function thumbnail(item) {
  return item.coverImage?.url || item.image?.url || item.profilePicture?.url || item.featuredImage?.url || item.logo?.url || item.images?.[0]?.url || item.heroImages?.[0]?.url || "";
}

function slugify(value) {
  return String(value || "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function fieldLabel(type, field) {
  if (type === "team" && field === "profilePicture") return "Core member photo";
  if (type === "team" && field === "position") return "Designation / post";
  if (type === "team" && field === "isCore") return "Show in core members section";
  return field.replace(/([A-Z])/g, " $1").replace(/^./, (letter) => letter.toUpperCase());
}

function validateActive(type, body) {
  if ((type === "services" || type === "projects" || type === "blogs") && !body.title?.trim()) return "Title is required.";
  if (type === "testimonials" && !body.clientName?.trim()) return "Client name is required.";
  if (type === "team" && !body.name?.trim()) return "Member name is required.";
  if ((type === "sections" || type === "about" || type === "seo") && !body.page?.trim()) return "Page key is required.";
  if ((type === "settings" || type === "hero" || type === "security") && !body.key?.trim()) return "Settings key is required.";
  return "";
}

export default function EntityManager({ type }) {
  const config = configs[type] || configs.services;
  const [items, setItems] = useState([]);
  const [active, setActive] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [query, setQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const notify = useToast();

  const fields = useMemo(() => config.fields, [config]);

  async function load() {
    const result = await api(`${config.endpoint}?limit=100`);
    const nextItems = result.items || [];
    setItems(nextItems);
    setActive((current) => {
      const currentInThisCollection = current?._id ? nextItems.find((item) => item._id === current._id) : null;
      return withDefaults(currentInThisCollection || nextItems[0], fields, config.media, config.defaults);
    });
  }

  useEffect(() => { load().catch((error) => notify(error.message, "error")); }, [type]);

  async function save() {
    setSaving(true);
    try {
    const body = Object.fromEntries(Object.entries(active || {}).map(([key, value]) => [key, normalizeValue(key, value)]));
    const validationMessage = validateActive(type, body);
    if (validationMessage) {
      notify(validationMessage, "error");
      return;
    }
    if (!body.slug && body.title) body.slug = slugify(body.title);
    const method = body._id ? "PATCH" : "POST";
    const path = body._id ? `${config.endpoint}/${body._id}` : config.endpoint;
    const saved = await api(path, { method, body });
    setActive(saved);
    notify(body._id ? "Updated" : "Created");
    await load();
    } catch (error) {
      notify(error.message, "error");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    await api(`${config.endpoint}/${confirm._id}`, { method: "DELETE" });
    setConfirm(null);
    notify("Deleted");
    await load();
  }

  async function duplicate() {
    const source = { ...active };
    delete source._id;
    source.title = source.title ? `${source.title} Copy` : undefined;
    source.name = source.name ? `${source.name} Copy` : undefined;
    source.clientName = source.clientName ? `${source.clientName} Copy` : undefined;
    if (source.slug) source.slug = `${source.slug}-copy`;
    const saved = await api(config.endpoint, { method: "POST", body: source });
    notify("Duplicated");
    setActive(saved);
    await load();
  }

  async function quickToggle(field) {
    if (!active?._id) {
      setActive({ ...active, [field]: !active[field] });
      return;
    }
    const saved = await api(`${config.endpoint}/${active._id}`, { method: "PATCH", body: { [field]: !active[field] } });
    setActive(saved);
    await load();
  }

  const filtered = items.filter((item) => `${itemTitle(item)} ${itemSubtitle(item)}`.toLowerCase().includes(query.toLowerCase()));

  return (
    <section className="workspace collection-manager">
      <div className="section-head">
        <div>
          <p className="eyebrow">Content manager</p>
          <h1>{config.title}</h1>
          {config.description && <p className="section-description">{config.description}</p>}
        </div>
        <div className="project-actions">
          <button className="secondary" onClick={() => setActive(emptyFrom(fields, config.media, config.defaults))}><Plus size={18} /> Add New</button>
          {active?._id && <button className="secondary" onClick={duplicate}><Copy size={18} /> Duplicate</button>}
          <button onClick={save} disabled={saving}><Save size={18} /> {active?._id ? "Update" : "Create"}</button>
          {active?._id && <button className="danger" onClick={() => setConfirm(active)}><Trash2 size={18} /> Delete</button>}
        </div>
      </div>
      <div className="project-grid-layout">
        <aside className="project-browser">
          <div className="project-search">
            <Search size={18} />
            <input placeholder={`Search ${config.title.toLowerCase()}`} value={query} onChange={(event) => setQuery(event.target.value)} />
          </div>
          <div className="project-list">
          {filtered.map((item) => (
            <button key={item._id} className={active?._id === item._id ? "project-list-card active" : "project-list-card"} onClick={() => setActive(item)}>
              <div className="project-list-image">
                {thumbnail(item) ? <img src={assetUrl(thumbnail(item))} alt={itemTitle(item)} /> : <span>No media</span>}
              </div>
              <div>
                <strong>{itemTitle(item)}</strong>
                <small>{item.enabled === false ? "Hidden" : item.status || "Visible"} · {itemSubtitle(item)}</small>
              </div>
            </button>
          ))}
          </div>
        </aside>
        <div className="project-editor">
          <div className="project-preview-panel">
            <div className="project-preview-media">
              {thumbnail(active || {}) ? <img src={assetUrl(thumbnail(active || {}))} alt={itemTitle(active || {})} /> : <div>No image selected</div>}
            </div>
            <div className="project-preview-copy">
              <p className="eyebrow">Editing</p>
              <h2>{itemTitle(active || {})}</h2>
              <p>{active?.summary || active?.excerpt || active?.quote || active?.bio || "Use the fields below to edit text, photos, videos, reels, ordering, and visibility."}</p>
              <div className="status-pills">
                {"enabled" in (active || {}) && <button className={active.enabled ? "pill active" : "pill"} onClick={() => quickToggle("enabled")}><Eye size={15} /> {active.enabled ? "Visible" : "Hidden"}</button>}
                {"featured" in (active || {}) && <button className={active.featured ? "pill active" : "pill"} onClick={() => quickToggle("featured")}><Check size={15} /> {active.featured ? "Featured" : "Make Featured"}</button>}
              </div>
            </div>
          </div>

          <div className="media-section-title">
            <Upload size={18} />
            <strong>Edit, upload, replace, delete media</strong>
          </div>
          <div className="project-form-grid">
            {active && fields.map((field) => (
              config.media?.[field] ? (
                <MediaField
                  key={field}
                  label={fieldLabel(type, field)}
                  value={active[field]}
                  multiple={config.media[field].endsWith("[]")}
                  accept={config.media[field].replace("[]", "")}
                  defaultFolder={type === "team" && field === "profilePicture" ? `team/${slugify(active.name || "member")}` : undefined}
                  onChange={(value) => setActive({ ...active, [field]: value })}
                />
              ) : null
            ))}
          </div>

          <div className="project-form-grid">
            {active && fields.filter((field) => !config.media?.[field]).map((field) => (
                <label key={field}>
                  <span>{fieldLabel(type, field)}</span>
                  {typeof active[field] === "boolean" ? (
                    <input type="checkbox" checked={!!active[field]} onChange={(event) => setActive({ ...active, [field]: event.target.checked })} />
                  ) : field === "body" || field === "content" || field === "quote" || field === "sections" || field === "seo" || field === "footer" || field === "contact" || field === "socialLinks" || field === "theme" || field === "security" ? (
                    <textarea rows={field === "sections" ? 12 : 6} value={typeof active[field] === "object" ? JSON.stringify(active[field], null, 2) : active[field] || ""} onChange={(event) => setActive({ ...active, [field]: event.target.value })} />
                  ) : (
                    <input value={Array.isArray(active[field]) ? active[field].join(",") : active[field] || ""} onChange={(event) => setActive({ ...active, [field]: event.target.value })} />
                  )}
                </label>
            ))}
          </div>

          <div className="editor-actions project-bottom-actions">
            <button className="secondary" onClick={() => active?._id ? load() : setActive(emptyFrom(fields, config.media, config.defaults))}>Cancel Changes</button>
            <button onClick={save} disabled={saving}><Save size={18} /> {active?._id ? "Update" : "Create"}</button>
          </div>
        </div>
      </div>
      <ConfirmModal open={!!confirm} title={`Delete ${itemTitle(confirm || {})}?`} body="This removes the CMS record. Uploaded media files stay available in the media library." onCancel={() => setConfirm(null)} onConfirm={remove} />
    </section>
  );
}
