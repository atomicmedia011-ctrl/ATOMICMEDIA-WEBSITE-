const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", "..", ".env") });
const connectDB = require("../config/db");
const Project = require("../models/Project");
const Service = require("../models/Service");
const Testimonial = require("../models/Testimonial");
const TeamMember = require("../models/TeamMember");
const WebsiteSetting = require("../models/WebsiteSetting");
const PageContent = require("../models/PageContent");

const projectData = [
  ["real-estate-marketing-campaign", "Real Estate Marketing Campaign", "Helping a property consultant generate qualified buyer leads through landing pages, Meta ads, and retargeting.", "Low-quality inquiries and weak digital visibility.", "Built a conversion-focused campaign with premium visuals, lead forms, WhatsApp routing, and retargeting.", "3.8x more qualified leads within 45 days."],
  ["restaurant-brand-transformation", "Restaurant Brand Transformation", "Refreshing a local restaurant brand with identity, reels, menu content, and local awareness campaigns.", "The restaurant had strong food but inconsistent branding and low social engagement.", "Created a new visual system, content calendar, reels, and location-based promotions.", "Higher footfall, stronger Instagram engagement, and a sharper brand image."],
  ["healthcare-lead-generation", "Healthcare Lead Generation", "A lead-generation system for a healthcare clinic using Google Ads, local SEO, and appointment automation.", "The clinic relied on referrals and had no predictable patient acquisition channel.", "Launched search ads, optimized service pages, and connected leads into a simple CRM.", "Consistent appointment inquiries with transparent reporting."],
  ["fashion-ecommerce-growth", "Fashion E-commerce Growth", "Scaling an online fashion store with creative ads, product photography, and conversion optimization.", "High traffic but low purchase conversion and inconsistent ad performance.", "Rebuilt campaign creatives, optimized product pages, and launched retargeting.", "Improved revenue, lower acquisition cost, and better repeat customer flow."],
  ["educational-institute-website", "Educational Institute Website", "A premium website and admissions funnel for an educational institute.", "Outdated website experience and scattered admissions inquiries.", "Designed a modern site, course pages, SEO structure, and lead management flow.", "Cleaner admissions pipeline and stronger parent/student trust."],
  ["corporate-rebranding-project", "Corporate Rebranding Project", "A complete identity refresh for a growing corporate services company.", "The brand looked dated and did not reflect the company's premium positioning.", "Created brand strategy, visual identity, guidelines, website direction, and launch assets.", "A more credible digital presence for sales and partnerships."],
  ["local-business-digital-expansion", "Local Business Digital Expansion", "Helping a local business move from word-of-mouth to measurable online growth.", "No structured social media, weak Google visibility, and inconsistent inquiries.", "Implemented local SEO, social media management, landing pages, and lead tracking.", "More discoverability and a repeatable lead generation system."],
  ["startup-launch-campaign", "Startup Launch Campaign", "A launch campaign for a startup entering a competitive digital market.", "The startup needed awareness, trust, and early customer acquisition fast.", "Built launch messaging, website funnel, ad creatives, and campaign analytics.", "A polished launch presence with measurable traction."],
  ["creator-growth-campaign", "Creator Growth Campaign", "A content and reels growth system for a creator-led business.", "Content output was inconsistent and not connected to audience growth goals.", "Built a reels calendar, hooks library, editing system, and monthly analytics review.", "More consistent reach, stronger profile positioning, and better inbound inquiries."],
  ["product-photography-campaign", "Product Photography Campaign", "A commercial product content system for ad creatives and social launches.", "The brand lacked premium visual assets for ads and marketplace listings.", "Planned and produced product photography, short videos, and motion-led edits.", "Sharper product presentation and stronger creative performance."],
  ["saas-website-funnel", "SaaS Website Funnel", "A conversion-focused landing page and automation funnel for a SaaS product.", "Visitors were not understanding the product value quickly enough.", "Reworked messaging, page flow, lead magnets, and CRM routing.", "More demo inquiries and clearer customer journey tracking."],
  ["finance-lead-campaign", "Finance Lead Campaign", "A compliant lead-generation campaign for a financial services consultant.", "The business needed qualified leads without damaging trust or credibility.", "Built educational ad creatives, landing pages, and segmented follow-up flows.", "Higher quality consultations and more transparent campaign reporting."],
  ["business-automation-dashboard", "Business Automation Dashboard", "A custom dashboard and CRM workflow for a service business.", "Leads were spread across calls, forms, messages, and spreadsheets.", "Centralized lead capture, appointment booking, status tracking, and reporting.", "Faster follow-up and clearer team accountability."],
  ["education-content-campaign", "Education Content Campaign", "A long-term content and SEO campaign for an education brand.", "The brand needed authority-building content and better organic discovery.", "Created blog topics, social content, SEO pages, and campaign reporting.", "Improved visibility and stronger trust with prospective students."],
  ["luxury-retail-campaign", "Luxury Retail Campaign", "A premium content and performance campaign for a retail brand.", "The brand had beautiful products but inconsistent digital storytelling.", "Built campaign visuals, reels, ad sets, and landing page messaging.", "Better brand perception and stronger retargeting results."],
  ["healthcare-website-redesign", "Healthcare Website Redesign", "A trust-focused website refresh for a healthcare provider.", "The previous site felt outdated and did not support patient decisions.", "Created clearer service pages, trust signals, local SEO, and booking CTAs.", "Better website experience and easier patient inquiry flow."],
  ["corporate-event-campaign", "Corporate Event Campaign", "A full digital campaign for a corporate event and lead capture.", "The event needed stronger awareness and post-event lead management.", "Produced event content, ads, landing pages, and follow-up automation.", "More registrations and a cleaner post-event sales pipeline."]
];

const assetSlugs = [
  "real_estate_marketing_campaign",
  "restaurant_brand_transformation",
  "healthcare_lead_generation",
  "fashion_ecommerce_growth",
  "educational_institute_website",
  "corporate_rebranding_project",
  "local_business_digital_expansion",
  "startup_launch_campaign",
  "creator_growth_campaign",
  "product_photography_campaign",
  "saas_website_funnel",
  "finance_lead_campaign",
  "business_automation_dashboard",
  "education_content_campaign",
  "luxury_retail_campaign",
  "healthcare_website_redesign",
  "corporate_event_campaign"
];

const services = [
  ["website-design-development", "Website Design & Development", "Premium business websites, corporate websites, portfolios, landing pages, e-commerce stores, and custom web applications."],
  ["performance-marketing", "Performance Marketing", "Meta Ads, Google Ads, lead generation campaigns, conversion optimization, and retargeting built for measurable revenue."],
  ["social-media-management", "Social Media Management", "Instagram growth, Facebook management, LinkedIn marketing, content planning, and community building."],
  ["branding-identity", "Branding & Identity", "Logo design, brand strategy, brand guidelines, and corporate identity systems that make brands memorable."],
  ["content-production", "Content Production", "Reels production, commercial shoots, product photography, video editing, and motion graphics."],
  ["seo-services", "SEO Services", "Technical SEO, local SEO, keyword research, and content optimization for long-term organic growth."],
  ["business-automation", "Business Automation", "CRM integration, lead management systems, appointment booking systems, and custom dashboards."]
];

const testimonials = [
  ["Ritika Sharma", "Founder", "UrbanNest Realty", "Atomic Media helped us move from random inquiries to serious property leads. Their campaign strategy and landing page made a visible difference in our sales pipeline."],
  ["Arjun Malhotra", "Restaurant Owner", "The Copper Table", "Our brand finally looks premium online. The reels, menu visuals, and local campaigns brought more people into the restaurant."],
  ["Dr. Meera Iyer", "Clinic Director", "Aarogya Care", "The lead system was simple, professional, and transparent. We now understand where patient inquiries come from and how campaigns are performing."],
  ["Naina Kapoor", "E-commerce Founder", "ModeHaus", "Atomic Media improved our ad creatives and product pages. Revenue became more consistent and our brand started looking much more polished."],
  ["Karan Bedi", "Startup Founder", "Flowdesk", "They understood our launch goals quickly and built a digital presence that made us look credible from day one."]
];

const team = [
  ["Aarav Mehta", "Founder & CEO", "Leads Atomic Media's growth vision, client strategy, and business partnerships."],
  ["Ishita Rao", "Creative Director", "Shapes brand identity, campaign concepts, visual systems, and premium creative standards."],
  ["Rohan Kapoor", "Marketing Strategist", "Builds research-backed growth plans, funnels, and content strategies."],
  ["Kabir Singh", "Performance Marketing Specialist", "Manages Meta Ads, Google Ads, retargeting, analytics, and conversion optimization."],
  ["Neha Verma", "UI/UX Designer", "Designs high-converting websites, landing pages, and digital product experiences."],
  ["Maya Nair", "Video Editor", "Creates reels, commercial edits, motion graphics, and campaign videos."],
  ["Dev Sharma", "Web Developer", "Builds websites, automations, dashboards, and technical integrations."],
  ["Anika Sen", "Content Manager", "Plans content calendars, captions, social campaigns, and brand communication."]
];

async function rebrand() {
  await connectDB();

  await Project.deleteMany({});
  for (const [index, item] of projectData.entries()) {
    const [slug, title, excerpt, challenge, solution, results] = item;
    const projectFolder = assetSlugs[index] || assetSlugs[0];
    const image1 = `/assets/projects/${projectFolder}/home.webp`;
    const image2 = `/assets/projects/${assetSlugs[(index + 1) % assetSlugs.length]}/home.webp`;
    const image3 = `/assets/projects/${assetSlugs[(index + 2) % assetSlugs.length]}/home.webp`;
    const image4 = `/assets/projects/${assetSlugs[(index + 3) % assetSlugs.length]}/home.webp`;

    await Project.create({
      slug,
      title,
      excerpt,
      body: `Challenge: ${challenge}\n\nSolution: ${solution}\n\nResults: ${results}`,
      client: "Atomic Media Demo Client",
      year: "2026",
      projectType: "digital-marketing",
      eventType: "case-study",
      mediaFolder: `projects/case-studies/${slug}`,
      categories: ["Case Study", "Marketing", "Growth"],
      featured: index < 4,
      enabled: true,
      order: index,
      coverImage: { url: image1, type: "image", alt: `${title} Cover` },
      images: [
        { url: image1, type: "image", alt: `${title} Main` },
        { url: image2, type: "image", alt: `${title} Detail 1` },
        { url: image3, type: "image", alt: `${title} Detail 2` },
        { url: image4, type: "image", alt: `${title} Showcase` }
      ],
      videos: [
        { url: "/assets/videos/about-hero.mp4", type: "video", alt: `${title} Video Overview` }
      ],
      detailSections: [{ challenge }, { solution }, { results }],
      seo: {
        metaTitle: `${title} | Atomic Media Case Study`,
        metaDescription: excerpt
      }
    });
  }

  await Service.deleteMany({});
  for (const [index, [slug, title, summary]] of services.entries()) {
    await Service.create({ slug, title, summary, body: summary, enabled: true, order: index });
  }

  await Testimonial.deleteMany({});
  for (const [index, [clientName, designation, company, quote]] of testimonials.entries()) {
    await Testimonial.create({ clientName, designation, company, quote, rating: 5, enabled: true, order: index });
  }

  await TeamMember.deleteMany({});
  for (const [index, [name, position, bio]] of team.entries()) {
    await TeamMember.create({ name, position, bio, enabled: true, order: index });
  }

  await WebsiteSetting.findOneAndUpdate(
    { key: "global" },
    {
      key: "global",
      companyName: "ATOMIC MEDIA",
      contact: {
        email: "hello@atomicmedia.in",
        phone: "",
        address: "Digital Marketing & Creative Growth Agency serving brands globally"
      },
      socialLinks: {
        instagram: "https://www.instagram.com/atomicmedia",
        linkedin: "https://www.linkedin.com/company/atomic-media",
        x: "https://x.com/atomicmedia",
        youtube: ""
      },
      footer: {
        headline: "Let's Build Something Extraordinary",
        body: "A modern digital marketing and creative agency helping businesses achieve measurable growth through branding, websites, advertising, and content creation.",
        copyright: "©2026 ATOMIC MEDIA",
        links: ["Home", "About", "Services", "Portfolio", "Case Studies", "Blog", "Contact"]
      },
      seo: {
        metaTitle: "Atomic Media | Digital Marketing & Creative Agency",
        metaDescription: "Atomic Media is a full-service digital marketing agency providing branding, website development, performance marketing, social media management, content creation, and business growth solutions."
      }
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
            { key: "headline", label: "Headline", selector: "#home-hero-title", type: "text", value: "Grow Faster With Atomic Media" },
            { key: "subheadline", label: "Subheadline", selector: "#home-reel-desc", type: "text", value: "We help ambitious businesses dominate online through strategic marketing, premium branding, powerful websites, and high-converting advertising campaigns." },
            { key: "cta", label: "Primary CTA", selector: "#home-reel-cta-text", type: "text", value: "Book Free Consultation" }
          ]
        }
      ],
      seo: {
        metaTitle: "Atomic Media | Digital Marketing & Creative Agency",
        metaDescription: "Atomic Media is a full-service digital marketing agency providing branding, website development, performance marketing, social media management, content creation, and business growth solutions."
      }
    },
    { upsert: true, new: true }
  );

  console.log("Atomic Media CMS data rebrand complete");
}

module.exports = rebrand;

if (require.main === module) {
  rebrand().then(() => process.exit(0)).catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

