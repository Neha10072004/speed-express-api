
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const LoginActivity = require("../models/LoginActivity");

// GET /api/admin/users
const getUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select("-password")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    console.error("Get users error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve users.",
    });
  }
};

// POST /api/admin/users
const createUser = async (req, res) => {
  try {
    const { name, email, password, role = "user" } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required.",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "A user with this email already exists.",
      });
    }

    const allowedRoles = ["admin", "user"];

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user role.",
      });
    }

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      role,
      isActive: true,
    });

    return res.status(201).json({
      success: true,
      message: "User created successfully.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    console.error("Create user error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to create user.",
    });
  }
};

// PATCH /api/admin/users/:id
const updateUser = async (req, res) => {
  try {
    const { name, email, role, isActive, password } = req.body;

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // Prevent an admin from accidentally removing their own admin access.
    if (
      user._id.equals(req.user._id) &&
      role &&
      role !== "admin"
    ) {
      return res.status(400).json({
        success: false,
        message: "You cannot remove your own admin role.",
      });
    }

    if (name !== undefined) user.name = name.trim();

    if (email !== undefined) {
      const normalizedEmail = email.trim().toLowerCase();

      const duplicate = await User.findOne({
        email: normalizedEmail,
        _id: { $ne: user._id },
      });

      if (duplicate) {
        return res.status(409).json({
          success: false,
          message: "Email is already used by another account.",
        });
      }

      user.email = normalizedEmail;
    }

    if (role !== undefined) {
      if (!["admin", "user"].includes(role)) {
        return res.status(400).json({
          success: false,
          message: "Invalid role.",
        });
      }

      // Protect the last active admin.
      if (
        user.role === "admin" &&
        role !== "admin"
      ) {
        const activeAdmins = await User.countDocuments({
          role: "admin",
          isActive: true,
        });

        if (activeAdmins <= 1) {
          return res.status(400).json({
            success: false,
            message: "At least one active admin must remain.",
          });
        }
      }

      user.role = role;
    }

    if (isActive !== undefined) {
      if (typeof isActive !== "boolean") {
        return res.status(400).json({
          success: false,
          message: "isActive must be true or false.",
        });
      }

      if (user.role === "admin" && !isActive) {
        const activeAdmins = await User.countDocuments({
          role: "admin",
          isActive: true,
        });

        if (activeAdmins <= 1) {
          return res.status(400).json({
            success: false,
            message: "At least one active admin must remain.",
          });
        }
      }

      if (user._id.equals(req.user._id) && !isActive) {
        return res.status(400).json({
          success: false,
          message: "You cannot deactivate your own account.",
        });
      }

      user.isActive = isActive;
    }

    if (password !== undefined && password !== "") {
      if (password.length < 8) {
        return res.status(400).json({
          success: false,
          message: "Password must be at least 8 characters.",
        });
      }

      user.password = password;
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: "User updated successfully.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    console.error("Update user error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update user.",
    });
  }
};

// GET /api/admin/login-activity
const getLoginActivity = async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(
      Math.max(Number(req.query.limit) || 25, 1),
      100
    );

    const filter = {};

    if (req.query.email) {
      filter.email = req.query.email.trim().toLowerCase();
    }

    if (req.query.action) {
      filter.action = req.query.action;
    }

    const [activities, total] = await Promise.all([
      LoginActivity.find(filter)
        .populate("user", "name email role")
        .sort({ eventTime: -1 })
        .skip((page - 1) * limit)
        .limit(limit),

      LoginActivity.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      activities,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Login activity error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve login activity.",
    });
  }
};

module.exports = {
  getUsers,
  createUser,
  updateUser,
  getLoginActivity,
};
