const express = require("express");
const fs = require("fs");
const path = require("path");
const asyncHandler = require("../utils/asyncHandler");
const upload = require("../middleware/upload");
const { cloudinary } = require("../config/cloudinary");
const { getSiteAssetRoot } = require("../config/sitePaths");
const { protect, requirePermission } = require("../middleware/auth");
const MediaAsset = require("../models/MediaAsset");

const router = express.Router();
const ROOT = path.join(__dirname, "..", "..", "..");
const UPLOAD_ROOT = path.join(ROOT, "backend", "uploads");
const SITE_ASSET_ROOT = getSiteAssetRoot();

function mediaTypeFromMime(mimeType = "") {
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  if (mimeType.startsWith("image/")) return "image";
  return "raw";
}

function mediaTypeFromExt(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if ([".mp4", ".webm", ".mov"].includes(ext)) return "video";
  if ([".ogg", ".mp3", ".wav"].includes(ext)) return "audio";
  if ([".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg", ".ico"].includes(ext)) return "image";
  return "raw";
}

function walkAssets(dir, list = []) {
  if (!dir || !fs.existsSync(dir)) return list;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkAssets(fullPath, list);
    } else {
      const type = mediaTypeFromExt(fullPath);
      if (["image", "video"].includes(type)) {
        const relative = path.relative(SITE_ASSET_ROOT, fullPath).replace(/\\/g, "/");
        const stat = fs.statSync(fullPath);
        list.push({
          _id: `local:${relative}`,
          title: entry.name,
          folder: path.dirname(relative).replace(/\\/g, "/"),
          type,
          size: stat.size,
          url: `/assets/${relative}`,
          secureUrl: `/assets/${relative}`,
          provider: "local",
          publicId: relative
        });
      }
    }
  }
  return list;
}

router.get("/", protect, requirePermission("media", "read"), asyncHandler(async (req, res) => {
  const page = Math.max(Number(req.query.page || 1), 1);
  const limit = Math.min(Number(req.query.limit || 30), 100);
  const query = {};
  if (req.query.folder) query.folder = req.query.folder;
  if (req.query.type) query.type = req.query.type;
  if (req.query.search) query.$text = { $search: req.query.search };
  const [items, total] = await Promise.all([
    MediaAsset.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    MediaAsset.countDocuments(query)
  ]);
  res.json({ items, total, page, pages: Math.ceil(total / limit) || 1 });
}));

router.get("/local-assets", protect, requirePermission("media", "read"), asyncHandler(async (req, res) => {
  const items = walkAssets(SITE_ASSET_ROOT)
    .filter((asset) => !req.query.type || asset.type === req.query.type)
    .filter((asset) => !req.query.search || `${asset.title} ${asset.folder}`.toLowerCase().includes(String(req.query.search).toLowerCase()))
    .slice(0, 500);
  res.json({ items, total: items.length });
}));

router.post("/import-local", protect, requirePermission("media", "write"), asyncHandler(async (req, res) => {
  const localAssets = walkAssets(SITE_ASSET_ROOT);
  const imported = [];
  for (const asset of localAssets) {
    const existing = await MediaAsset.findOne({ provider: "local", publicId: asset.publicId });
    if (!existing) {
      imported.push(await MediaAsset.create({ ...asset, _id: undefined, uploadedBy: req.user.id }));
    }
  }
  res.status(201).json({ items: imported, total: imported.length });
}));

router.post("/upload", protect, requirePermission("media", "write"), upload.array("files", 20), asyncHandler(async (req, res) => {
  const folder = req.body.folder || "atomic-media";
  const uploaded = [];

  for (const file of req.files || []) {
    if (!cloudinary.config().cloud_name) {
      const safeFolder = folder.replace(/[^\w.-]+/g, "-");
      const uploadDir = path.join(UPLOAD_ROOT, safeFolder);
      fs.mkdirSync(uploadDir, { recursive: true });
      const filename = `${Date.now()}-${file.originalname.replace(/[^\w.-]+/g, "-")}`;
      const diskPath = path.join(uploadDir, filename);
      fs.writeFileSync(diskPath, file.buffer);
      const url = `/uploads/${safeFolder}/${filename}`;
      const asset = await MediaAsset.create({
        title: file.originalname,
        folder,
        type: mediaTypeFromMime(file.mimetype),
        mimeType: file.mimetype,
        size: file.size,
        url,
        secureUrl: url,
        publicId: `${safeFolder}/${filename}`,
        provider: "local",
        uploadedBy: req.user.id
      });
      uploaded.push(asset);
      continue;
    }

    const dataUri = `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;
    const result = await cloudinary.uploader.upload(dataUri, {
      folder,
      resource_type: file.mimetype.startsWith("video/") ? "video" : "auto",
      tags: req.body.tags ? String(req.body.tags).split(",").map((tag) => tag.trim()) : []
    });
    const asset = await MediaAsset.create({
      title: file.originalname,
      folder,
      type: result.resource_type === "video" ? "video" : "image",
      mimeType: file.mimetype,
      size: file.size,
      width: result.width,
      height: result.height,
      duration: result.duration,
      url: result.secure_url,
      secureUrl: result.secure_url,
      publicId: result.public_id,
      provider: "cloudinary",
      uploadedBy: req.user.id
    });
    uploaded.push(asset);
  }

  res.status(201).json({ items: uploaded });
}));

router.delete("/:id", protect, requirePermission("media", "delete"), asyncHandler(async (req, res) => {
  const asset = await MediaAsset.findByIdAndDelete(req.params.id);
  if (!asset) return res.status(404).json({ message: "Media not found" });
  if (asset.provider === "cloudinary" && asset.publicId && cloudinary.config().cloud_name) {
    await cloudinary.uploader.destroy(asset.publicId, { resource_type: asset.type === "video" ? "video" : "image" });
  }
  if (asset.provider === "local" && asset.url && asset.url.startsWith("/uploads/")) {
    const diskPath = path.resolve(UPLOAD_ROOT, asset.url.replace(/^\/uploads\//, ""));
    if (diskPath.startsWith(UPLOAD_ROOT) && fs.existsSync(diskPath)) fs.unlinkSync(diskPath);
  }
  res.json({ ok: true });
}));

module.exports = router;
