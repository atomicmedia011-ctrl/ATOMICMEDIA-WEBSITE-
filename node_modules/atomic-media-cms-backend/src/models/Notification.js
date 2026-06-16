const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  channel: { type: String, enum: ["whatsapp", "email"], required: true },
  type: { type: String, enum: ["manual", "lead_auto", "confirmation", "proposal", "meeting", "otp"], default: "manual" },
  recipientName: String,
  recipientEmail: String,
  recipientPhone: String,
  subject: String,
  message: { type: String, required: true },
  templateKey: String,
  lead: { type: mongoose.Schema.Types.ObjectId, ref: "ContactLead" },
  status: { type: String, enum: ["pending", "sent", "failed"], default: "pending" },
  provider: String,
  providerResponse: mongoose.Schema.Types.Mixed,
  error: String,
  sentAt: Date,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });

notificationSchema.index({ channel: 1, status: 1, createdAt: -1 });
notificationSchema.index({ recipientEmail: "text", recipientPhone: "text", message: "text", subject: "text" });

module.exports = mongoose.model("Notification", notificationSchema);
