const mongoose = require("mongoose");
const { mediaRefSchema, seoSchema } = require("./common");

const serviceSchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  category: String,
  summary: String,
  body: String,
  icon: mediaRefSchema,
  image: mediaRefSchema,
  images: [mediaRefSchema],
  videos: [mediaRefSchema],
  reels: [mediaRefSchema],
  enabled: { type: Boolean, default: true },
  order: { type: Number, default: 0 },
  seo: seoSchema
}, { timestamps: true });

serviceSchema.index({ title: "text", summary: "text", body: "text" });
module.exports = mongoose.model("Service", serviceSchema);
