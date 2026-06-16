const mongoose = require("mongoose");

const mediaRefSchema = new mongoose.Schema({
  url: String,
  publicId: String,
  alt: String,
  type: { type: String, enum: ["image", "video", "raw", "audio"], default: "image" }
}, { _id: false });

const seoSchema = new mongoose.Schema({
  metaTitle: String,
  metaDescription: String,
  openGraphImage: mediaRefSchema,
  canonicalUrl: String,
  schema: mongoose.Schema.Types.Mixed
}, { _id: false });

module.exports = { mediaRefSchema, seoSchema };
