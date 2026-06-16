const mongoose = require("mongoose");

const proposalSchema = new mongoose.Schema({
  lead: { type: mongoose.Schema.Types.ObjectId, ref: "ContactLead" },
  service: { type: mongoose.Schema.Types.ObjectId, ref: "Service" },
  projectType: String,
  clientName: String,
  title: { type: String, required: true },
  content: {
    projectSummary: String,
    scopeOfWork: [String],
    timeline: String,
    pricing: String,
    terms: String,
    cta: String
  },
  status: { type: String, enum: ["draft", "sent", "accepted", "rejected"], default: "draft" },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  sentAt: Date
}, { timestamps: true });

proposalSchema.index({ title: "text", clientName: "text", projectType: "text" });

module.exports = mongoose.model("Proposal", proposalSchema);
