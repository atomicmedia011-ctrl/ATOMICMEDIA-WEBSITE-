const mongoose = require("mongoose");

const otpVerificationSchema = new mongoose.Schema({
  channel: { type: String, enum: ["email", "whatsapp"], required: true },
  target: { type: String, required: true },
  purpose: { type: String, default: "lead_verification" },
  codeHash: { type: String, required: true, select: false },
  expiresAt: { type: Date, required: true },
  verifiedAt: Date,
  attempts: { type: Number, default: 0 },
  status: { type: String, enum: ["pending", "verified", "expired"], default: "pending" },
  metadata: mongoose.Schema.Types.Mixed
}, { timestamps: true });

otpVerificationSchema.index({ target: 1, purpose: 1, createdAt: -1 });

module.exports = mongoose.model("OtpVerification", otpVerificationSchema);
