const express = require("express");
const slugify = require("slugify");
const asyncHandler = require("./asyncHandler");
const { protect, requirePermission } = require("../middleware/auth");

function buildQuery(req) {
  const query = {};
  if (req.query.search) {
    query.$text = { $search: req.query.search };
  }
  if (req.query.status) query.status = req.query.status;
  if (req.query.category) query.categories = req.query.category;
  return query;
}

function crudRouter(Model, options = {}) {
  const router = express.Router();
  const permission = options.permission || "content";

  router.get("/", protect, requirePermission(permission, "read"), asyncHandler(async (req, res) => {
    const page = Math.max(Number(req.query.page || 1), 1);
    const limit = Math.min(Math.max(Number(req.query.limit || 20), 1), 100);
    const query = buildQuery(req);
    const [items, total] = await Promise.all([
      Model.find(query).sort(options.sort || { order: 1, createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      Model.countDocuments(query)
    ]);
    res.json({ items, total, page, pages: Math.ceil(total / limit) || 1 });
  }));

  router.post("/reorder", protect, requirePermission(permission, "write"), asyncHandler(async (req, res) => {
    const updates = Array.isArray(req.body.items) ? req.body.items : [];
    await Promise.all(updates.map((item, index) => Model.findByIdAndUpdate(item.id, { order: item.order ?? index })));
    res.json({ ok: true });
  }));

  router.get("/:id", protect, requirePermission(permission, "read"), asyncHandler(async (req, res) => {
    const item = await Model.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Record not found" });
    res.json(item);
  }));

  router.post("/", protect, requirePermission(permission, "write"), asyncHandler(async (req, res) => {
    const body = { ...req.body };
    if (!body.slug && body.title) body.slug = slugify(body.title, { lower: true, strict: true });
    if (!body.slug && body.name) body.slug = slugify(body.name, { lower: true, strict: true });
    const item = await Model.create(body);
    res.status(201).json(item);
  }));

  router.patch("/:id", protect, requirePermission(permission, "write"), asyncHandler(async (req, res) => {
    const body = { ...req.body };
    if (body.title && !body.slug) body.slug = slugify(body.title, { lower: true, strict: true });
    if (body.name && !body.slug) body.slug = slugify(body.name, { lower: true, strict: true });
    const item = await Model.findByIdAndUpdate(req.params.id, body, { new: true, runValidators: true });
    if (!item) return res.status(404).json({ message: "Record not found" });
    res.json(item);
  }));

  router.delete("/:id", protect, requirePermission(permission, "delete"), asyncHandler(async (req, res) => {
    const item = await Model.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ message: "Record not found" });
    res.json({ ok: true });
  }));

  return router;
}

module.exports = crudRouter;
