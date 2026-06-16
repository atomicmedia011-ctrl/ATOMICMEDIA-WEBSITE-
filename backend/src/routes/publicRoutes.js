const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const Project = require("../models/Project");
const Service = require("../models/Service");
const Testimonial = require("../models/Testimonial");
const TeamMember = require("../models/TeamMember");
const BlogPost = require("../models/BlogPost");
const WebsiteSetting = require("../models/WebsiteSetting");
const PageContent = require("../models/PageContent");
const ContactLead = require("../models/ContactLead");
const Meeting = require("../models/Meeting");
const Visit = require("../models/Visit");
const { notifyNewLead, sendEmail, sendWhatsapp } = require("../services/communicationService");

const router = express.Router();

router.get("/site", asyncHandler(async (req, res) => {
  const [settings, pages, projects, services, testimonials, team, blogs] = await Promise.all([
    WebsiteSetting.findOne({ key: "global" }),
    PageContent.find({}).sort({ page: 1 }),
    Project.find({ enabled: true }).sort({ order: 1, createdAt: -1 }),
    Service.find({ enabled: true }).sort({ order: 1, createdAt: -1 }),
    Testimonial.find({ enabled: true }).sort({ order: 1, createdAt: -1 }),
    TeamMember.find({ enabled: true }).sort({ order: 1, createdAt: -1 }),
    BlogPost.find({ status: "published" }).sort({ publishedAt: -1 }).limit(12)
  ]);
  res.json({ settings, pages, projects, services, testimonials, team, blogs });
}));

router.get("/page/:page", asyncHandler(async (req, res) => {
  const page = await PageContent.findOne({ page: req.params.page });
  if (!page) return res.status(404).json({ message: "Page not found" });
  res.json(page);
}));

router.post("/leads", asyncHandler(async (req, res) => {
  const lead = await ContactLead.create({
    ...req.body,
    sourcePage: req.body.sourcePage || req.headers.referer,
    metadata: { userAgent: req.headers["user-agent"] }
  });
  await notifyNewLead(lead).catch((error) => console.error("Lead notification failed", error));
  res.status(201).json({ id: lead.id, ok: true });
}));

router.post("/meetings", asyncHandler(async (req, res) => {
  const meeting = await Meeting.create({
    title: req.body.title || `Meeting request: ${req.body.service || "Atomic Media"}`,
    clientName: req.body.name,
    email: req.body.email,
    phone: req.body.phone,
    notes: req.body.message || req.body.service,
    scheduledAt: req.body.scheduledAt || req.body.preferredDateTime,
    meetingLink: req.body.meetingLink,
    status: "scheduled",
    notifyEmail: true,
    notifyWhatsapp: false
  });
  const data = {
    name: meeting.clientName || "there",
    title: meeting.title,
    time: new Date(meeting.scheduledAt).toLocaleString(),
    service: req.body.service || "Atomic Media"
  };
  if (meeting.email) {
    await sendEmail({
      to: meeting.email,
      name: meeting.clientName,
      subject: "Atomic Media meeting request received",
      message: "Hi {{name}}, your meeting request for {{service}} has been received for {{time}}.",
      data,
      type: "meeting"
    }).catch((error) => console.error("Meeting email failed", error));
  }
  if (meeting.phone && process.env.AUTO_WHATSAPP_ON_MEETING === "true") {
    await sendWhatsapp({
      to: meeting.phone,
      name: meeting.clientName,
      message: "Hi {{name}}, your Atomic Media meeting request for {{service}} has been received for {{time}}.",
      data,
      type: "meeting"
    }).catch((error) => console.error("Meeting WhatsApp failed", error));
  }
  res.status(201).json({ id: meeting.id, ok: true });
}));

router.post("/analytics/visit", asyncHandler(async (req, res) => {
  await Visit.create({
    path: req.body.path,
    referrer: req.body.referrer,
    userAgent: req.headers["user-agent"],
    ip: req.ip
  });
  res.status(201).json({ ok: true });
}));

module.exports = router;
