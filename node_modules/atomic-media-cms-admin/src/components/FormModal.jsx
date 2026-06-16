import React from "react";

export default function FormModal({ open, title, children, onClose }) {
  if (!open) return null;
  return (
    <div className="modal-backdrop">
      <div className="modal media-modal">
        <div className="section-head compact">
          <h2>{title}</h2>
          <button className="secondary" onClick={onClose}>Close</button>
        </div>
        {children}
      </div>
    </div>
  );
}
