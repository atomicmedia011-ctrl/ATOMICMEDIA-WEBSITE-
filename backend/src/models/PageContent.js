const mongoose = require("mongoose");
const { mediaRefSchema, seoSchema } = require("./common");

const fieldSchema = new mongoose.Schema({
  key: { type: String, required: true },
  label: String,
  selector: String,
  type: { type: String, enum: ["text", "html", "attr", "styleBackground", "image", "video", "link", "toggle"], default: "text" },
  attr: String,
  value: mongoose.Schema.Types.Mixed,
  media: mediaRefSchema,
  enabled: { type: Boolean, default: true }
}, { _id: true });

const sectionSchema = new mongoose.Schema({
  key: { type: String, required: true },
  label: String,
  enabled: { type: Boolean, default: true },
  order: { type: Number, default: 0 },
  fields: [fieldSchema]
}, { _id: true });

const pageContentSchema = new mongoose.Schema({
  page: { type: String, required: true, unique: true },
  title: String,
  sections: [sectionSchema],
  seo: seoSchema
}, { timestamps: true });

module.exports = mongoose.model("PageContent", pageContentSchema);
