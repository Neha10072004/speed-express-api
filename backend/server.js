const dns = require("dns");

dns.setServers([
  "8.8.8.8",
  "8.8.4.4",
]);

const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

const connectDB = require("./config/db");
const shipmentRoutes = require("./routes/shipmentRoutes");

dotenv.config();

connectDB();

const app = express();

/* =========================
   CORS
========================= */

app.use(
  cors({
    origin: [
      "https://speedexp.in",
      "https://www.speedexp.in",
      "http://localhost:5173",
      "http://localhost:3000",
    ],

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

/* =========================
   BODY PARSER
========================= */

app.use(express.json());

app.use(
  express.urlencoded({
    extended: true,
  })
);

/* =========================
   ROOT
========================= */

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Speed Express API is running.",
    endpoints: {
      health:
        "GET /api/health",

      createShipment:
        "POST /api/shipments",

      getShipments:
        "GET /api/shipments",

      trackShipment:
        "GET /api/shipments/:trackingNumber",

      updateStatus:
        "PATCH /api/shipments/:trackingNumber/status",

      shippingLabel:
        "GET /api/shipments/:trackingNumber/label",
    },
  });
});

/* =========================
   HEALTH CHECK
========================= */

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Speed Express API is healthy.",
  });
});

/* =========================
   SHIPMENT ROUTES
========================= */

app.use(
  "/api/shipments",
  shipmentRoutes
);

/* =========================
   404
========================= */

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message:
      `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

/* =========================
   ERROR HANDLER
========================= */

app.use((err, req, res, next) => {
  console.error("SERVER ERROR:", err);

  if (res.headersSent) {
    return next(err);
  }

  res.status(500).json({
    success: false,
    message: "Internal server error.",
    error: err.message,
  });
});

/* =========================
   START SERVER
========================= */

const PORT =
  process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(
    "=============================================="
  );

  console.log(
    `Speed Express API running on port ${PORT}`
  );

  console.log(
    `http://localhost:${PORT}`
  );

  console.log(
    "=============================================="
  );
});