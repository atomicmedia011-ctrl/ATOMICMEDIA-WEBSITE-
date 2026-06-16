const mongoose = require("mongoose");

const chatbotConversationSchema = new mongoose.Schema({
  visitorId: String,
  name: String,
  email: String,
  phone: String,
  business: String,
  serviceNeed: String,
  budget: String,
  timeline: String,
  messages: [{
    role: { type: String, enum: ["visitor", "bot", "admin"], required: true },
    content: String,
    createdAt: { type: Date, default: Date.now }
  }],
  leadScore: { type: String, enum: ["hot", "warm", "cold"], default: "cold" },
  status: { type: String, enum: ["open", "qualified", "closed"], default: "open" },
  lead: { type: mongoose.Schema.Types.ObjectId, ref: "ContactLead" }
}, { timestamps: true });

chatbotConversationSchema.index({ name: "text", email: "text", business: "text", serviceNeed: "text" });

module.exports = mongoose.model("ChatbotConversation", chatbotConversationSchema);
