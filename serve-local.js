const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const LANDING_ROOT = path.join(ROOT, "lusion.co landing page(1)");
const PROJECT_ROOT = path.join(ROOT, "lusion.co project(1)");
const LUSION_CO = path.join(LANDING_ROOT, "lusion.co");
const LUSION_DEV = path.join(LANDING_ROOT, "lusion.dev");
const PROJECT_CO = path.join(PROJECT_ROOT, "lusion.co");
const PROJECT_DEV = path.join(PROJECT_ROOT, "lusion.dev");
const ATOMIC_SOURCE = "C:\\ATOMICMEDIA";
const API_ORIGIN = process.env.API_ORIGIN || "http://localhost:5000";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".mp4": "video/mp4",
  ".ogg": "audio/ogg",
  ".exr": "image/aces",
  ".buf": "application/octet-stream",
};

function send(res, status, body, type = "text/plain; charset=utf-8") {
  res.writeHead(status, { "Content-Type": type });
  res.end(body);
}

function safeJoin(root, urlPath) {
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

function serveFile(req, res, filePath) {
  fs.stat(filePath, (statErr, stat) => {
    if (statErr || !stat.isFile()) {
      console.log(`404 ${filePath}`);
      send(res, 404, "Not found");
      return;
    }

    const type = MIME[path.extname(filePath).toLowerCase()] || "application/octet-stream";
    const range = req.headers.range;
    if (range) {
      const match = range.match(/bytes=(\d*)-(\d*)/);
      if (match) {
        const start = match[1] ? Number(match[1]) : 0;
        const end = match[2] ? Number(match[2]) : stat.size - 1;
        if (start <= end && end < stat.size) {
          console.log(`206 ${filePath} ${start}-${end}`);
          res.writeHead(206, {
            "Content-Type": type,
            "Content-Length": end - start + 1,
            "Content-Range": `bytes ${start}-${end}/${stat.size}`,
            "Accept-Ranges": "bytes",
            "Cache-Control": "no-store",
          });
          fs.createReadStream(filePath, { start, end }).pipe(res);
          return;
        }
      }
    }

    console.log(`200 ${filePath}`);
    res.writeHead(200, {
      "Content-Type": type,
      "Content-Length": stat.size,
      "Accept-Ranges": "bytes",
      "Cache-Control": "no-store",
    });
    fs.createReadStream(filePath).pipe(res);
  });
}

function firstExisting(paths) {
  return paths.find((candidate) => candidate && fs.existsSync(candidate));
}

function route(urlPath) {
  if (urlPath === "/" || urlPath === "/index.html") {
    return path.join(LUSION_CO, "index.html");
  }

  if (/^\/(?:sitemap[^/]*\.xml|robots\.txt|favicon\.ico)$/.test(urlPath)) {
    return firstExisting([
      safeJoin(LUSION_CO, urlPath),
      safeJoin(PROJECT_CO, urlPath),
    ]);
  }

  if (urlPath === "/projects" || urlPath === "/projects/") {
    return firstExisting([
      path.join(LUSION_CO, "projects", "index.html"),
      path.join(LUSION_CO, "projects.html"),
      path.join(PROJECT_CO, "projects", "index.html"),
      path.join(PROJECT_CO, "projects.html"),
    ]);
  }

  if (urlPath.startsWith("/projects/")) {
    return firstExisting([
      safeJoin(LUSION_CO, `${urlPath}/index.html`),
      safeJoin(PROJECT_CO, `${urlPath}/index.html`),
      path.join(LUSION_CO, "projects", "index.html"),
      path.join(LUSION_CO, "projects.html"),
      path.join(PROJECT_CO, "projects", "index.html"),
      path.join(PROJECT_CO, "projects.html"),
    ]);
  }

  if (urlPath.startsWith("/_astro/")) {
    return firstExisting([
      safeJoin(LUSION_CO, urlPath),
      safeJoin(PROJECT_CO, urlPath),
    ]);
  }

  if (urlPath.startsWith("/assets/")) {
    return firstExisting([
      safeJoin(LUSION_CO, urlPath),
      safeJoin(LUSION_DEV, urlPath),
      safeJoin(PROJECT_CO, urlPath),
      safeJoin(PROJECT_DEV, urlPath),
      urlPath.endsWith("/mobile.mp4") ? safeJoin(LUSION_DEV, urlPath.replace(/\/mobile\.mp4$/, "/desktop.mp4")) : null,
      urlPath.endsWith("/mobile.mp4") ? safeJoin(PROJECT_DEV, urlPath.replace(/\/mobile\.mp4$/, "/desktop.mp4")) : null,
    ]);
  }

  if (urlPath.startsWith("/public/")) {
    return firstExisting([
      safeJoin(LUSION_CO, urlPath),
      safeJoin(PROJECT_CO, urlPath),
    ]);
  }

  if (urlPath.startsWith("/atomicmedia-source/")) {
    return safeJoin(ATOMIC_SOURCE, urlPath.replace(/^\/atomicmedia-source\//, ""));
  }

  const pagePath = urlPath.replace(/\/$/, "");
  return firstExisting([
    safeJoin(LUSION_CO, `${pagePath}/index.html`),
    safeJoin(PROJECT_CO, `${pagePath}/index.html`),
    safeJoin(LUSION_CO, `${pagePath}.html`),
    safeJoin(PROJECT_CO, `${pagePath}.html`),
  ]);
}

function proxyApi(req, res) {
  /* Proxy /api/public/site to the real backend — no stub override */



  if (
    req.url.startsWith("/api/public/analytics/visit") ||
    req.url.startsWith("/api/public/leads")
  ) {
    send(res, 200, JSON.stringify({ ok: true }), "application/json; charset=utf-8");
    return;
  }

  const target = new URL(req.url, API_ORIGIN);
  const client = target.protocol === "https:" ? https : http;
  const proxyReq = client.request(target, {
    method: req.method,
    headers: {
      ...req.headers,
      host: target.host
    }
  }, (proxyRes) => {
    res.writeHead(proxyRes.statusCode || 502, proxyRes.headers);
    proxyRes.pipe(res);
  });

  proxyReq.on("error", () => {
    send(res, 502, "CMS API is not running. Start it with: npm --prefix backend run dev");
  });

  req.pipe(proxyReq);
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, "http://localhost");
  if (url.pathname.startsWith("/atomicmedia-source/events.framer.com/script")) {
    send(res, 200, "", "text/javascript; charset=utf-8");
    return;
  }

  if (url.pathname.endsWith("/GrgcKwrN6d3Uz8EwcLHZxwEfC4.woff2")) {
    res.writeHead(204, { "Cache-Control": "no-store" });
    res.end();
    return;
  }

  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/uploads/")) {
    proxyApi(req, res);
    return;
  }

  const filePath = route(url.pathname);

  if (!filePath) {
    console.log(`404 ${url.pathname}`);
    send(res, 404, "Not found");
    return;
  }

  serveFile(req, res, filePath);
});

const port = Number(process.env.PORT || 4173);
server.listen(port, () => {
  console.log(`Lusion mirror running at http://localhost:${port}`);
});
