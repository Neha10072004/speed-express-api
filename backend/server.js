
/* =========================================================
   SPEED EXPRESS API SERVER
   Express + MongoDB + JWT Authentication
========================================================= */

const dns = require("dns");

dns.setServers(["8.8.8.8", "8.8.4.4"]);

const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const connectDB = require("./config/db");

const shipmentRoutes = require("./routes/shipmentRoutes");
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");

const app = express();

/* ---------------- CORS ---------------- */

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

      return callback(new Error(`CORS blocked this origin: ${origin}`));
    },
    credentials: true,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

/* ---------------- BODY PARSING ---------------- */

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ---------------- ROOT ---------------- */

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Speed Express API is running.",
    endpoints: {
      health: "GET /api/health",
      login: "POST /api/auth/login",
      logout: "POST /api/auth/logout",
      currentUser: "GET /api/auth/me",
      changePassword: "PATCH /api/auth/change-password",
      users: "GET /api/admin/users",
      createUser: "POST /api/admin/users",
      updateUser: "PATCH /api/admin/users/:id",
      loginActivity: "GET /api/admin/login-activity",
      shipments: "GET /api/shipments",
      createShipment: "POST /api/shipments",
    },
  });
});

/* ---------------- HEALTH CHECK ---------------- */

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Speed Express API is healthy.",
    timestamp: new Date().toISOString(),
  });
});

/* =========================================================
   API ROUTES — MOUNT EACH ROUTER ONLY ONCE
========================================================= */

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/shipments", shipmentRoutes);

/* ---------------- 404 HANDLER ---------------- */

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

/* ---------------- GLOBAL ERROR HANDLER ---------------- */

app.use((err, req, res, next) => {
  console.error("SERVER ERROR:", err);

  if (res.headersSent) {
    return next(err);
  }

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

/* ---------------- START SERVER ---------------- */

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log("==============================================");
      console.log("       SPEED EXPRESS API SERVER");
      console.log("==============================================");
      console.log(`API running on port ${PORT}`);
      console.log(`Local URL: http://localhost:${PORT}`);
      console.log(`Health: http://localhost:${PORT}/api/health`);
      console.log(`Login: http://localhost:${PORT}/api/auth/login`);
      console.log("==============================================");
    });
  } catch (error) {
    console.error("Failed to start Speed Express API:", error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
