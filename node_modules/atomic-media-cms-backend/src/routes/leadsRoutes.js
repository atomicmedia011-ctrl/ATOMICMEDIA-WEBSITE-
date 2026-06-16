const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const { protect, requirePermission } = require("../middleware/auth");
const ContactLead = require("../models/ContactLead");

const router = express.Router();

router.get("/", protect, requirePermission("leads", "read"), asyncHandler(async (req, res) => {
  const leads = await ContactLead.find().sort({ createdAt: -1 }).limit(500);
  res.json({ items: leads });
}));

router.patch("/:id", protect, requirePermission("leads", "write"), asyncHandler(async (req, res) => {
  const lead = await ContactLead.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!lead) return res.status(404).json({ message: "Lead not found" });
  res.json(lead);
}));

router.get("/export.csv", protect, requirePermission("leads", "read"), asyncHandler(async (req, res) => {
  const leads = await ContactLead.find().sort({ createdAt: -1 });
  const headers = ["createdAt", "status", "name", "email", "phone", "company", "serviceRequired", "message", "sourcePage"];
  const escape = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
  const csv = [headers.join(","), ...leads.map((lead) => headers.map((key) => escape(lead[key])).join(","))].join("\n");
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", "attachment; filename=contact-leads.csv");
  res.send(csv);
}));

module.exports = router;
