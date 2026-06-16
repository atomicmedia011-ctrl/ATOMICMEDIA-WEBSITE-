const mongoose = require("mongoose");
const { mediaRefSchema, seoSchema } = require("./common");

const websiteSettingSchema = new mongoose.Schema({
  key: { type: String, unique: true, default: "global" },
  companyName: String,
  logo: mediaRefSchema,
  darkLogo: mediaRefSchema,
  favicon: mediaRefSchema,
  heroHeading: String,
  heroSubheading: String,
  heroCtaText: String,
  heroCtaLink: String,
  heroBackgroundImage: mediaRefSchema,
  heroBackgroundVideo: mediaRefSchema,
  loadingAnimationAsset: mediaRefSchema,
  heroImages: [mediaRefSchema],
  heroVideos: [mediaRefSchema],
  reels: [mediaRefSchema],
  contact: {
    email: String,
    phone: String,
    address: String
  },
  socialLinks: {
    instagram: String,
    linkedin: String,
    x: String,
    youtube: String,
    dribbble: String
  },
  footer: {
    headline: String,
    body: String,
    copyright: String,
    links: [mongoose.Schema.Types.Mixed]
  },
  theme: mongoose.Schema.Types.Mixed,
  security: mongoose.Schema.Types.Mixed,
  seo: seoSchema,
  metaKeywords: [String]
}, { timestamps: true });

module.exports = mongoose.model("WebsiteSetting", websiteSettingSchema);
