const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const SITE_ROOT = path.join(ROOT, "lusion.co landing page(1)", "lusion.co");
const TEAM_JSON = path.join(SITE_ROOT, "assets", "team", "team.json");
const LOGO_DIR = path.join(SITE_ROOT, "assets", "images", "logo");

const seoDescription = "Atomic Media is a full-service digital marketing agency providing branding, website development, performance marketing, social media management, content creation, and business growth solutions.";
const homeTitle = "Atomic Media | Digital Marketing & Creative Agency";
const aboutTitle = "Atomic Media | About Our Creative Growth Agency";
const projectsTitle = "Atomic Media | Portfolio & Case Studies";
const domain = "https://atomicmedia.in";
const email = "hello@atomicmedia.in";
const businessEmail = "growth@atomicmedia.in";

const logoSvg = `<a id="header-logo" aria-label="Go to home page" href="/"> <svg xmlns="http://www.w3.org/2000/svg" width="154" height="24" fill="none" viewBox="0 0 154 24"><g fill="currentColor" style="mix-blend-mode:exclusion"><text x="0" y="18" font-family="Arial, Helvetica, sans-serif" font-size="16" font-weight="800" letter-spacing="1.2">ATOMIC MEDIA</text></g></svg> </a>`;
const aboutWordmark = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 260 38.502"><text x="0" y="30" font-family="Arial, Helvetica, sans-serif" font-size="28" font-weight="800" letter-spacing="1.8" fill="#fff">ATOMIC MEDIA</text></svg>`;

const projects = [
  ["Oryzo AI", "Real Estate Marketing Campaign", "real estate • lead generation • ads • landing page"],
  ["Of The Oak", "Restaurant Brand Transformation", "branding • reels • social media • local growth"],
  ["Devin AI", "Healthcare Lead Generation", "google ads • crm • conversion optimization"],
  ["Porsche: Dream Machine", "Fashion E-commerce Growth", "e-commerce • creative ads • revenue growth"],
  ["Synthetic Human", "Educational Institute Website", "website • admissions • seo • automation"],
  ["Meta: Spatial Fusion", "Corporate Rebranding Project", "brand strategy • identity • website"],
  ["Spaace - NFT Marketplace", "Local Business Digital Expansion", "local seo • social media • lead systems"],
  ["DDD 2024", "Startup Launch Campaign", "launch strategy • content • performance marketing"],
  ["Choo Choo World", "Creator Growth Campaign", "reels • content planning • audience growth"],
  ["Soda Experience", "Product Photography Campaign", "commercial shoot • product content • ads"],
  ["Zero Tech", "SaaS Website Funnel", "landing page • automation • analytics"],
  ["Worldcoin Globe", "Finance Lead Campaign", "paid media • landing page • reporting"],
  ["Lusion Labs", "Business Automation Dashboard", "crm • dashboards • appointment systems"],
  ["My Little Storybook", "Education Content Campaign", "content production • seo • social growth"],
  ["Infinite Passerella", "Luxury Retail Campaign", "branding • reels • performance ads"],
  ["The Turn Of The Screw", "Healthcare Website Redesign", "website • seo • patient leads"],
  ["Max Mara: Bearing Gifts", "Corporate Event Campaign", "event content • video • lead generation"]
];

const projectSlugMap = [
  ["oryzo_ai", "real_estate_marketing_campaign"],
  ["of_the_oak", "restaurant_brand_transformation"],
  ["devin_ai", "healthcare_lead_generation"],
  ["porsche_dream_machine", "fashion_ecommerce_growth"],
  ["synthetic_human", "educational_institute_website"],
  ["spatial_fusion", "corporate_rebranding_project"],
  ["spaace", "local_business_digital_expansion"],
  ["ddd_2024", "startup_launch_campaign"],
  ["choo_choo_world", "creator_growth_campaign"],
  ["soda_experience", "product_photography_campaign"],
  ["zero_tech", "saas_website_funnel"],
  ["worldcoin", "finance_lead_campaign"],
  ["lusion_labs", "business_automation_dashboard"],
  ["my_little_story_book", "education_content_campaign"],
  ["infinite_passerella", "luxury_retail_campaign"],
  ["the_turn_of_the_screw", "healthcare_website_redesign"],
  ["maxmara_bearings_gifts", "corporate_event_campaign"]
];

const atomicLogos = [
  ["@logo--atomic-realty.svg", "REALTY"],
  ["@logo--atomic-food.svg", "FOOD"],
  ["@logo--atomic-health.svg", "HEALTH"],
  ["@logo--atomic-fashion.svg", "FASHION"],
  ["@logo--atomic-edu.svg", "EDU"],
  ["@logo--atomic-startup.svg", "STARTUP"],
  ["@logo--atomic-local.svg", "LOCAL"],
  ["@logo--atomic-growth.svg", "GROWTH"]
];

function ensureAtomicLogos() {
  fs.mkdirSync(LOGO_DIR, { recursive: true });
  for (const [file, label] of atomicLogos) {
    fs.writeFileSync(path.join(LOGO_DIR, file), `<svg xmlns="http://www.w3.org/2000/svg" width="220" height="64" viewBox="0 0 220 64" fill="none"><rect width="220" height="64" rx="8" fill="none"/><text x="110" y="38" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="20" font-weight="800" letter-spacing="2" fill="currentColor">ATOMIC ${label}</text></svg>`);
  }
}

function copyProjectAssets() {
  for (const root of [
    path.join(ROOT, "lusion.co landing page(1)", "lusion.dev", "assets", "projects"),
    path.join(ROOT, "lusion.co landing page(1)", "lusion.co", "assets", "projects")
  ]) {
    if (!fs.existsSync(root)) continue;
    for (const [oldSlug, newSlug] of projectSlugMap) {
      const source = path.join(root, oldSlug);
      const target = path.join(root, newSlug);
      if (fs.existsSync(source) && !fs.existsSync(target)) {
        fs.cpSync(source, target, { recursive: true });
      }
    }
  }
}

function replaceBetween(html, id, value) {
  return html.replace(new RegExp(`(<[^>]+id=["']${id}["'][^>]*>)([\\s\\S]*?)(</[^>]+>)`), `$1${value}$3`);
}

function replaceMeta(html, page) {
  const title = page === "home" ? homeTitle : page === "about" ? aboutTitle : projectsTitle;
  const url = page === "home" ? `${domain}/` : `${domain}/${page}/`;
  return html
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${title}</title>`)
    .replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${seoDescription}">`)
    .replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${seoDescription}">`)
    .replace(/<meta property="og:image:alt" content="[^"]*">/, `<meta property="og:image:alt" content="${title}">`)
    .replace(/<meta property="og:image" content="[^"]*">/, `<meta property="og:image" content="${domain}/assets/meta/social_sharing.jpg">`)
    .replace(/<meta property="og:site_name" content="[^"]*">/, `<meta property="og:site_name" content="ATOMIC MEDIA">`)
    .replace(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${title}">`)
    .replace(/<meta property="og:url" content="[^"]*">/, `<meta property="og:url" content="${url}">`);
}

function replaceShared(html) {
  let logoIndex = 0;
  html = html.replace(/<a id="header-logo"[\s\S]*?<\/a>/, logoSvg);
  html = html.replace(/src="\/assets\/images\/logo\/@logo--[^"]+\.svg"/g, () => {
    const logo = atomicLogos[logoIndex++ % atomicLogos.length][0];
    return `src="/assets/images/logo/${logo}"`;
  });
  html = html.replace(/mailto:hello@lusion\.co/g, `mailto:${email}`);
  html = html.replace(/mailto:business@lusion\.co/g, `mailto:${businessEmail}`);
  html = html.replace(/hello@lusion\.co/g, email);
  html = html.replace(/business@lusion\.co/g, businessEmail);
  html = html.replace(/https:\/\/labs\.lusion\.co\/?/g, "/projects");
  html = html.replace(/https:\/\/twitter\.com\/lusionltd\/?/g, "https://x.com/atomicmedia");
  html = html.replace(/https:\/\/www\.instagram\.com\/lusionltd\/?/g, "https://www.instagram.com/atomicmedia");
  html = html.replace(/https:\/\/www\.linkedin\.com\/company\/lusionltd\/?/g, "https://www.linkedin.com/company/atomic-media");
  html = html.replace(/<div id="header-menu-labs-text">Labs<\/div>/g, `<div id="header-menu-labs-text">Work</div>`);
  html = html.replace(/<div id="header-menu-labs-text-clone">Labs<\/div>/g, `<div id="header-menu-labs-text-clone">Work</div>`);
  html = html.replace(/<div id="footer-bottom-copyright">[^<]*<\/div>/g, `<div id="footer-bottom-copyright">©2026 ATOMIC MEDIA</div>`);
  html = html.replace(/<a id="footer-bottom-labs"[^>]*>[\s\S]*?<\/a>/g, `<a id="footer-bottom-labs" href="/projects"> Case Studies</a>`);
  html = html.replace(/<div id="footer-bottom-tagline">[\s\S]*?<\/div>/g, `<div id="footer-bottom-tagline">Transforming Brands Into Digital Powerhouses</div>`);
  html = html.replace(/<div class="footer-address-line">Suite 2<\/div>\s*<div class="footer-address-line">9 Marsh Street<\/div>\s*<div class="footer-address-line">Bristol, BS1 4AA<\/div>\s*<div class="footer-address-line">United Kingdom<\/div>/g, `<div class="footer-address-line">ATOMIC MEDIA</div>
                                <div class="footer-address-line">Digital Marketing & Creative Growth Agency</div>
                                <div class="footer-address-line">Serving brands globally</div>
                                <div class="footer-address-line">Book a free consultation</div>`);
  return html;
}

function replaceProjects(html) {
  for (const [oldName, newName, tag] of projects) {
    html = html.replace(new RegExp(oldName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"), newName);
  }
  for (const [oldSlug, newSlug] of projectSlugMap) {
    html = html.replace(new RegExp(`/projects/${oldSlug}`, "g"), `/projects/${newSlug}`);
    html = html.replace(new RegExp(`data-id="${oldSlug}"`, "g"), `data-id="${newSlug}"`);
  }
  let index = 0;
  html = html.replace(/<div class="project-item-line-1">[\s\S]*?<\/div>/g, () => {
    const tag = projects[index % projects.length][2];
    index += 1;
    return `<div class="project-item-line-1">${tag}</div>`;
  });
  return html;
}

function replaceHome(html) {
  html = replaceMeta(html, "home");
  html = replaceBetween(html, "home-hero-title", "Grow Faster With Atomic Media");
  html = replaceBetween(html, "home-reel-desc", "We help ambitious businesses dominate online through strategic marketing, premium branding, powerful websites, and high-converting advertising campaigns.");
  html = replaceBetween(html, "home-reel-cta-text", "Book Free Consultation");
  html = replaceBetween(html, "home-featured-disclaimer", "A selection of digital marketing, branding, website, content, and performance campaigns built for ambitious businesses.");
  html = replaceProjects(html);
  return replaceShared(html);
}

function replaceAbout(html) {
  html = replaceMeta(html, "about");
  html = html.replace(/(<div id="about-who-title-left-2">)\s*<svg[\s\S]*?<\/svg>\s*(<\/div>)/, `$1 ${aboutWordmark} $2`);
  html = html.replace(/<div id="about-who-title-left-3">[\s\S]*?<\/div>/, `<div id="about-who-title-left-3">A PREMIUM</div>`);
  html = html.replace(/<div id="about-who-title-left-4">[\s\S]*?<\/div>/, `<div id="about-who-title-left-4"><span>GROWTH&nbsp;</span><span>AGENCY</span></div>`);
  html = html.replace(/<div class="about-who-title-right-text">CRAFTING UNIQUE<\/div>\s*<div class="about-who-title-right-text">DIGITAL EXPERIENCES<\/div>/, `<div class="about-who-title-right-text">TRANSFORMING BRANDS</div>
                                    <div class="about-who-title-right-text">INTO DIGITAL POWERHOUSES</div>`);
  html = html.replace(/<div id="about-who-desc-top">[\s\S]*?<\/div>/, `<div id="about-who-desc-top"><span class="is-italic">A focused team</span><span>of</span><br class="is-desktop"><span>strategists, designers,</span><br class="is-desktop"><span>marketers, and creators</span></div>`);
  html = html.replace(/<div id="about-who-desc-bottom">[\s\S]*?<\/div>/, `<div id="about-who-desc-bottom"><span>working together to</span><br class="is-mobile"><br class="is-desktop"><span>build brands, websites,</span><br class="is-desktop"><span>campaigns, and growth</span><br class="is-mobile"><span>systems.</span></div>`);
  html = replaceBetween(html, "about-who-team-name-text", "Aarav Mehta");
  html = replaceBetween(html, "about-who-team-desc-text", "Atomic Media combines creativity, technology, and data-driven strategy to help brands reach their full potential. From startups to established businesses, we create digital experiences that generate measurable growth.");
  html = replaceBetween(html, "about-capability-subheader-text", "Full-service growth expertise across strategy, creative, performance marketing, websites, content, SEO, and automation.");
  const capabilityReplacements = [
    ["Strategy", ["Brand Strategy", "Growth Planning", "Market Research", "Creative Direction", "Digital Roadmaps"]],
    ["Creative", ["Logo Design", "Brand Identity", "Reels Production", "Commercial Shoots", "Motion Graphics"]],
    ["Tech", ["Website Development", "Landing Pages", "E-commerce Stores", "CRM Integration", "Custom Dashboards"]],
    ["Performance", ["Meta Ads", "Google Ads", "Lead Generation", "Retargeting Campaigns", "Conversion Optimization"]]
  ];
  let cardIndex = 0;
  html = html.replace(/<p class="about-capability-card-header-text">[\s\S]*?<\/p>/g, () => `<p class="about-capability-card-header-text">${capabilityReplacements[Math.floor(cardIndex++ / 2) % capabilityReplacements.length][0]}</p>`);
  let listIndex = 0;
  html = html.replace(/<ul class="about-capability-list">[\s\S]*?<\/ul>/g, () => {
    const items = capabilityReplacements[listIndex++ % capabilityReplacements.length][1];
    return `<ul class="about-capability-list">
                                            ${items.map((item) => `<li class="about-capability-list-item">${item}</li>`).join("\n                                            ")}
                                        </ul>`;
  });
  html = html.replace(/Porsche Newsroom - Driven By Dream/g, "100+ Projects Delivered");
  html = html.replace(/Wallpaper - Driven by Dreams/g, "50+ Happy Clients");
  html = html.replace(/Awwwards Conf/g, "Growth Strategy Sessions");
  html = html.replace(/Awwwards/g, "Growth Metrics");
  html = html.replace(/Awwwards - Site of the Day/g, "5M+ Marketing Reach Generated");
  html = html.replace(/FWA - Site of the Day/g, "95% Client Satisfaction Rate");
  html = html.replace(/href="https:\/\/newsroom\.porsche\.com[^"]*"/g, `href="/projects"`);
  html = html.replace(/href="https:\/\/www\.wallpaper\.com[^"]*"/g, `href="/projects"`);
  html = html.replace(/href="https:\/\/www\.awwwards\.com[^"]*"/g, `href="/projects"`);
  html = html.replace(/href="https:\/\/thefwa\.com[^"]*"/g, `href="/projects"`);
  return replaceShared(html);
}

function replaceProjectPage(html) {
  html = replaceMeta(html, "projects");
  html = replaceProjects(html);
  return replaceShared(html);
}

function updateFile(filePath, transformer) {
  if (!fs.existsSync(filePath)) return;
  const original = fs.readFileSync(filePath, "utf8");
  const updated = transformer(original);
  fs.writeFileSync(filePath, updated);
  console.log(`Updated ${path.relative(ROOT, filePath)}`);
}

ensureAtomicLogos();
copyProjectAssets();
updateFile(path.join(SITE_ROOT, "index.html"), replaceHome);
updateFile(path.join(SITE_ROOT, "about.html"), replaceAbout);
updateFile(path.join(SITE_ROOT, "about", "index.html"), replaceAbout);
updateFile(path.join(SITE_ROOT, "projects.html"), replaceProjectPage);
updateFile(path.join(SITE_ROOT, "projects", "index.html"), replaceProjectPage);

fs.writeFileSync(TEAM_JSON, JSON.stringify([
  { id: "edan", name: "Aarav Mehta", role: "Founder &<br> CEO" },
  { id: "ffi", name: "Ishita Rao", role: "Creative Director" },
  { id: "marcolp", name: "Rohan Kapoor", role: "Marketing Strategist" },
  { id: "paul", name: "Kabir Singh", role: "Performance Marketing Specialist" },
  { id: "andrii", name: "Neha Verma", role: "UI/UX Designer" },
  { id: "luana", name: "Maya Nair", role: "Video Editor" },
  { id: "sunny", name: "Dev Sharma", role: "Web Developer" }
], null, 2));
console.log(`Updated ${path.relative(ROOT, TEAM_JSON)}`);

updateFile(path.join(SITE_ROOT, "assets", "meta", "site.webmanifest"), (json) => json
  .replace(/"name":\s*"[^"]*"/, `"name": "ATOMIC MEDIA"`)
  .replace(/"short_name":\s*"[^"]*"/, `"short_name": "ATOMIC"`)
);
updateFile(path.join(SITE_ROOT, "sitemap-index.xml"), (xml) => xml
  .replace(/https:\/\/lusion\.co/g, domain)
);
updateFile(path.join(SITE_ROOT, "_astro", "hoisted.CJiXW_YI.js"), (js) => js
  .replace(/Created by Lusion: https:\/\/lusion\.co\//g, "Created for Atomic Media: https://atomicmedia.in/")
  .replace(/MAILCHIMP_URL = "https:\/\/lusion\.us20\.list-manage\.com[^"]*"/g, `MAILCHIMP_URL = ""`)
);
