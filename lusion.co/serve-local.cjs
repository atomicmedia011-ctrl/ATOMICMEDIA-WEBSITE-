const http = require("http");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "lusion.co");
const port = Number(process.env.PORT || 4173);
const logPath = path.join(__dirname, "server.requests.log");

const types = {
    ".css": "text/css; charset=utf-8",
    ".html": "text/html; charset=utf-8",
    ".ico": "image/x-icon",
    ".js": "text/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".buf": "application/octet-stream",
    ".exr": "image/x-exr",
    ".mp4": "video/mp4",
    ".ogg": "audio/ogg",
    ".png": "image/png",
    ".svg": "image/svg+xml",
    ".webmanifest": "application/manifest+json; charset=utf-8",
    ".webp": "image/webp",
    ".woff2": "font/woff2",
    ".xml": "application/xml; charset=utf-8",
};

const server = http.createServer((request, response) => {
    let pathname = decodeURIComponent(request.url.split("?")[0]);
    if (pathname.endsWith("/")) pathname += "index.html";

    const filePath = path.normalize(path.join(root, pathname));
    if (!filePath.startsWith(root)) {
        response.writeHead(403);
        response.end("Forbidden");
        return;
    }

    fs.readFile(filePath, (error, contents) => {
        if (error) {
            fs.appendFileSync(logPath, `${new Date().toISOString()} 404 ${request.method} ${request.url}\n`);
            response.writeHead(404);
            response.end("Not found");
            return;
        }

        fs.appendFileSync(logPath, `${new Date().toISOString()} 200 ${request.method} ${request.url}\n`);
        response.writeHead(200, {
            "Content-Type": types[path.extname(filePath)] || "application/octet-stream",
            "Cache-Control": "no-store, max-age=0",
            "Access-Control-Allow-Origin": "*",
        });
        response.end(contents);
    });
});

server.listen(port, "127.0.0.1", () => {
    console.log(`Lusion site running at http://127.0.0.1:${port}/`);
});
