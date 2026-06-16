import React, { useEffect, useMemo, useState } from "react";
import { Check, Eye, Plus, RotateCcw, Save, Search, Trash2, Upload } from "lucide-react";
import { api, assetUrl } from "../api/client";
import ConfirmModal from "../components/ConfirmModal";
import MediaField from "../components/MediaField";
import { useToast } from "../components/Toast";

const blankProject = {
  title: "",
  slug: "",
  excerpt: "",
  body: "",
  client: "",
  year: "",
  liveUrl: "",
  projectType: "",
  eventType: "",
  mediaFolder: "",
  categories: [],
  technologies: [],
  featured: false,
  enabled: true,
  order: 0,
  coverImage: null,
  images: [],
  videos: [],
  reels: [],
  detailSections: [],
  seo: {}
};

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseList(value) {
  return Array.isArray(value) ? value : String(value || "").split(",").map((item) => item.trim()).filter(Boolean);
}

function parseJson(value, fallback) {
  if (typeof value !== "string") return value || fallback;
  if (!value.trim()) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function primaryImage(project) {
  return project?.coverImage?.url || project?.images?.[0]?.url || "";
}

function folderFromProject(project) {
  const type = slugify(project.projectType || project.eventType || "general") || "general";
  const slug = slugify(project.slug || project.title || "new-project") || "new-project";
  return `projects/${type}/${slug}`;
}

export default function ProjectManager() {
  const [projects, setProjects] = useState([]);
  const [active, setActive] = useState(blankProject);
  const [query, setQuery] = useState("");
  const [confirm, setConfirm] = useState(null);
  const [saving, setSaving] = useState(false);
  const notify = useToast();

  async function load() {
    const result = await api("/api/admin/projects?limit=100");
    const nextProjects = result.items || [];
    setProjects(nextProjects);
    setActive((current) => {
      const currentInProjects = current?._id ? nextProjects.find((item) => item._id === current._id) : null;
      return currentInProjects || nextProjects[0] || blankProject;
    });
  }

  useEffect(() => {
    load().catch((error) => notify(error.message, "error"));
  }, []);

  const filteredProjects = useMemo(() => {
    const needle = query.toLowerCase();
    return projects.filter((project) => {
      return `${project.title} ${project.slug} ${(project.categories || []).join(" ")}`.toLowerCase().includes(needle);
    });
  }, [projects, query]);

  function updateField(field, value) {
    setActive((current) => {
      const next = { ...current, [field]: value };
      if (field === "title" && !current._id && !current.slug) {
        next.slug = slugify(value);
      }
      if (["title", "slug", "projectType", "eventType"].includes(field) && !current.mediaFolder) {
        next.mediaFolder = folderFromProject(next);
      }
      return next;
    });
  }

  function payload() {
    const slug = active.slug || slugify(active.title);
    const mediaFolder = active.mediaFolder || folderFromProject({ ...active, slug });
    return {
      ...active,
      slug,
      mediaFolder,
      categories: parseList(active.categories),
      technologies: parseList(active.technologies),
      order: Number(active.order || 0),
      detailSections: parseJson(active.detailSections, []),
      seo: parseJson(active.seo, {})
    };
  }

  async function saveProject() {
    setSaving(true);
    try {
      const body = payload();
      const method = body._id ? "PATCH" : "POST";
      const path = body._id ? `/api/admin/projects/${body._id}` : "/api/admin/projects";
      const saved = await api(path, { method, body });
      notify(body._id ? "Project updated" : "Project created");
      setActive(saved);
      await load();
    } catch (error) {
      notify(error.message, "error");
    } finally {
      setSaving(false);
    }
  }

  async function duplicateProject() {
    const copy = {
      ...payload(),
      _id: undefined,
      title: `${active.title} Copy`,
      slug: `${active.slug || slugify(active.title)}-copy`,
      mediaFolder: `${active.mediaFolder || folderFromProject(active)}-copy`,
      featured: false,
      order: Number(active.order || 0) + 1
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
    if (!active._id) {
      updateField(field, !active[field]);
      return;
    }
    const saved = await api(`/api/admin/projects/${active._id}`, { method: "PATCH", body: { [field]: !active[field] } });
    setActive(saved);
    await load();
  }

  return (
    <section className="workspace project-manager">
      <div className="section-head">
        <div>
          <p className="eyebrow">Portfolio CMS</p>
          <h1>Projects</h1>
        </div>
        <div className="project-actions">
          <button className="secondary" onClick={() => setActive(blankProject)}><Plus size={18} /> Add Project</button>
          {active?._id && <button className="secondary" onClick={duplicateProject}><RotateCcw size={18} /> Duplicate</button>}
          <button onClick={saveProject} disabled={saving}><Save size={18} /> {active?._id ? "Update Project" : "Create Project"}</button>
          {active?._id && <button className="danger" onClick={() => setConfirm(active)}><Trash2 size={18} /> Delete</button>}
        </div>
      </div>

      <div className="project-grid-layout">
        <aside className="project-browser">
          <div className="project-search">
            <Search size={18} />
            <input placeholder="Search projects" value={query} onChange={(event) => setQuery(event.target.value)} />
          </div>
          <div className="project-list">
            {filteredProjects.map((project) => (
              <button className={active?._id === project._id ? "project-list-card active" : "project-list-card"} key={project._id} onClick={() => setActive(project)}>
                <div className="project-list-image">
                  {primaryImage(project) ? <img src={assetUrl(primaryImage(project))} alt={project.title} /> : <span>No image</span>}
                </div>
                <div>
                  <strong>{project.title}</strong>
                  <small>{project.enabled ? "Visible" : "Hidden"} · {project.featured ? "Featured" : "Normal"}</small>
                </div>
              </button>
            ))}
          </div>
        </aside>

        <div className="project-editor">
          <div className="project-preview-panel">
            <div className="project-preview-media">
              {primaryImage(active) ? <img src={assetUrl(primaryImage(active))} alt={active.title || "Project"} /> : <div>No cover image selected</div>}
            </div>
            <div className="project-preview-copy">
              <p className="eyebrow">Current project</p>
              <h2>{active.title || "New Project"}</h2>
              <p>{active.excerpt || "Add project summary, client, year, category, images, and videos."}</p>
              <div className="status-pills">
                <button className={active.enabled ? "pill active" : "pill"} onClick={() => quickToggle("enabled")}><Eye size={15} /> {active.enabled ? "Visible" : "Hidden"}</button>
                <button className={active.featured ? "pill active" : "pill"} onClick={() => quickToggle("featured")}><Check size={15} /> {active.featured ? "Featured" : "Make Featured"}</button>
              </div>
            </div>
          </div>

          <div className="project-form-grid">
            <label>
              <span>Project Title</span>
              <input value={active.title || ""} onChange={(event) => updateField("title", event.target.value)} />
            </label>
            <label>
              <span>Slug</span>
              <input value={active.slug || ""} onChange={(event) => updateField("slug", event.target.value)} />
            </label>
            <label>
              <span>Client</span>
              <input value={active.client || ""} onChange={(event) => updateField("client", event.target.value)} />
            </label>
            <label>
              <span>Year</span>
              <input value={active.year || ""} onChange={(event) => updateField("year", event.target.value)} />
            </label>
            <label>
              <span>Project Type</span>
              <input placeholder="Wedding, corporate, product, portfolio" value={active.projectType || ""} onChange={(event) => updateField("projectType", event.target.value)} />
            </label>
            <label>
              <span>Event Type</span>
              <input placeholder="Launch, conference, campaign, reel shoot" value={active.eventType || ""} onChange={(event) => updateField("eventType", event.target.value)} />
            </label>
            <label>
              <span>Categories</span>
              <input value={Array.isArray(active.categories) ? active.categories.join(", ") : active.categories || ""} onChange={(event) => updateField("categories", event.target.value)} />
            </label>
            <label>
              <span>Technologies Used</span>
              <input placeholder="React, GSAP, Node, AI" value={Array.isArray(active.technologies) ? active.technologies.join(", ") : active.technologies || ""} onChange={(event) => updateField("technologies", event.target.value)} />
            </label>
            <label>
              <span>Live Website Link</span>
              <input placeholder="https://example.com" value={active.liveUrl || ""} onChange={(event) => updateField("liveUrl", event.target.value)} />
            </label>
            <label>
              <span>Order</span>
              <input type="number" value={active.order || 0} onChange={(event) => updateField("order", event.target.value)} />
            </label>
          </div>

          <div className="folder-panel">
            <div>
              <p className="eyebrow">Project Folder</p>
              <strong>{active.mediaFolder || folderFromProject(active)}</strong>
              <small>Photos, videos, and reels uploaded below will be saved in this folder.</small>
            </div>
            <label>
              <span>Folder Path</span>
              <input value={active.mediaFolder || folderFromProject(active)} onChange={(event) => updateField("mediaFolder", event.target.value)} />
            </label>
          </div>

          <label>
            <span>Short Description</span>
            <textarea rows={3} value={active.excerpt || ""} onChange={(event) => updateField("excerpt", event.target.value)} />
          </label>

          <label>
            <span>Project Details</span>
            <textarea rows={6} value={active.body || ""} onChange={(event) => updateField("body", event.target.value)} />
          </label>

          <div className="project-media-section">
            <div className="media-section-title">
              <Upload size={18} />
              <strong>Upload into {active.mediaFolder || folderFromProject(active)}</strong>
            </div>
            <MediaField label="Cover Image" value={active.coverImage} accept="image" defaultFolder={active.mediaFolder || folderFromProject(active)} onChange={(value) => updateField("coverImage", value)} />
            <MediaField label="Project Photos" value={active.images || []} accept="image" multiple defaultFolder={`${active.mediaFolder || folderFromProject(active)}/photos`} onChange={(value) => updateField("images", value)} />
            <MediaField label="Project Videos" value={active.videos || []} accept="video" multiple defaultFolder={`${active.mediaFolder || folderFromProject(active)}/videos`} onChange={(value) => updateField("videos", value)} />
            <MediaField label="Project Reels" value={active.reels || []} accept="video" multiple defaultFolder={`${active.mediaFolder || folderFromProject(active)}/reels`} onChange={(value) => updateField("reels", value)} />
          </div>

          <div className="project-form-grid">
            <label>
              <span>Detail Sections JSON</span>
              <textarea rows={8} value={typeof active.detailSections === "string" ? active.detailSections : JSON.stringify(active.detailSections || [], null, 2)} onChange={(event) => updateField("detailSections", event.target.value)} />
            </label>
            <label>
              <span>SEO JSON</span>
              <textarea rows={8} value={typeof active.seo === "string" ? active.seo : JSON.stringify(active.seo || {}, null, 2)} onChange={(event) => updateField("seo", event.target.value)} />
            </label>
          </div>

          <div className="editor-actions project-bottom-actions">
            <button className="secondary" onClick={() => active?._id ? load() : setActive(blankProject)}>Cancel Changes</button>
            <button onClick={saveProject} disabled={saving}><Save size={18} /> {active?._id ? "Update Project" : "Create Project"}</button>
          </div>
        </div>
      </div>

      <ConfirmModal
        open={!!confirm}
        title="Delete project?"
        body={`This will remove "${confirm?.title}" from the CMS. Existing website asset files will stay on disk.`}
        onCancel={() => setConfirm(null)}
        onConfirm={deleteProject}
      />
    </section>
  );
}
