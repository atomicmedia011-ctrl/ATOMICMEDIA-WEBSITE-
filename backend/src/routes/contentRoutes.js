const express = require("express");
const crudRouter = require("../utils/crudRouter");
const Project = require("../models/Project");
const Service = require("../models/Service");
const Testimonial = require("../models/Testimonial");
const TeamMember = require("../models/TeamMember");
const BlogPost = require("../models/BlogPost");
const PageContent = require("../models/PageContent");
const WebsiteSetting = require("../models/WebsiteSetting");

const router = express.Router();

router.use("/projects", crudRouter(Project));
router.use("/services", crudRouter(Service));
router.use("/testimonials", crudRouter(Testimonial));
router.use("/team", crudRouter(TeamMember));
router.use("/blogs", crudRouter(BlogPost));
router.use("/pages", crudRouter(PageContent));
router.use("/settings", crudRouter(WebsiteSetting, { permission: "settings" }));

module.exports = router;
