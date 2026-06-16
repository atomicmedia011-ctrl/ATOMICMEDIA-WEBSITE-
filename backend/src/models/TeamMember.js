const mongoose = require("mongoose");
const { mediaRefSchema } = require("./common");

const teamMemberSchema = new mongoose.Schema({
  name: { type: String, required: true },
  position: String,
  bio: String,
  profilePicture: mediaRefSchema,
  videos: [mediaRefSchema],
  reels: [mediaRefSchema],
  isCore: { type: Boolean, default: true },
  socialLinks: {
    website: String,
    linkedin: String,
    instagram: String,
    x: String,
    dribbble: String
  },
  enabled: { type: Boolean, default: true },
  order: { type: Number, default: 0 }
}, { timestamps: true });

teamMemberSchema.index({ name: "text", position: "text", bio: "text" });
module.exports = mongoose.model("TeamMember", teamMemberSchema);
