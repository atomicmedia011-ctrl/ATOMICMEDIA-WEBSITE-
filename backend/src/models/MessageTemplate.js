const mongoose = require("mongoose");

const messageTemplateSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  channel: { type: String, enum: ["whatsapp", "email"], required: true },
  subject: String,
  body: { type: String, required: true },
  enabled: { type: Boolean, default: true },
  order: { type: Number, default: 0 }
}, { timestamps: true });

messageTemplateSchema.index({ name: "text", key: "text", body: "text" });

module.exports = mongoose.model("MessageTemplate", messageTemplateSchema);
