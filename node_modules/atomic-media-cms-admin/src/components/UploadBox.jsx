import React from "react";
import { Upload } from "lucide-react";

export default function UploadBox({ children, onClick }) {
  return (
    <button type="button" className="dropzone" onClick={onClick}>
      <Upload size={22} />
      <span>{children || "Upload or drop media"}</span>
    </button>
  );
}
