const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const { protect, requirePermission } = require("../middleware/auth");
const Project = require("../models/Project");
const Service = require("../models/Service");
const Testimonial = require("../models/Testimonial");
const TeamMember = require("../models/TeamMember");
const BlogPost = require("../models/BlogPost");
const MediaAsset = require("../models/MediaAsset");
const ContactLead = require("../models/ContactLead");
const Visit = require("../models/Visit");

const router = express.Router();

router.get("/", protect, requirePermission("analytics", "read"), asyncHandler(async (req, res) => {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const [
    totalProjects,
    totalServices,
    activeServices,
    totalTestimonials,
    totalTeamMembers,
    totalBlogPosts,
    totalMedia,
    recentUploads,
    leads,
    visits,
    topPages,
    recentLeads
  ] = await Promise.all([
    Project.countDocuments(),
    Service.countDocuments(),
    Service.countDocuments({ enabled: true }),
    Testimonial.countDocuments(),
    TeamMember.countDocuments(),
    BlogPost.countDocuments(),
    MediaAsset.countDocuments(),
    MediaAsset.find().sort({ createdAt: -1 }).limit(8),
    ContactLead.countDocuments({ createdAt: { $gte: since } }),
    Visit.countDocuments({ createdAt: { $gte: since } }),
    Visit.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: "$path", visits: { $sum: 1 } } },
      { $sort: { visits: -1 } },
      { $limit: 8 }
    ]),
    ContactLead.find().sort({ createdAt: -1 }).limit(6)
  ]);

  const mediaStats = await MediaAsset.aggregate([
    { $group: { _id: "$type", count: { $sum: 1 }, totalSize: { $sum: "$size" } } }
  ]);

  res.json({
    counts: { totalProjects, totalServices, activeServices, totalTestimonials, totalTeamMembers, totalBlogPosts, totalMedia, leads, visits },
    recentUploads,
    recentLeads,
    mediaStats,
    topPages
  });
}));

module.exports = router;
