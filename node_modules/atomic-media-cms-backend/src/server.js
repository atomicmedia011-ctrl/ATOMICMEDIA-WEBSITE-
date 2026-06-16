require("dotenv").config();
const app = require("./app");
const connectDB = require("./config/db");

const port = Number(process.env.PORT || 5000);

connectDB()
  .then(() => {
    app.listen(port, () => {
      console.log(`CMS API running at http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error("Failed to start CMS API", error);
    process.exit(1);
  });
