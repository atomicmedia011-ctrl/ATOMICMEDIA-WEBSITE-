const app = require("../backend/src/app");
const connectDB = require("../backend/src/config/db");

let dbReady;

module.exports = async function handler(req, res) {
  if (!dbReady) {
    dbReady = connectDB();
  }
  await dbReady;
  return app(req, res);
};
