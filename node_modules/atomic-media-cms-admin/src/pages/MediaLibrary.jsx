import React, { useEffect, useMemo, useRef, useState } from "react";
import { Copy, Search, Trash2, Upload } from "lucide-react";
import { api, assetUrl } from "../api/client";
import ConfirmModal from "../components/ConfirmModal";
import { useToast } from "../components/Toast";

export default function MediaLibrary() {
  const [items, setItems] = useState([]);
  const [folder, setFolder] = useState("atomic-media");
  const [query, setQuery] = useState("");
  const [confirm, setConfirm] = useState(null);
  const inputRef = useRef(null);
  const notify = useToast();

  async function load() {
    const result = await api("/api/admin/media");
    setItems(result.items || []);
  }

  useEffect(() => {
    load().catch((error) => notify(error.message, "error"));
  }, []);

  const filtered = useMemo(() => {
    const needle = query.toLowerCase();
    return items.filter((asset) => `${asset.title} ${asset.originalName} ${asset.folder} ${asset.url}`.toLowerCase().includes(needle));
  }, [items, query]);

  async function upload(files) {
    if (!files?.length) return;
    try {
      const body = new FormData();
      Array.from(files).forEach((file) => body.append("files", file));
      body.append("folder", folder || "atomic-media");
      await api("/api/admin/media/upload", { method: "POST", body });
      notify("Uploaded");
      await load();
    } catch (error) {
      notify(error.message, "error");
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function copyUrl(asset) {
    const url = assetUrl(asset.url);
    try {
      await navigator.clipboard.writeText(url);
      notify("Asset URL copied");
    } catch {
      notify(url);
    }
  }

  async function deleteAsset() {
    try {
      await api(`/api/admin/media/${confirm._id}`, { method: "DELETE" });
      notify("Media deleted");
      setConfirm(null);
      await load();
    } catch (error) {
      notify(error.message, "error");
    }
  }

  return (
    <section className="workspace">
      <div className="section-head">
        <div>
          <p className="eyebrow">Media library</p>
          <h1>Images & Videos</h1>
          <p className="section-description">Upload, preview, copy URLs, and remove unused media for website sections, projects, services, blogs, and team profiles.</p>
        </div>
        <button onClick={() => inputRef.current?.click()}><Upload size={18} /> Upload</button>
      </div>
      <input ref={inputRef} hidden type="file" multiple onChange={(event) => upload(event.target.files)} />

      <div className="toolbar-row">
        <label className="folder-input"><span>Upload folder</span><input value={folder} onChange={(event) => setFolder(event.target.value)} /></label>
        <div className="project-search">
          <Search size={18} />
          <input placeholder="Search media" value={query} onChange={(event) => setQuery(event.target.value)} />
        </div>
      </div>

      <div className="dropzone" onDrop={(event) => { event.preventDefault(); upload(event.dataTransfer.files); }} onDragOver={(event) => event.preventDefault()}>
        Drop images and videos here
      </div>

      {!filtered.length && <div className="empty-state">No media found. Upload assets or change the search.</div>}
      <div className="media-grid">
        {filtered.map((asset) => (
          <article className="media-card" key={asset._id}>
            <div className="media-preview">
              {asset.type === "video" ? <video src={assetUrl(asset.url)} muted controls /> : <img src={assetUrl(asset.url)} alt={asset.title || ""} />}
            </div>
            <strong>{asset.title || asset.originalName || "Untitled asset"}</strong>
            <small>{asset.folder || "root"}</small>
            <div className="media-actions">
              <button className="secondary compact" onClick={() => copyUrl(asset)}><Copy size={15} /> Copy URL</button>
              {!String(asset._id).startsWith("local:") && (
                <button className="danger compact" onClick={() => setConfirm(asset)}><Trash2 size={15} /> Delete</button>
              )}
            </div>
          </article>
        ))}
      </div>

      <ConfirmModal
        open={!!confirm}
        title="Delete media asset?"
        body={`This removes "${confirm?.title || confirm?.originalName || "this asset"}" from the media library.`}
        onCancel={() => setConfirm(null)}
        onConfirm={deleteAsset}
      />
    </section>
  );
}
