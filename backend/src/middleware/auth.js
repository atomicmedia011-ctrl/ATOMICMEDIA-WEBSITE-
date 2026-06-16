const jwt = require("jsonwebtoken");
const asyncHandler = require("../utils/asyncHandler");
const User = require("../models/User");

const rolePermissions = {
  super_admin: ["*:*"],
  admin: ["content:*", "media:*", "settings:*", "leads:*", "communication:*", "ai:*", "analytics:read"],
  editor: ["content:read", "content:write", "content:delete", "media:read", "media:write", "media:delete", "leads:read", "leads:write", "communication:read", "communication:write", "communication:delete", "ai:read", "ai:write", "ai:delete", "analytics:read"],
  viewer: ["content:read", "media:read", "leads:read", "analytics:read"]
};

function signToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d"
  });
}

const protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : req.cookies?.token;
  if (!token) return res.status(401).json({ message: "Authentication required" });

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const user = await User.findById(decoded.sub).select("+passwordHash");
  if (!user || !user.isActive) return res.status(401).json({ message: "Invalid session" });
  req.user = user;
  next();
});

function requirePermission(scope, action) {
  return (req, res, next) => {
    const permissions = rolePermissions[req.user.role] || [];
    if (
      permissions.includes("*:*") ||
      permissions.includes(`${scope}:*`) ||
      permissions.includes(`${scope}:${action}`)
    ) {
      return next();
    }
    return res.status(403).json({ message: "Permission denied" });
  };
}

module.exports = { protect, requirePermission, signToken, rolePermissions };
