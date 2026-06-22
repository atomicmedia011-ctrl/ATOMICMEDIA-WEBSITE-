const express = require("express");
const path = require("path");
const {
  LUSION_CO,
  LUSION_DEV,
  PROJECT_CO,
  PROJECT_DEV,
  firstExisting
} = require("../config/sitePaths");

const router = express.Router();

function safeJoin(root, urlPath) {
  if (!root) return null;
  let decoded;
  try {
    decoded = decodeURIComponent(urlPath.split("?")[0]);
  } catch {
    return null;
  }
  const normalized = path.normalize(decoded).replace(/^([/\\])+/, "");
  const fullPath = path.join(root, normalized);
  const relative = path.relative(root, fullPath);
  return !relative.startsWith("..") && !path.isAbsolute(relative) ? fullPath : null;
}

function routePublicSite(urlPath) {
  if (urlPath === "/" || urlPath === "/index.html") {
    return path.join(LUSION_CO, "index.html");
  }

  if (/^\/(?:sitemap[^/]*\.xml|robots\.txt|favicon\.ico)$/.test(urlPath)) {
    return firstExisting([safeJoin(LUSION_CO, urlPath), safeJoin(PROJECT_CO, urlPath)]);
  }

  if (urlPath === "/projects" || urlPath === "/projects/") {
    return firstExisting([
      path.join(LUSION_CO, "projects", "index.html"),
      path.join(LUSION_CO, "projects.html"),
      path.join(PROJECT_CO, "projects", "index.html"),
      path.join(PROJECT_CO, "projects.html")
    ]);
  }

  if (urlPath.startsWith("/projects/")) {
    return firstExisting([
      safeJoin(LUSION_CO, `${urlPath}/index.html`),
      safeJoin(PROJECT_CO, `${urlPath}/index.html`),
      path.join(LUSION_CO, "projects", "index.html"),
      path.join(LUSION_CO, "projects.html"),
      path.join(PROJECT_CO, "projects", "index.html"),
      path.join(PROJECT_CO, "projects.html")
    ]);
  }

  if (urlPath.startsWith("/_astro/") || urlPath.startsWith("/assets/") || urlPath.startsWith("/public/")) {
    return firstExisting([
      safeJoin(LUSION_CO, urlPath),
      safeJoin(LUSION_DEV, urlPath),
      safeJoin(PROJECT_CO, urlPath),
      safeJoin(PROJECT_DEV, urlPath),
      urlPath.endsWith("/mobile.mp4") ? safeJoin(LUSION_DEV, urlPath.replace(/\/mobile\.mp4$/, "/desktop.mp4")) : null,
      urlPath.endsWith("/mobile.mp4") ? safeJoin(PROJECT_DEV, urlPath.replace(/\/mobile\.mp4$/, "/desktop.mp4")) : null
    ]);
  }

  const pagePath = urlPath.replace(/\/$/, "");
  return firstExisting([
    safeJoin(LUSION_CO, `${pagePath}/index.html`),
    safeJoin(PROJECT_CO, `${pagePath}/index.html`),
    safeJoin(LUSION_CO, `${pagePath}.html`),
    safeJoin(PROJECT_CO, `${pagePath}.html`)
  ]);
}

router.get("*", (req, res, next) => {
  const filePath = routePublicSite(req.path);
  if (!filePath) return next();
  res.sendFile(filePath, (err) => {
    if (err) next();
  });
});

module.exports = router;
