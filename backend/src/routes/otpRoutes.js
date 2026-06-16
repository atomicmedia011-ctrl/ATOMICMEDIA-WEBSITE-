const crypto = require("crypto");
const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const OtpVerification = require("../models/OtpVerification");
const { sendEmail, sendWhatsapp } = require("../services/communicationService");

const router = express.Router();

function hash(code) {
  return crypto.createHash("sha256").update(String(code)).digest("hex");
}

function code() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

router.post("/request", asyncHandler(async (req, res) => {
  const channel = req.body.channel === "whatsapp" ? "whatsapp" : "email";
  const target = String(req.body.target || "").trim();
  if (!target) return res.status(400).json({ message: "OTP target is required" });
  const otp = code();
  const expiresAt = new Date(Date.now() + Number(process.env.OTP_EXPIRY_MINUTES || 10) * 60 * 1000);
  const item = await OtpVerification.create({
    channel,
    target,
    purpose: req.body.purpose || "lead_verification",
    codeHash: hash(otp),
    expiresAt,
    metadata: { sourcePage: req.body.sourcePage }
  });
  if (channel === "email") {
    await sendEmail({ to: target, subject: "Atomic Media OTP", message: `Your Atomic Media OTP is ${otp}. It expires in 10 minutes.`, type: "otp" });
  } else {
    await sendWhatsapp({ to: target, message: `Your Atomic Media OTP is ${otp}. It expires in 10 minutes.`, type: "otp" });
  }
  res.status(201).json({ id: item.id, expiresAt, ok: true });
}));

router.post("/verify", asyncHandler(async (req, res) => {
  const item = await OtpVerification.findById(req.body.id).select("+codeHash");
  if (!item) return res.status(404).json({ message: "OTP not found" });
  if (item.expiresAt < new Date()) {
    item.status = "expired";
    await item.save();
    return res.status(400).json({ message: "OTP expired" });
  }
  item.attempts += 1;
  if (item.codeHash !== hash(req.body.code || "")) {
    await item.save();
    return res.status(400).json({ message: "Invalid OTP" });
  }
  item.status = "verified";
  item.verifiedAt = new Date();
  await item.save();
  res.json({ ok: true, verified: true });
}));

module.exports = router;
