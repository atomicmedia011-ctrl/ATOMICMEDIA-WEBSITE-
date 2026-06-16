require("dotenv").config();
const fs = require("fs");
const path = require("path");
const connectDB = require("../config/db");
const User = require("../models/User");
const WebsiteSetting = require("../models/WebsiteSetting");
const PageContent = require("../models/PageContent");
const Project = require("../models/Project");
const Service = require("../models/Service");
const Testimonial = require("../models/Testimonial");
const TeamMember = require("../models/TeamMember");
const MediaAsset = require("../models/MediaAsset");

const ROOT = path.join(__dirname, "..", "..", "..");
const PROJECT_ASSET_ROOT = path.join(ROOT, "lusion.co landing page(1)", "lusion.dev", "assets", "projects");

function titleFromSlug(slug) {
  return slug.split("_").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}

function projectImage(slug, name) {
  return {
    url: `/assets/projects/${slug}/${name}`,
    secureUrl: `/assets/projects/${slug}/${name}`,
    publicId: `projects/${slug}/${name}`,
    alt: titleFromSlug(slug),
    type: "image"
  };
}

async function seedExistingProjectAssets(userId) {
  if (!fs.existsSync(PROJECT_ASSET_ROOT)) return;
  const folders = fs.readdirSync(PROJECT_ASSET_ROOT, { withFileTypes: true }).filter((entry) => entry.isDirectory());
  for (const [index, folder] of folders.entries()) {
    const slug = folder.name;
    const homePath = path.join(PROJECT_ASSET_ROOT, slug, "home.webp");
    const depthPath = path.join(PROJECT_ASSET_ROOT, slug, "home_depth.webp");
    if (!fs.existsSync(homePath)) continue;

    const title = titleFromSlug(slug);
    const coverImage = projectImage(slug, "home.webp");
    const images = [coverImage];
    if (fs.existsSync(depthPath)) images.push(projectImage(slug, "home_depth.webp"));

    await MediaAsset.updateOne(
      { provider: "local", publicId: coverImage.publicId },
      {
        title: `${title} cover`,
        folder: `projects/${slug}`,
        type: "image",
        size: fs.statSync(homePath).size,
        url: coverImage.url,
        secureUrl: coverImage.secureUrl,
        publicId: coverImage.publicId,
        provider: "local",
        uploadedBy: userId
      },
      { upsert: true }
    );

    await Project.updateOne(
      { slug },
      {
        title,
        slug,
        excerpt: "Imported from the existing website assets.",
        categories: ["Portfolio"],
        projectType: "portfolio",
        eventType: "imported",
        mediaFolder: `projects/portfolio/${slug}`,
        featured: index < 4,
        enabled: true,
        order: index,
        coverImage,
        images
      },
      { upsert: true }
    );
  }
}

async function seed() {
  await connectDB();

  const email = process.env.ADMIN_EMAIL || "admin@atomicmedia.local";
  let user = await User.findOne({ email }).select("+passwordHash");
  if (!user) {
    user = new User({
      name: process.env.ADMIN_NAME || "Atomic Admin",
      email,
      role: "super_admin"
    });
    await user.setPassword(process.env.ADMIN_PASSWORD || "ChangeMe123!");
    await user.save();
  }

  await seedExistingProjectAssets(user.id);

  const serviceCount = await Service.countDocuments();
  if (!serviceCount) {
    await Service.insertMany([
      { title: "Creative Technology", slug: "creative-technology", summary: "Interactive digital experiences.", enabled: true, order: 0 },
      { title: "3D Web Experiences", slug: "3d-web-experiences", summary: "Realtime visual storytelling for the web.", enabled: true, order: 1 },
      { title: "Campaign Websites", slug: "campaign-websites", summary: "Launch-ready marketing websites.", enabled: true, order: 2 }
    ]);
  }

  const testimonialCount = await Testimonial.countDocuments();
  if (!testimonialCount) {
    await Testimonial.create({
      clientName: "Imported Client",
      designation: "Brand Partner",
      company: "Atomic Media",
      quote: "This placeholder is ready to replace with a real client testimonial.",
      rating: 5,
      enabled: true,
      order: 0
    });
  }

  const teamCount = await TeamMember.countDocuments();
  if (!teamCount) {
    await TeamMember.create({
      name: "Team Member",
      position: "Creative Lead",
      bio: "Replace this with the real team bio and upload a profile picture from the admin panel.",
      enabled: true,
      order: 0
    });
  }

  await WebsiteSetting.findOneAndUpdate(
    { key: "global" },
    {
      key: "global",
      companyName: "Atomic Media",
      footer: { copyright: `Atomic Media ${new Date().getFullYear()}` }
    },
    { upsert: true, new: true }
  );

  await PageContent.findOneAndUpdate(
    { page: "home" },
    {
      page: "home",
      title: "Homepage",
      sections: [
        {
          key: "hero",
          label: "Hero Section",
          enabled: true,
          order: 0,
          fields: [
            {
              key: "headline",
              label: "Main headline",
              selector: "[data-cms='home.hero.headline']",
              type: "text",
              value: "Atomic Media"
            },
            {
              key: "hero-video",
              label: "Hero video",
              selector: "video",
              type: "video",
              attr: "src",
              value: ""
            }
          ]
        }
      ]
    },
    { upsert: true, new: true }
  );

  console.log(`Seed complete. Admin: ${email}`);
  process.exit(0);
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
