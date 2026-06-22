require("./config/env");
const path = require("path");
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const { configureCloudinary, hasCloudinaryConfig } = require("./config/cloudinary");

const authRoutes = require("./routes/authRoutes");
const publicRoutes = require("./routes/publicRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const contentRoutes = require("./routes/contentRoutes");
const mediaRoutes = require("./routes/mediaRoutes");
const leadsRoutes = require("./routes/leadsRoutes");
const communicationRoutes = require("./routes/communicationRoutes");
const aiRoutes = require("./routes/aiRoutes");
const otpRoutes = require("./routes/otpRoutes");
const chatbotRoutes = require("./routes/chatbotRoutes");
const publicSiteRoutes = require("./routes/publicSiteRoutes");

configureCloudinary();

const app = express();
const corsOrigins = (process.env.CORS_ORIGIN || "").split(",").map((item) => item.trim()).filter(Boolean);

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: corsOrigins.length ? corsOrigins : true,
  credentials: true
}));
app.use(cookieParser());
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));
app.use(morgan("dev"));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 1000 }));

app.get("/api/health", (req, res) => res.json({
  ok: true,
  service: "atomic-media-cms",
  cloudinary: hasCloudinaryConfig() ? "configured" : "missing",
  mongo: process.env.MONGO_URI ? "configured" : "missing"
}));
app.use("/api/auth", authRoutes);
app.use("/api/public", publicRoutes);
app.use("/api/public/otp", otpRoutes);
app.use("/api/public/chatbot", chatbotRoutes);
app.use("/api/admin/dashboard", dashboardRoutes);
app.use("/api/admin/media", mediaRoutes);
app.use("/api/admin/leads", leadsRoutes);
app.use("/api/admin/communication", communicationRoutes);
app.use("/api/admin/ai", aiRoutes);
app.use("/api/admin", contentRoutes);

const adminBuild = path.join(__dirname, "..", "..", "admin", "dist");
const uploadsRoot = path.join(__dirname, "..", "uploads");
app.use("/uploads", express.static(uploadsRoot));
app.use("/admin", express.static(adminBuild));
app.get("/admin/*", (req, res, next) => {
  res.sendFile(path.join(adminBuild, "index.html"), (err) => {
    if (err) next();
  });
});
app.use(publicSiteRoutes);

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || "Server error" });
});

module.exports = app;
