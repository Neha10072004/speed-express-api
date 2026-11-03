
const express = require("express");
const router = express.Router();

const {
  register,
  login,
  logout,
  getMe,
  changePassword,
} = require("../controllers/authController");

const { protect } = require("../middleware/authMiddleware");

// ======================================
// PUBLIC AUTHENTICATION ROUTES
// ======================================

// Public registration
// POST /api/auth/register
router.post("/register", register);

// Public login
// POST /api/auth/login
router.post("/login", login);

// ======================================
// PROTECTED AUTHENTICATION ROUTES
// ======================================

// Logout
// POST /api/auth/logout
router.post("/logout", protect, logout);

// Get logged-in user
// GET /api/auth/me
router.get("/me", protect, getMe);

// Change password
// PATCH /api/auth/change-password
router.patch("/change-password", protect, changePassword);

module.exports = router;
