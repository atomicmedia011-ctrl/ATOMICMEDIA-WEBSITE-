const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const { protect, requirePermission } = require("../middleware/auth");
const ContactLead = require("../models/ContactLead");
const Notification = require("../models/Notification");
const MessageTemplate = require("../models/MessageTemplate");
const Meeting = require("../models/Meeting");
const OtpVerification = require("../models/OtpVerification");
const { sendEmail, sendWhatsapp } = require("../services/communicationService");

const router = express.Router();

router.get("/notifications", protect, requirePermission("communication", "read"), asyncHandler(async (req, res) => {
  const query = {};
  if (req.query.channel) query.channel = req.query.channel;
  if (req.query.status) query.status = req.query.status;
  const items = await Notification.find(query).sort({ createdAt: -1 }).limit(200);
  res.json({ items });
}));

router.post("/whatsapp/send", protect, requirePermission("communication", "write"), asyncHandler(async (req, res) => {
  const lead = req.body.leadId ? await ContactLead.findById(req.body.leadId) : null;
  const item = await sendWhatsapp({
    to: req.body.phone || lead?.phone,
    name: req.body.name || lead?.name,
    message: req.body.message,
    templateKey: req.body.templateKey,
    data: { name: lead?.name || req.body.name || "there", service: lead?.serviceRequired || req.body.service || "project" },
    lead: lead?._id,
    createdBy: req.user.id
  });
  res.status(201).json(item);
}));

router.post("/email/send", protect, requirePermission("communication", "write"), asyncHandler(async (req, res) => {
  const lead = req.body.leadId ? await ContactLead.findById(req.body.leadId) : null;
  const item = await sendEmail({
    to: req.body.email || lead?.email,
    name: req.body.name || lead?.name,
    subject: req.body.subject,
    message: req.body.message,
    templateKey: req.body.templateKey,
    data: { name: lead?.name || req.body.name || "there", service: lead?.serviceRequired || req.body.service || "project" },
    lead: lead?._id,
    createdBy: req.user.id
  });
  res.status(201).json(item);
}));

router.get("/templates", protect, requirePermission("communication", "read"), asyncHandler(async (req, res) => {
  const query = req.query.channel ? { channel: req.query.channel } : {};
  const items = await MessageTemplate.find(query).sort({ order: 1, createdAt: -1 });
  res.json({ items });
}));

router.post("/templates", protect, requirePermission("communication", "write"), asyncHandler(async (req, res) => {
  const item = await MessageTemplate.create(req.body);
  res.status(201).json(item);
}));

router.patch("/templates/:id", protect, requirePermission("communication", "write"), asyncHandler(async (req, res) => {
  const item = await MessageTemplate.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!item) return res.status(404).json({ message: "Template not found" });
  res.json(item);
}));

router.delete("/templates/:id", protect, requirePermission("communication", "delete"), asyncHandler(async (req, res) => {
  const item = await MessageTemplate.findByIdAndDelete(req.params.id);
  if (!item) return res.status(404).json({ message: "Template not found" });
  res.json({ ok: true });
}));

router.get("/meetings", protect, requirePermission("communication", "read"), asyncHandler(async (req, res) => {
  const items = await Meeting.find().populate("lead").sort({ scheduledAt: 1 }).limit(300);
  res.json({ items });
}));

router.post("/meetings", protect, requirePermission("communication", "write"), asyncHandler(async (req, res) => {
  const lead = req.body.lead ? await ContactLead.findById(req.body.lead) : null;
  const meeting = await Meeting.create({ ...req.body, createdBy: req.user.id });
  const data = {
    name: meeting.clientName || lead?.name || "there",
    title: meeting.title,
    time: new Date(meeting.scheduledAt).toLocaleString(),
    link: meeting.meetingLink || ""
  };
  if (meeting.notifyEmail && (meeting.email || lead?.email)) {
    await sendEmail({
      to: meeting.email || lead.email,
      name: data.name,
      subject: "Atomic Media meeting scheduled",
      message: "Hi {{name}}, your meeting '{{title}}' is scheduled for {{time}}. {{link}}",
      data,
      lead: lead?._id,
      createdBy: req.user.id,
      type: "meeting"
    });
  }
  if (meeting.notifyWhatsapp && (meeting.phone || lead?.phone)) {
    await sendWhatsapp({
      to: meeting.phone || lead.phone,
      name: data.name,
      message: "Hi {{name}}, your Atomic Media meeting '{{title}}' is scheduled for {{time}}. {{link}}",
      data,
      lead: lead?._id,
      createdBy: req.user.id,
      type: "meeting"
    });
  }
  res.status(201).json(meeting);
}));

router.patch("/meetings/:id", protect, requirePermission("communication", "write"), asyncHandler(async (req, res) => {
  const item = await Meeting.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!item) return res.status(404).json({ message: "Meeting not found" });
  res.json(item);
}));

router.delete("/meetings/:id", protect, requirePermission("communication", "delete"), asyncHandler(async (req, res) => {
  const item = await Meeting.findByIdAndDelete(req.params.id);
  if (!item) return res.status(404).json({ message: "Meeting not found" });
  res.json({ ok: true });
}));

router.get("/otps", protect, requirePermission("communication", "read"), asyncHandler(async (req, res) => {
  const items = await OtpVerification.find().select("-codeHash").sort({ createdAt: -1 }).limit(200);
  res.json({ items });
}));

module.exports = router;
