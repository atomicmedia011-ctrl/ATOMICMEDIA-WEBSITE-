require("./config/env");
const app = require("./app");
const connectDB = require("./config/db");

const port = Number(process.env.PORT || 5000);

connectDB()
  .then(async () => {
    // Auto-seed if database is empty
    const Project = require("./models/Project");
    let projects = await Project.find({});
    if (projects.length === 0) {
      console.log("[INFO] No projects found in database. Auto-seeding Atomic Media data...");
      try {
        const rebrand = require("./seed/atomicRebrand");
        await rebrand();
        projects = await Project.find({});
        console.log("[INFO] Auto-seeding completed successfully.");
      } catch (seedErr) {
        console.error("Failed to auto-seed database:", seedErr);
      }
    }

    // Auto-boost project details pages with multiple photos and videos on startup
    const assetSlugs = [
      "real_estate_marketing_campaign", "restaurant_brand_transformation", "healthcare_lead_generation",
      "fashion_ecommerce_growth", "educational_institute_website", "corporate_rebranding_project",
      "local_business_digital_expansion", "startup_launch_campaign", "creator_growth_campaign",
      "product_photography_campaign", "saas_website_funnel", "finance_lead_campaign",
      "business_automation_dashboard", "education_content_campaign", "luxury_retail_campaign",
      "healthcare_website_redesign", "corporate_event_campaign"
    ];
    for (const [index, project] of projects.entries()) {
      if (!project.images || project.images.length <= 1) {
        const image1 = project.coverImage?.url || `/assets/projects/${assetSlugs[index % assetSlugs.length]}/home.webp`;
        const image2 = `/assets/projects/${assetSlugs[(index + 1) % assetSlugs.length]}/home.webp`;
        const image3 = `/assets/projects/${assetSlugs[(index + 2) % assetSlugs.length]}/home.webp`;
        const image4 = `/assets/projects/${assetSlugs[(index + 3) % assetSlugs.length]}/home.webp`;
        project.images = [
          { url: image1, type: "image", alt: `${project.title} Main` },
          { url: image2, type: "image", alt: `${project.title} Detail 1` },
          { url: image3, type: "image", alt: `${project.title} Detail 2` },
          { url: image4, type: "image", alt: `${project.title} Showcase` }
        ];
        if (!project.videos || project.videos.length === 0) {
          project.videos = [
            { url: "/assets/videos/about-hero.mp4", type: "video", alt: `${project.title} Video Overview` }
          ];
        }
        await project.save();
        console.log(`[INFO] Auto-populated extra photos and video to project: ${project.title}`);
      }
    }

    app.listen(port, () => {
      console.log(`CMS API running at http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error("Failed to start CMS API", error);
    process.exit(1);
  });
