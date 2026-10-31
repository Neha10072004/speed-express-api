
const express = require("express");
const router = express.Router();

const {
  getUsers,
  createUser,
  updateUser,
  getLoginActivity,
} = require("../controllers/userController");

const {
  protect,
  adminOnly,
} = require("../middleware/authMiddleware");

// Every route in this file requires an active admin account.
router.use(protect, adminOnly);

router.get("/users", getUsers);
router.post("/users", createUser);
router.patch("/users/:id", updateUser);
router.get("/login-activity", getLoginActivity);

module.exports = router;
