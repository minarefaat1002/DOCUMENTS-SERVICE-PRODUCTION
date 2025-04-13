const express = require("express");
const helmet = require("helmet");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const morgan = require("morgan");
const { logger } = require("./utils/logging");
const documentRoutes = require("./routes/documentRoutes");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { corsOptions } = require("./conf");
require("dotenv").config();

const app = express();
app.use(cors(corsOptions));
app.options("*", cors()); // Allow OPTIONS for all routes
app.use(helmet()); // secure http headers
app.use(compression()); // compress responses
app.use(express.json()); // parse json bodies
// Parse application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); // Enable cookie parsing
app.use(morgan("combined", { stream: logger.stream })); // Log HTTP requests
// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
});
app.use(limiter);
app.use("/api/documents", documentRoutes);
// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK" });
});

module.exports = { app };
