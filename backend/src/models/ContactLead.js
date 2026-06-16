const mongoose = require("mongoose");

const contactLeadSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  company: String,
  serviceRequired: String,
  message: String,
  sourcePage: String,
  status: { type: String, enum: ["new", "contacted", "converted", "rejected", "qualified", "closed", "spam"], default: "new" },
  notes: String,
  metadata: mongoose.Schema.Types.Mixed
}, { timestamps: true });

contactLeadSchema.index({ name: "text", email: "text", company: "text", message: "text" });
module.exports = mongoose.model("ContactLead", contactLeadSchema);
