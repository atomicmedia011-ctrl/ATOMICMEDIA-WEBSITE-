import React, { useEffect, useMemo, useRef, useState } from "react";
import { ImagePlus, Trash2, Upload } from "lucide-react";
import { api, assetUrl } from "../api/client";
import { useToast } from "./Toast";

function asMedia(value) {
  if (!value) return null;
  if (typeof value === "string") return { url: value, title: value.split("/").pop() };
  return value;
}

function mediaLabel(asset) {
  return asset?.title || asset?.alt || asset?.url?.split("/").pop() || "Media";
}

export default function MediaField({ label, value, onChange, multiple = false, accept = "image", defaultFolder = "atomic-media", folderLocked = false }) {
  const [open, setOpen] = useState(false);
  const [assets, setAssets] = useState([]);
  const [search, setSearch] = useState("");
  const [folder, setFolder] = useState(defaultFolder || "atomic-media");
  const inputRef = useRef(null);
  const notify = useToast();
  const selected = useMemo(() => multiple ? (Array.isArray(value) ? value : []) : asMedia(value), [value, multiple]);

  async function load() {
    const [stored, local] = await Promise.all([
      api(`/api/admin/media?limit=100${accept ? `&type=${accept}` : ""}`).catch(() => ({ items: [] })),
      api(`/api/admin/media/local-assets?${accept ? `type=${accept}` : ""}`).catch(() => ({ items: [] }))
    ]);
    const seen = new Set();
    const merged = [...(stored.items || []), ...(local.items || [])].filter((asset) => {
      if (!asset.url || seen.has(asset.url)) return false;
      seen.add(asset.url);
      return true;
    });
    setAssets(merged);
  }

  useEffect(() => {
    if (open) load().catch((error) => notify(error.message, "error"));
  }, [open, accept]);

  useEffect(() => {
    if (defaultFolder) setFolder(defaultFolder);
  }, [defaultFolder]);

  function choose(asset) {
    const media = {
      url: asset.url,
      secureUrl: asset.secureUrl || asset.url,
      publicId: asset.publicId,
      alt: asset.title,
      type: asset.type
    };
    if (multiple) {
      onChange([...(Array.isArray(value) ? value : []), media]);
    } else {
      onChange(media);
    }
    setOpen(false);
  }

  async function upload(files) {
    if (!files?.length) return;
    try {
      const body = new FormData();
      Array.from(files).forEach((file) => body.append("files", file));
      body.append("folder", folder || defaultFolder || "atomic-media");
      const result = await api("/api/admin/media/upload", { method: "POST", body });
      notify("Uploaded");
      await load();
      if (result.items?.[0]) choose(result.items[0]);
    } catch (error) {
      notify(error.message, "error");
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const filtered = assets.filter((asset) => `${asset.title || ""} ${asset.folder || ""}`.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="media-field">
      <span>{label}</span>
      {multiple ? (
        <div className="media-strip">
          {selected.map((asset, index) => (
            <div className="media-thumb" key={`${asset.url}-${index}`}>
              {asset.type === "video" ? <video src={assetUrl(asset.url)} muted /> : <img src={assetUrl(asset.url)} alt={asset.alt || ""} />}
              <button type="button" onClick={() => onChange(selected.filter((_, i) => i !== index))}><Trash2 size={14} /></button>
            </div>
          ))}
          <button type="button" className="media-add" onClick={() => setOpen(true)}><ImagePlus size={18} /> Add</button>
        </div>
      ) : selected?.url ? (
        <div className="media-preview">
          {selected.type === "video" ? <video src={assetUrl(selected.url)} muted controls /> : <img src={assetUrl(selected.url)} alt={selected.alt || ""} />}
          <div>
            <strong>{mediaLabel(selected)}</strong>
            <div className="inline-actions">
              <button type="button" className="secondary" onClick={() => setOpen(true)}>Replace</button>
              <button type="button" className="ghost danger" onClick={() => onChange(null)}>Remove</button>
            </div>
          </div>
        </div>
      ) : (
        <button type="button" className="secondary media-empty" onClick={() => setOpen(true)}><ImagePlus size={18} /> Select or upload {accept}</button>
      )}

      {open && (
        <div className="modal-backdrop">
          <div className="modal media-modal">
            <div className="section-head compact">
              <div>
                <p className="eyebrow">Media picker</p>
                <h2>{label}</h2>
              </div>
              <button type="button" className="secondary" onClick={() => setOpen(false)}>Close</button>
            </div>
            <div className="media-tools">
              <input placeholder="Search existing photos/videos" value={search} onChange={(event) => setSearch(event.target.value)} />
              <input placeholder="Upload folder" value={folder} disabled={folderLocked} onChange={(event) => setFolder(event.target.value)} />
              <button type="button" onClick={() => inputRef.current?.click()}><Upload size={18} /> Upload</button>
              <input
                ref={inputRef}
                hidden
                type="file"
                multiple={multiple}
                accept={accept === "video" ? "video/*" : "image/*"}
                onChange={(event) => upload(event.target.files)}
              />
            </div>
            <div className="media-picker-grid">
              {filtered.map((asset) => (
                <button type="button" className="picker-card" key={asset.url} onClick={() => choose(asset)}>
                  {asset.type === "video" ? <video src={assetUrl(asset.url)} muted /> : <img src={assetUrl(asset.url)} alt={asset.title || ""} />}
                  <strong>{mediaLabel(asset)}</strong>
                  <small>{asset.folder}</small>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
