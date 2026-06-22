(async function () {
  const root = document.querySelector("[data-project-detail]");
  if (!root) return;

  const cardId = root.dataset.projectId || location.pathname.split("/").filter(Boolean).pop();
  const normalize = (value) => String(value || "").toLowerCase().replace(/[_\s]+/g, "-");
  const assetUrl = (url) => {
    if (!url) return "";
    if (/^https?:\/\//.test(url)) return url;
    return url;
  };

  function mediaItem(asset, index) {
    const url = assetUrl(asset?.url);
    if (!url) return "";
    const alt = asset?.alt || asset?.title || `Project media ${index + 1}`;
    if (asset.type === "video" || /\.(mp4|webm|mov)$/i.test(url)) {
      return `<article class="media-card media-card-video"><video src="${url}" controls playsinline preload="metadata"></video><span>${alt}</span></article>`;
    }
    return `<article class="media-card"><img src="${url}" alt="${alt}"><span>${alt}</span></article>`;
  }

  function render(project) {
    const cover = project.coverImage?.url || project.images?.[0]?.url || "";
    const images = Array.isArray(project.images) ? project.images : [];
    const videos = [...(project.videos || []), ...(project.reels || [])];
    const media = [...images, ...videos].filter((asset, index, list) => asset?.url && list.findIndex((item) => item?.url === asset.url) === index);

    document.title = `${project.title} | Atomic Media`;
    root.innerHTML = `
      <header class="project-header">
        <a href="/" class="brand">ATOMIC MEDIA<span class="atomic-dot">.</span></a>
        <nav>
          <a href="/projects">All Projects</a>
          <a href="mailto:info@atomicmedia.in">Let's Talk</a>
        </nav>
      </header>
      <main>
        <section class="hero">
          <div>
            <p class="eyebrow">${(project.categories || []).join(" / ") || project.projectType || "Project"}</p>
            <h1>${project.title}</h1>
            <p class="desc">${project.excerpt || "Project media and details are controlled from the Atomic Media admin panel."}</p>
            <div class="meta">
              <span>${project.year || "2026"}</span>
              <span>${project.projectType || "Project"}</span>
              <span>${project.mediaFolder || `projects/${cardId}`}</span>
            </div>
          </div>
          <div class="cover">
            ${cover ? `<img src="${assetUrl(cover)}" alt="${project.title}">` : `<div class="empty-cover">Upload a cover image from Admin</div>`}
          </div>
        </section>
        <section class="content">
          <div class="copy">
            <h2>Project Details</h2>
            <p>${String(project.body || "Upload photos, videos, reels, and project copy from Admin -> Projects. This page will update from the CMS.").replace(/\n/g, "<br>")}</p>
          </div>
          <div class="media">
            <div class="section-title">
              <p class="eyebrow">Project Folder</p>
              <h2>Photos & Videos</h2>
            </div>
            ${media.length ? `<div class="media-grid">${media.map(mediaItem).join("")}</div>` : `<div class="empty-media">No project media uploaded yet. Add photos or videos in Admin -> Projects -> ${project.title}.</div>`}
          </div>
        </section>
      </main>
    `;
  }

  try {
    const response = await fetch("/api/public/site");
    if (!response.ok) throw new Error("CMS unavailable");
    const data = await response.json();
    const projects = Array.isArray(data.projects) ? data.projects : [];
    const project = projects.find((item) => {
      const candidates = [
        item.slug,
        item.mediaFolder,
        item.coverImage?.url,
        item.images?.[0]?.url,
        item.title
      ].map(normalize);
      return candidates.some((candidate) => candidate.includes(normalize(cardId)) || normalize(cardId).includes(candidate));
    });

    if (!project) throw new Error("Project not found");
    render(project);
  } catch (error) {
    root.innerHTML = `
      <main class="error-state">
        <a href="/projects" class="brand">ATOMIC MEDIA<span class="atomic-dot">.</span></a>
        <h1>Project Not Found</h1>
        <p>This project page could not load from the CMS.</p>
        <a href="/projects">Back to Projects</a>
      </main>
    `;
  }
})();
