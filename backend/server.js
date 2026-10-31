
/* =========================================================
   SPEED EXPRESS API SERVER
   Express + MongoDB
========================================================= */

/* ---------------- DNS CONFIGURATION ---------------- */

const dns = require("dns");

dns.setServers([
  "8.8.8.8",
  "8.8.4.4",
]);

/* ---------------- IMPORTS ---------------- */

const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const connectDB = require("./config/db");
const shipmentRoutes = require("./routes/shipmentRoutes");

/* ---------------- APP INITIALIZATION ---------------- */

const app = express();

/* ---------------- CORS CONFIGURATION ---------------- */

/* ---------------- CORS CONFIGURATION ---------------- */

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://speedexp.in",
  "https://www.speedexp.in",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(
        new Error(`CORS blocked this origin: ${origin}`)
      );
    },

    credentials: true,

    methods: [
      "GET",
      "POST",
      "PATCH",
      "PUT",
      "DELETE",
      "OPTIONS",
    ],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
    ],
  })
);

/* ---------------- BODY PARSING ---------------- */

app.use(express.json());

app.use(
  express.urlencoded({
    extended: true,
  })
);

/* =========================================================
   ROOT ENDPOINT
   GET /
========================================================= */

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Speed Express API is running.",

    endpoints: {
      root: "GET /",
      health: "GET /api/health",

      createShipment: "POST /api/shipments",
      getShipments: "GET /api/shipments",

      trackShipment:
        "GET /api/shipments/:trackingNumber",

      updateShipment:
        "PATCH /api/shipments/:trackingNumber",

      updateStatus:
        "PATCH /api/shipments/:trackingNumber/status",

      shippingLabel:
        "GET /api/shipments/:trackingNumber/label",

      deleteShipment:
        "DELETE /api/shipments/:trackingNumber",
    },
  });
});

/* =========================================================
   HEALTH CHECK
   GET /api/health
========================================================= */

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Speed Express API is healthy.",
    timestamp: new Date().toISOString(),
  });
});

/* =========================================================
   SHIPMENT ROUTES
   All routes begin with /api/shipments
========================================================= */

app.use("/api/shipments", shipmentRoutes);

/* =========================================================
   404 HANDLER
========================================================= */

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

/* =========================================================
   GLOBAL ERROR HANDLER
========================================================= */

app.use((err, req, res, next) => {
  console.error("SERVER ERROR:", err);

  if (res.headersSent) {
    return next(err);
  }

  // CORS errors are reported separately from internal errors.
  if (err.message && err.message.startsWith("CORS blocked")) {
    return res.status(403).json({
      success: false,
      message: "This origin is not permitted by CORS.",
    });
  }

  return res.status(500).json({
    success: false,
    message: "Internal server error.",
    error:
      process.env.NODE_ENV === "production"
        ? undefined
        : err.message,
  });
});

/* =========================================================
   START SERVER
========================================================= */

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Connect to MongoDB before accepting requests.
    await connectDB();

    app.listen(PORT, () => {
      console.log("==============================================");
      console.log("       SPEED EXPRESS API SERVER");
      console.log("==============================================");
      console.log(`API running on port ${PORT}`);
      console.log(`Local URL: http://localhost:${PORT}`);
      console.log(`Health: http://localhost:${PORT}/api/health`);
      console.log("==============================================");
    });
  } catch (error) {
    console.error("Failed to start Speed Express API:", error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
