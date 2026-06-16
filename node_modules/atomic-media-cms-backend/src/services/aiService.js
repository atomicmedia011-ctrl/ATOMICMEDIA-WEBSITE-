async function generateText(prompt) {
  if (!process.env.OPENAI_API_KEY) return null;
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a concise senior strategist for Atomic Media. Return practical, polished agency output." },
        { role: "user", content: prompt }
      ],
      temperature: 0.7
    })
  });
  if (!response.ok) return null;
  const data = await response.json();
  return data.choices?.[0]?.message?.content || null;
}

function fallbackContentIdeas(input) {
  const niche = input.niche || "business";
  const goal = input.goal || "generate leads";
  const tone = input.tone || "premium";
  return {
    instagram: [
      `${tone} before/after transformation post for ${niche}`,
      `Founder story reel explaining why ${niche} brands need stronger digital presence`,
      `Carousel: 5 mistakes stopping ${niche} businesses from ${goal}`
    ],
    website: [
      `Landing page section: proof-driven results for ${niche}`,
      `Case study page outline focused on ${goal}`,
      `FAQ block answering buying objections`
    ],
    ads: [
      `Problem-solution ad creative for ${niche}`,
      `Retargeting ad with testimonial proof`,
      `Lead magnet campaign around ${goal}`
    ],
    reels: [
      `30-second process reel: idea to launch`,
      `Myth-busting reel for ${niche} marketing`,
      `Client result breakdown reel`
    ]
  };
}

function fallbackSeo(input) {
  const topic = input.topic || input.service || "digital marketing agency";
  return {
    keywords: [
      topic,
      `${topic} services`,
      `best ${topic}`,
      `${topic} for business growth`,
      `${topic} agency`
    ],
    metaTitle: `${topic} | Atomic Media`,
    metaDescription: `Atomic Media provides premium ${topic} solutions built for performance, visibility, and measurable growth.`,
    outline: [
      "Introduction and user intent",
      "Core benefits",
      "Process and deliverables",
      "Proof, case studies, and FAQs",
      "Strong consultation CTA"
    ]
  };
}

function fallbackProposal({ lead, service, projectType }) {
  const clientName = lead?.name || "Client";
  const serviceTitle = service?.title || "Digital Growth Solution";
  return {
    projectSummary: `${clientName} is looking for ${projectType || serviceTitle}. Atomic Media will create a focused digital solution designed for brand trust, lead generation, and long-term growth.`,
    scopeOfWork: [
      "Discovery, strategy, and project planning",
      `${serviceTitle} execution`,
      "Creative direction, content, and conversion-focused UX",
      "Testing, launch support, and performance review"
    ],
    timeline: "2-6 weeks depending on final scope and approvals.",
    pricing: "Pricing to be finalized after discovery. Recommended structure: 50% advance, 50% before launch.",
    terms: "Timeline begins after content, brand assets, and advance payment are received. Revisions are included as defined in the final scope.",
    cta: "Approve this proposal to begin strategy and production with Atomic Media."
  };
}

function scoreLead(input) {
  const text = `${input.budget || ""} ${input.timeline || ""} ${input.serviceNeed || ""}`.toLowerCase();
  if (/(urgent|asap|this week|high|premium|ready|immediate|lakh|enterprise)/.test(text)) return "hot";
  if (/(month|soon|medium|website|ads|branding|marketing)/.test(text)) return "warm";
  return "cold";
}

module.exports = { generateText, fallbackContentIdeas, fallbackSeo, fallbackProposal, scoreLead };
