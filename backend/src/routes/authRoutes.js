const crypto = require("crypto");
const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const User = require("../models/User");
const { protect, requirePermission, signToken } = require("../middleware/auth");

const router = express.Router();

function sendUser(res, user) {
  const token = signToken(user);
  res.cookie("token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role }
  });
}

router.post("/login", asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: String(req.body.email || "").toLowerCase() }).select("+passwordHash");
  if (!user || !(await user.comparePassword(req.body.password || ""))) {
    return res.status(401).json({ message: "Invalid email or password" });
  }
  user.lastLoginAt = new Date();
  await user.save();
  sendUser(res, user);
}));

router.post("/logout", (req, res) => {
  res.clearCookie("token");
  res.json({ ok: true });
});

router.get("/me", protect, (req, res) => {
  res.json({ id: req.user.id, name: req.user.name, email: req.user.email, role: req.user.role });
});

router.post("/users", protect, requirePermission("settings", "write"), asyncHandler(async (req, res) => {
  const user = new User({ name: req.body.name, email: req.body.email, role: req.body.role || "editor" });
  await user.setPassword(req.body.password);
  await user.save();
  res.status(201).json({ id: user.id, name: user.name, email: user.email, role: user.role });
}));

router.post("/password-reset/request", asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: String(req.body.email || "").toLowerCase() });
  if (user) {
    const token = crypto.randomBytes(32).toString("hex");
    user.resetTokenHash = crypto.createHash("sha256").update(token).digest("hex");
    user.resetTokenExpiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();
    console.log(`Password reset token for ${user.email}: ${token}`);
  }
  res.json({ message: "If the account exists, a reset token has been generated." });
}));

router.post("/password-reset/confirm", asyncHandler(async (req, res) => {
  const tokenHash = crypto.createHash("sha256").update(req.body.token || "").digest("hex");
  const user = await User.findOne({
    resetTokenHash: tokenHash,
    resetTokenExpiresAt: { $gt: new Date() }
  });
  if (!user) return res.status(400).json({ message: "Invalid or expired reset token" });
  await user.setPassword(req.body.password);
  user.resetTokenHash = undefined;
  user.resetTokenExpiresAt = undefined;
  await user.save();
  res.json({ ok: true });
}));

module.exports = router;
