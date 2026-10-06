const dns = require("dns");

dns.setServers([
  "8.8.8.8",
  "8.8.4.4"
]);

const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

const connectDB = require("./config/db");
const shipmentRoutes = require("./routes/shipmentRoutes");

dotenv.config();

connectDB();

const app = express();

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:3000",
      "https://speedexp.in",
      "https://www.speedexp.in"
    ],
    methods: [
      "GET",
      "POST",
      "PATCH",
      "PUT",
      "DELETE",
      "OPTIONS"
    ],
    allowedHeaders: [
      "Content-Type",
      "Authorization"
    ]
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Speed Express API is running.",
    endpoints: {
      createShipment: "POST /api/shipments",
      getShipments: "GET /api/shipments",
      trackShipment: "GET /api/shipments/:trackingNumber",
      updateStatus:
        "PATCH /api/shipments/:trackingNumber/status"
    }
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Speed Express API is healthy."
  });
});

app.use("/api/shipments", shipmentRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(
    `Speed Express API running on port ${PORT}`
  );
});