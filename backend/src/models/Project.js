const mongoose = require("mongoose");
const { mediaRefSchema, seoSchema } = require("./common");

const projectSchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  excerpt: String,
  body: String,
  client: String,
  year: String,
  liveUrl: String,
  projectType: String,
  eventType: String,
  mediaFolder: String,
  categories: [String],
  technologies: [String],
  featured: { type: Boolean, default: false },
  enabled: { type: Boolean, default: true },
  order: { type: Number, default: 0 },
  coverImage: mediaRefSchema,
  images: [mediaRefSchema],
  videos: [mediaRefSchema],
  reels: [mediaRefSchema],
  detailSections: [mongoose.Schema.Types.Mixed],
  seo: seoSchema
}, { timestamps: true });

projectSchema.index({ title: "text", excerpt: "text", categories: "text" });
module.exports = mongoose.model("Project", projectSchema);
