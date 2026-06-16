const path = require("path");

require("dotenv").config({ path: path.join(__dirname, "..", "backend", ".env") });

const connectDB = require("../backend/src/config/db");
const Project = require("../backend/src/models/Project");

const folderMap = {
  "real-estate-marketing-campaign": "real_estate_marketing_campaign",
  "restaurant-brand-transformation": "restaurant_brand_transformation",
  "healthcare-lead-generation": "healthcare_lead_generation",
  "fashion-ecommerce-growth": "fashion_ecommerce_growth",
  "educational-institute-website": "educational_institute_website",
  "startup-launch-campaign": "startup_launch_campaign",
  "local-business-digital-expansion": "local_business_digital_expansion",
  "creator-growth-campaign": "creator_growth_campaign",
  "saas-website-funnel": "saas_website_funnel",
  "corporate-rebranding-project": "corporate_rebranding_project",
  "finance-lead-campaign": "finance_lead_campaign",
  "business-automation-dashboard": "business_automation_dashboard",
  "education-content-campaign": "education_content_campaign",
  "product-photography-campaign": "product_photography_campaign",
  "luxury-retail-campaign": "luxury_retail_campaign",
  "healthcare-website-redesign": "healthcare_website_redesign",
  "corporate-event-campaign": "corporate_event_campaign"
};

async function main() {
  await connectDB();
  for (const [slug, folder] of Object.entries(folderMap)) {
    await Project.updateOne({ slug }, { mediaFolder: `projects/${folder}` });
  }
  console.log("Synced project media folders to visible project folder IDs.");
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
