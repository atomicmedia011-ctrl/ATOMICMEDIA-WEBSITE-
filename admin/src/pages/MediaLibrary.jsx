import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Copy, FolderOpen, Grid, Image as ImageIcon, List,
  Search, Trash2, Upload, Video, X, ZoomIn
} from "lucide-react";
import { api, assetUrl } from "../api/client";
import ConfirmModal from "../components/ConfirmModal";
import { useToast } from "../components/Toast";

const FOLDERS = ["All", "atomic-media", "projects", "services", "team", "testimonials", "hero", "blog", "branding", "seo"];

function Lightbox({ asset, onClose }) {
  if (!asset) return null;
  const url = assetUrl(asset.url);
  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: "rgba(6,6,12,0.98)", border: "1px solid var(--line-strong)",
        borderRadius: "var(--r-xl)", padding: 20, maxWidth: "90vw", maxHeight: "90vh",
        display: "flex", flexDirection: "column", gap: 14, overflow: "auto"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <strong style={{ fontSize: 15 }}>{asset.title || asset.originalName || "Asset"}</strong>
            <small style={{ display: "block", color: "var(--text-muted)" }}>{asset.folder || "root"} · {asset.type || "file"}</small>
          </div>
          <button className="btn-icon" onClick={onClose}><X size={16} /></button>
        </div>
        {asset.type === "video"
          ? <video src={url} controls style={{ maxWidth: "80vw", maxHeight: "70vh", borderRadius: "var(--r)" }} />
          : <img src={url} alt={asset.title} style={{ maxWidth: "80vw", maxHeight: "70vh", objectFit: "contain", borderRadius: "var(--r)" }} />
        }
      </div>
    </div>
  );
}

export default function MediaLibrary() {
  const [items, setItems] = useState([]);
  const [folder, setFolder] = useState("atomic-media");
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [gridMode, setGridMode] = useState(true);
  const [confirm, setConfirm] = useState(null);
  const [lightbox, setLightbox] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);
  const notify = useToast();

  async function load() {
    const r = await api("/api/admin/media");
    setItems(r.items || []);
  }

  useEffect(() => { load().catch(e => notify(e.message, "error")); }, []);

  // Derive unique folders from items
  const folderList = useMemo(() => {
    const allFolders = [...new Set(items.map(a => a.folder).filter(Boolean))];
    return ["All", ...allFolders.sort()];
  }, [items]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return items.filter(a => {
      const matchFolder = folder === "All" || (a.folder || "").startsWith(folder);
      const matchType = typeFilter === "all" || a.type === typeFilter;
      const matchQuery = `${a.title} ${a.originalName} ${a.folder} ${a.url}`.toLowerCase().includes(q);
      return matchFolder && matchType && matchQuery;
    });
  }, [items, folder, query, typeFilter]);

  async function upload(files) {
    if (!files?.length) return;
    setUploading(true);
    try {
      const body = new FormData();
      Array.from(files).forEach(f => body.append("files", f));
      body.append("folder", folder === "All" ? "atomic-media" : folder);
      await api("/api/admin/media/upload", { method: "POST", body });
      notify(`Uploaded ${files.length} file${files.length > 1 ? "s" : ""} ✓`);
      await load();
    } catch (e) { notify(e.message, "error"); }
    finally { setUploading(false); if (inputRef.current) inputRef.current.value = ""; }
  }

  async function deleteAsset() {
    try {
      await api(`/api/admin/media/${confirm._id}`, { method: "DELETE" });
      notify("Asset deleted");
      setConfirm(null);
      await load();
    } catch (e) { notify(e.message, "error"); }
  }

  async function bulkDelete() {
    if (!selected.size) return;
    try {
      await Promise.all([...selected].map(id => api(`/api/admin/media/${id}`, { method: "DELETE" })));
      notify(`Deleted ${selected.size} asset${selected.size > 1 ? "s" : ""}`);
      setSelected(new Set());
      await load();
    } catch (e) { notify(e.message, "error"); }
  }

  async function copyUrl(asset) {
    const url = assetUrl(asset.url);
    try { await navigator.clipboard.writeText(url); notify("URL copied ✓"); }
    catch { notify(url); }
  }

  function toggleSelect(id) {
    setSelected(cur => {
      const next = new Set(cur);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragging(false);
    upload(e.dataTransfer.files);
  }

  return (
    <section className="workspace">
      <div className="page-header">
        <div className="page-header-text">
          <p className="eyebrow">Assets</p>
          <h1>Media Library</h1>
          <p>Upload, organise, preview, and manage all images and videos used across the website.</p>
        </div>
        <div className="page-header-actions">
          {selected.size > 0 && (
            <button className="btn-danger" onClick={bulkDelete}>
              <Trash2 size={15} /> Delete {selected.size} selected
            </button>
          )}
          <button onClick={() => inputRef.current?.click()} disabled={uploading}>
            <Upload size={15} /> {uploading ? "Uploading…" : "Upload Files"}
          </button>
        </div>
      </div>
      <input ref={inputRef} hidden type="file" multiple accept="image/*,video/*" onChange={e => upload(e.target.files)} />

      <div className="media-layout">
        {/* Folder sidebar */}
        <div className="folder-tree">
          <div className="folder-tree-title">Folders</div>
          {folderList.map(f => (
            <button
              key={f}
              className={`folder-item${folder === f ? " active" : ""}`}
              onClick={() => setFolder(f)}
            >
              <FolderOpen size={14} />
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f}</span>
            </button>
          ))}
        </div>

        {/* Main area */}
        <div className="media-main">
          {/* Toolbar */}
          <div className="media-toolbar">
            <div className="project-search" style={{ flex: "1 1 200px" }}>
              <Search size={15} />
              <input placeholder="Search media…" value={query} onChange={e => setQuery(e.target.value)} />
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <button className={`btn-secondary${typeFilter === "all" ? "" : ""}`} style={{ minHeight: 34, fontSize: 12, padding: "0 12px", ...(typeFilter === "all" ? { borderColor: "var(--brand)", color: "var(--brand-bright)" } : {}) }} onClick={() => setTypeFilter("all")}>All</button>
              <button className="btn-secondary" style={{ minHeight: 34, fontSize: 12, padding: "0 12px", ...(typeFilter === "image" ? { borderColor: "var(--brand)", color: "var(--brand-bright)" } : {}) }} onClick={() => setTypeFilter("image")}><ImageIcon size={13} /> Images</button>
              <button className="btn-secondary" style={{ minHeight: 34, fontSize: 12, padding: "0 12px", ...(typeFilter === "video" ? { borderColor: "var(--brand)", color: "var(--brand-bright)" } : {}) }} onClick={() => setTypeFilter("video")}><Video size={13} /> Videos</button>
              <div style={{ width: 1, height: 24, background: "var(--line)" }} />
              <button className="btn-icon" onClick={() => setGridMode(true)} style={gridMode ? { borderColor: "var(--brand)", color: "var(--brand-bright)" } : {}}><Grid size={15} /></button>
              <button className="btn-icon" onClick={() => setGridMode(false)} style={!gridMode ? { borderColor: "var(--brand)", color: "var(--brand-bright)" } : {}}><List size={15} /></button>
            </div>
          </div>

          {/* Upload folder indicator */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, fontSize: 12, color: "var(--text-muted)" }}>
            <FolderOpen size={13} />
            Uploading to: <strong style={{ color: "var(--brand-bright)" }}>{folder === "All" ? "atomic-media" : folder}</strong>
          </div>

          {/* Drop zone */}
          <div
            className={`dropzone${dragging ? " drag-over" : ""}`}
            onDrop={handleDrop}
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onClick={() => inputRef.current?.click()}
          >
            <div className="dropzone-icon"><Upload size={28} /></div>
            <strong>Drop files here or click to upload</strong>
            <small>Supports JPG, PNG, GIF, WebP, MP4, MOV, WebM</small>
          </div>

          {/* Stats row */}
          <div style={{ marginBottom: 12, fontSize: 12, color: "var(--text-muted)" }}>
            Showing <strong style={{ color: "var(--text)" }}>{filtered.length}</strong> of <strong style={{ color: "var(--text)" }}>{items.length}</strong> assets
            {selected.size > 0 && <span style={{ color: "var(--brand-bright)", marginLeft: 8 }}>· {selected.size} selected</span>}
          </div>

          {!filtered.length && !uploading && (
            <div className="empty-state">No media found. Upload some files or change the folder/filter.</div>
          )}

          {/* Grid view */}
          {gridMode && (
            <div className="media-grid-container">
              {filtered.map(asset => {
                const url = assetUrl(asset.url);
                const isSelected = selected.has(asset._id);
                return (
                  <article
                    key={asset._id}
                    className={`media-card${isSelected ? " selected" : ""}`}
                    onClick={() => setLightbox(asset)}
                  >
                    <div className="media-card-thumb">
                      {asset.type === "video"
                        ? <video src={url} muted playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        : <img src={url} alt={asset.title || ""} loading="lazy" />
                      }
                      <span className="media-type-badge">{asset.type === "video" ? "VIDEO" : "IMG"}</span>
                      <div className="media-card-actions" onClick={e => e.stopPropagation()}>
                        <button className="btn-icon" style={{ width: 28, minHeight: 28, background: "rgba(0,0,0,0.7)" }} onClick={() => copyUrl(asset)}><Copy size={12} /></button>
                        {!String(asset._id).startsWith("local:") && (
                          <button className="btn-icon" style={{ width: 28, minHeight: 28, background: "rgba(239,68,68,0.8)" }} onClick={() => setConfirm(asset)}><Trash2 size={12} /></button>
                        )}
                      </div>
                      {/* Select checkbox */}
                      <div
                        onClick={e => { e.stopPropagation(); toggleSelect(asset._id); }}
                        style={{
                          position: "absolute", top: 8, left: 8,
                          width: 18, height: 18, borderRadius: 4,
                          background: isSelected ? "var(--brand)" : "rgba(0,0,0,0.5)",
                          border: isSelected ? "2px solid var(--brand)" : "2px solid rgba(255,255,255,0.4)",
                          cursor: "pointer", display: "grid", placeItems: "center"
                        }}
                      >
                        {isSelected && <span style={{ color: "#fff", fontSize: 11 }}>✓</span>}
                      </div>
                    </div>
                    <div className="media-card-info">
                      <strong>{asset.title || asset.originalName || "Untitled"}</strong>
                      <small>{asset.folder || "root"}</small>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {/* List view */}
          {!gridMode && (
            <div className="leads-table">
              <div className="table-head-row" style={{ gridTemplateColumns: "40px 80px 1fr 1fr 120px 100px" }}>
                <span />
                <span>Preview</span>
                <strong>Filename</strong>
                <span>Folder</span>
                <span>Type</span>
                <span>Actions</span>
              </div>
              {filtered.map(asset => {
                const url = assetUrl(asset.url);
                const isSelected = selected.has(asset._id);
                return (
                  <div key={asset._id} className="table-data-row" style={{ gridTemplateColumns: "40px 80px 1fr 1fr 120px 100px" }}>
                    <div onClick={() => toggleSelect(asset._id)} style={{ width: 18, height: 18, borderRadius: 4, background: isSelected ? "var(--brand)" : "rgba(255,255,255,0.06)", border: isSelected ? "2px solid var(--brand)" : "2px solid var(--line)", cursor: "pointer", display: "grid", placeItems: "center" }}>
                      {isSelected && <span style={{ color: "#fff", fontSize: 11 }}>✓</span>}
                    </div>
                    <div style={{ width: 68, height: 48, borderRadius: "var(--r-sm)", overflow: "hidden", background: "rgba(255,255,255,0.04)", cursor: "pointer" }} onClick={() => setLightbox(asset)}>
                      {asset.type === "video"
                        ? <video src={url} muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        : <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                    </div>
                    <div>
                      <strong>{asset.title || asset.originalName || "Untitled"}</strong>
                    </div>
                    <small>{asset.folder || "root"}</small>
                    <span className={`badge ${asset.type === "video" ? "badge-info" : "badge-muted"}`}>{asset.type || "file"}</span>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button className="btn-icon" style={{ width: 28, minHeight: 28 }} title="Copy URL" onClick={() => copyUrl(asset)}><Copy size={12} /></button>
                      <button className="btn-icon" style={{ width: 28, minHeight: 28 }} title="Preview" onClick={() => setLightbox(asset)}><ZoomIn size={12} /></button>
                      {!String(asset._id).startsWith("local:") && (
                        <button className="btn-icon" style={{ width: 28, minHeight: 28, color: "var(--danger)" }} title="Delete" onClick={() => setConfirm(asset)}><Trash2 size={12} /></button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <Lightbox asset={lightbox} onClose={() => setLightbox(null)} />
      <ConfirmModal
        open={!!confirm}
        title="Delete media asset?"
        body={`This removes "${confirm?.title || confirm?.originalName || "this asset"}" from the library.`}
        onCancel={() => setConfirm(null)}
        onConfirm={deleteAsset}
      />
    </section>
  );
}
