const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const { protect, requirePermission } = require("../middleware/auth");
const ContactLead = require("../models/ContactLead");
const Service = require("../models/Service");
const ChatbotConversation = require("../models/ChatbotConversation");
const AiGeneration = require("../models/AiGeneration");
const Proposal = require("../models/Proposal");
const Notification = require("../models/Notification");
const { sendEmail } = require("../services/communicationService");
const { generateText, fallbackContentIdeas, fallbackSeo, fallbackProposal, scoreLead } = require("../services/aiService");

const router = express.Router();

router.get("/chatbot/conversations", protect, requirePermission("ai", "read"), asyncHandler(async (req, res) => {
  const items = await ChatbotConversation.find().populate("lead").sort({ createdAt: -1 }).limit(200);
  res.json({ items });
}));

router.patch("/chatbot/conversations/:id", protect, requirePermission("ai", "write"), asyncHandler(async (req, res) => {
  const item = await ChatbotConversation.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!item) return res.status(404).json({ message: "Conversation not found" });
  res.json(item);
}));

router.get("/generations", protect, requirePermission("ai", "read"), asyncHandler(async (req, res) => {
  const query = req.query.type ? { type: req.query.type } : {};
  const items = await AiGeneration.find(query).sort({ createdAt: -1 }).limit(200);
  res.json({ items });
}));

router.post("/content-ideas", protect, requirePermission("ai", "write"), asyncHandler(async (req, res) => {
  const prompt = `Generate content ideas for niche: ${req.body.niche}, platform: ${req.body.platform}, goal: ${req.body.goal}, tone: ${req.body.tone}. Return concise grouped ideas.`;
  const aiText = await generateText(prompt);
  const result = aiText ? { text: aiText } : fallbackContentIdeas(req.body);
  const item = await AiGeneration.create({ type: "content_ideas", prompt: req.body, result, saved: true, createdBy: req.user.id });
  res.status(201).json(item);
}));

router.post("/seo", protect, requirePermission("ai", "write"), asyncHandler(async (req, res) => {
  const prompt = `Suggest SEO keywords, meta title, meta description, and content outline for: ${req.body.topic || req.body.service || req.body.page}. Return useful structured recommendations.`;
  const aiText = await generateText(prompt);
  const result = aiText ? { text: aiText } : fallbackSeo(req.body);
  const item = await AiGeneration.create({ type: "seo_keywords", prompt: req.body, result, saved: true, createdBy: req.user.id });
  res.status(201).json(item);
}));

router.get("/proposals", protect, requirePermission("ai", "read"), asyncHandler(async (req, res) => {
  const items = await Proposal.find().populate("lead service").sort({ createdAt: -1 }).limit(200);
  res.json({ items });
}));

router.post("/proposals/generate", protect, requirePermission("ai", "write"), asyncHandler(async (req, res) => {
  const lead = req.body.leadId ? await ContactLead.findById(req.body.leadId) : null;
  const service = req.body.serviceId ? await Service.findById(req.body.serviceId) : null;
  const prompt = `Create a professional Atomic Media proposal for client ${lead?.name || req.body.clientName || "Client"} for ${service?.title || req.body.projectType}. Include project summary, scope, timeline, pricing, terms, and CTA.`;
  const aiText = await generateText(prompt);
  const content = aiText ? { projectSummary: aiText } : fallbackProposal({ lead, service, projectType: req.body.projectType });
  const proposal = await Proposal.create({
    lead: lead?._id,
    service: service?._id,
    projectType: req.body.projectType,
    clientName: lead?.name || req.body.clientName || "Client",
    title: req.body.title || `Proposal for ${lead?.name || req.body.clientName || "Client"}`,
    content,
    createdBy: req.user.id
  });
  res.status(201).json(proposal);
}));

router.patch("/proposals/:id", protect, requirePermission("ai", "write"), asyncHandler(async (req, res) => {
  const item = await Proposal.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!item) return res.status(404).json({ message: "Proposal not found" });
  res.json(item);
}));

router.delete("/proposals/:id", protect, requirePermission("ai", "delete"), asyncHandler(async (req, res) => {
  const item = await Proposal.findByIdAndDelete(req.params.id);
  if (!item) return res.status(404).json({ message: "Proposal not found" });
  res.json({ ok: true });
}));

router.post("/proposals/:id/email", protect, requirePermission("ai", "write"), asyncHandler(async (req, res) => {
  const proposal = await Proposal.findById(req.params.id).populate("lead");
  if (!proposal) return res.status(404).json({ message: "Proposal not found" });
  const email = req.body.email || proposal.lead?.email;
  if (!email) return res.status(400).json({ message: "Recipient email is required" });
  const notification = await sendEmail({
    to: email,
    name: proposal.clientName,
    subject: req.body.subject || proposal.title,
    message: req.body.message || JSON.stringify(proposal.content, null, 2),
    lead: proposal.lead?._id,
    createdBy: req.user.id,
    type: "proposal"
  });
  proposal.status = "sent";
  proposal.sentAt = new Date();
  await proposal.save();
  res.json({ proposal, notification });
}));

module.exports = router;
