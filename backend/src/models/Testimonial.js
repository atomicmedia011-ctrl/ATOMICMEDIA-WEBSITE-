const mongoose = require("mongoose");
const { mediaRefSchema } = require("./common");

const testimonialSchema = new mongoose.Schema({
  clientName: { type: String, required: true },
  designation: String,
  company: String,
  quote: { type: String, required: true },
  rating: { type: Number, default: 5, min: 1, max: 5 },
  image: mediaRefSchema,
  video: mediaRefSchema,
  reels: [mediaRefSchema],
  enabled: { type: Boolean, default: true },
  order: { type: Number, default: 0 }
}, { timestamps: true });

testimonialSchema.index({ clientName: "text", company: "text", quote: "text" });
module.exports = mongoose.model("Testimonial", testimonialSchema);
