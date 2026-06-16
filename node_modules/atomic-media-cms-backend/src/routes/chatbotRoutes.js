const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const ContactLead = require("../models/ContactLead");
const ChatbotConversation = require("../models/ChatbotConversation");
const { scoreLead } = require("../services/aiService");

const router = express.Router();

router.post("/conversation", asyncHandler(async (req, res) => {
  const item = await ChatbotConversation.create({
    visitorId: req.body.visitorId,
    messages: [{ role: "bot", content: "Tell us about your business, budget, service need, timeline, and contact details." }]
  });
  res.status(201).json(item);
}));

router.post("/conversation/:id/message", asyncHandler(async (req, res) => {
  const item = await ChatbotConversation.findById(req.params.id);
  if (!item) return res.status(404).json({ message: "Conversation not found" });
  item.messages.push({ role: "visitor", content: req.body.message || "" });
  ["name", "email", "phone", "business", "serviceNeed", "budget", "timeline"].forEach((field) => {
    if (req.body[field]) item[field] = req.body[field];
  });
  item.leadScore = scoreLead(item);
  item.messages.push({ role: "bot", content: "Thanks. Atomic Media has captured your details and our team will review your project fit." });
  await item.save();
  res.json(item);
}));

router.post("/conversation/:id/qualify", asyncHandler(async (req, res) => {
  const item = await ChatbotConversation.findById(req.params.id);
  if (!item) return res.status(404).json({ message: "Conversation not found" });
  const lead = await ContactLead.create({
    name: item.name,
    email: item.email,
    phone: item.phone,
    company: item.business,
    serviceRequired: item.serviceNeed,
    message: `Budget: ${item.budget || "-"}\nTimeline: ${item.timeline || "-"}\nLead score: ${item.leadScore}`,
    sourcePage: "chatbot",
    status: item.leadScore === "hot" ? "qualified" : "new",
    metadata: { chatbotConversation: item.id }
  });
  item.lead = lead._id;
  item.status = "qualified";
  await item.save();
  res.status(201).json({ conversation: item, lead });
}));

module.exports = router;
