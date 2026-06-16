import React from "react";

export default function ToggleSwitch({ checked, onChange, label }) {
  return (
    <button type="button" className={checked ? "pill active" : "pill"} onClick={() => onChange(!checked)}>
      {label} {checked ? "On" : "Off"}
    </button>
  );
}
