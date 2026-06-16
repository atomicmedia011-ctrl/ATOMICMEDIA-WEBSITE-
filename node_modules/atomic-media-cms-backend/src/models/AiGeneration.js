const mongoose = require("mongoose");

const aiGenerationSchema = new mongoose.Schema({
  type: { type: String, enum: ["content_ideas", "seo_keywords"], required: true },
  prompt: mongoose.Schema.Types.Mixed,
  result: mongoose.Schema.Types.Mixed,
  saved: { type: Boolean, default: false },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });

aiGenerationSchema.index({ type: 1, createdAt: -1 });

module.exports = mongoose.model("AiGeneration", aiGenerationSchema);
