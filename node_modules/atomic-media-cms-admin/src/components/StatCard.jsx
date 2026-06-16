import React from "react";

export default function StatCard({ label, value, hint, caption, icon: Icon }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value ?? "-"}</strong>
      {(hint || caption) && <small>{hint || caption}</small>}
      {Icon && <Icon size={22} style={{ position: "absolute", right: 18, top: 18, color: "var(--accent-2)" }} />}
    </div>
  );
}
