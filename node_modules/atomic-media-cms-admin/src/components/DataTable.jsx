import React from "react";

export default function DataTable({ rows = [], empty = "No records yet.", renderRow }) {
  if (!rows.length) return <div className="panel empty-media">{empty}</div>;
  return <div className="table">{rows.map(renderRow)}</div>;
}
