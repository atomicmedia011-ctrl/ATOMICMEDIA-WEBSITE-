const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..", "..", "..");
const LANDING_ROOT = path.join(ROOT, "lusion.co landing page(1)");
const PROJECT_ROOT = path.join(ROOT, "lusion.co project(1)");

const LUSION_CO = path.join(LANDING_ROOT, "lusion.co");
const LUSION_DEV = path.join(LANDING_ROOT, "lusion.dev");
const PROJECT_CO = path.join(PROJECT_ROOT, "lusion.co");
const PROJECT_DEV = path.join(PROJECT_ROOT, "lusion.dev");

function firstExisting(paths) {
  return paths.find((candidate) => candidate && fs.existsSync(candidate));
}

function getSiteAssetRoot() {
  return firstExisting([
    path.join(LUSION_CO, "assets"),
    path.join(LUSION_DEV, "assets"),
    path.join(PROJECT_CO, "assets"),
    path.join(PROJECT_DEV, "assets")
  ]);
}

module.exports = {
  ROOT,
  LUSION_CO,
  LUSION_DEV,
  PROJECT_CO,
  PROJECT_DEV,
  getSiteAssetRoot,
  firstExisting
};
