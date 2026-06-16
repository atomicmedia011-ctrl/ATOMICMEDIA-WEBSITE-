const mongoose = require("mongoose");
const { mediaRefSchema, seoSchema } = require("./common");

const blogPostSchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  excerpt: String,
  content: String,
  featuredImage: mediaRefSchema,
  images: [mediaRefSchema],
  videos: [mediaRefSchema],
  reels: [mediaRefSchema],
  categories: [String],
  tags: [String],
  status: { type: String, enum: ["draft", "published"], default: "draft" },
  publishedAt: Date,
  seo: seoSchema
}, { timestamps: true });

blogPostSchema.index({ title: "text", excerpt: "text", content: "text", tags: "text" });
module.exports = mongoose.model("BlogPost", blogPostSchema);
