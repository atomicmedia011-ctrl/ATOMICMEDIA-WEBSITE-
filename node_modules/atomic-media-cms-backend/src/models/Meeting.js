const mongoose = require("mongoose");

const meetingSchema = new mongoose.Schema({
  lead: { type: mongoose.Schema.Types.ObjectId, ref: "ContactLead" },
  clientName: String,
  email: String,
  phone: String,
  title: { type: String, required: true },
  notes: String,
  scheduledAt: { type: Date, required: true },
  durationMinutes: { type: Number, default: 30 },
  meetingLink: String,
  status: { type: String, enum: ["scheduled", "completed", "cancelled"], default: "scheduled" },
  notifyEmail: { type: Boolean, default: true },
  notifyWhatsapp: { type: Boolean, default: false },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });

meetingSchema.index({ scheduledAt: 1, status: 1 });
meetingSchema.index({ clientName: "text", email: "text", phone: "text", title: "text" });

module.exports = mongoose.model("Meeting", meetingSchema);
