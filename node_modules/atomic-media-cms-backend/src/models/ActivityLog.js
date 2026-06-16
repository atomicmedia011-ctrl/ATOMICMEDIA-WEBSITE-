const mongoose = require("mongoose");

const activityLogSchema = new mongoose.Schema({
  actor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  action: String,
  entity: String,
  entityId: String,
  message: String,
  metadata: mongoose.Schema.Types.Mixed
}, { timestamps: true });

module.exports = mongoose.model("ActivityLog", activityLogSchema);
