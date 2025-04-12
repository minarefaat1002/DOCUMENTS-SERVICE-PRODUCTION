require("dotenv").config();
const { initializeDatabase } = require("./db");
const { app } = require("./app");
const { initializeModels } = require("./models/models");

const PORT = process.env.PORT || 3000;

async function start() {
  await initializeDatabase();
  initializeModels();

  try {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Startup failed:", error);
    process.exit(1);
  }
}

start();
