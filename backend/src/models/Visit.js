const mongoose = require("mongoose");

const visitSchema = new mongoose.Schema({
  path: String,
  referrer: String,
  userAgent: String,
  ip: String
}, { timestamps: true });

visitSchema.index({ path: 1, createdAt: -1 });
module.exports = mongoose.model("Visit", visitSchema);
