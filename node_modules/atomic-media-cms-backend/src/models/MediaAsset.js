const mongoose = require("mongoose");

const mediaAssetSchema = new mongoose.Schema({
  title: String,
  folder: { type: String, default: "general" },
  type: { type: String, enum: ["image", "video", "raw", "audio"], required: true },
  mimeType: String,
  size: Number,
  width: Number,
  height: Number,
  duration: Number,
  url: { type: String, required: true },
  secureUrl: String,
  publicId: String,
  provider: { type: String, enum: ["cloudinary", "local"], default: "cloudinary" },
  tags: [String],
  usedIn: [String],
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });

mediaAssetSchema.index({ title: "text", folder: "text", tags: "text", url: "text" });
module.exports = mongoose.model("MediaAsset", mediaAssetSchema);
