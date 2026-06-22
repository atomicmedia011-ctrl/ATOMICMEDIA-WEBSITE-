import React from "react";
import { AlertTriangle, Trash2 } from "lucide-react";

export default function ConfirmModal({ open, title, body, onCancel, onConfirm }) {
  if (!open) return null;
  return (
    <div className="modal-backdrop">
      <div className="modal" style={{ maxWidth: 440 }}>
        <div style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 16 }}>
          <div style={{ width: 40, height: 40, borderRadius: "var(--r)", background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.25)", display: "grid", placeItems: "center", flexShrink: 0 }}>
            <AlertTriangle size={18} style={{ color: "var(--danger)" }} />
          </div>
          <div>
            <h2 style={{ fontSize: 17, marginBottom: 6 }}>{title}</h2>
            <p style={{ color: "var(--text-soft)", fontSize: 13, lineHeight: 1.6, margin: 0 }}>{body}</p>
          </div>
        </div>
        <div className="modal-actions">
          <button className="btn-secondary" onClick={onCancel}>Cancel</button>
          <button className="btn-danger" onClick={onConfirm}>
            <Trash2 size={14} /> Delete
          </button>
        </div>
      </div>
    </div>
  );
}
