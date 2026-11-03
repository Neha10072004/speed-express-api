
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User");
const LoginActivity = require("../models/LoginActivity");

const getRequestInfo = (req) => ({
  ipAddress:
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.ip ||
    "",
  userAgent: req.headers["user-agent"] || "",
});

const recordActivity = async (data) => {
  try {
    await LoginActivity.create(data);
  } catch (error) {
    console.error(
      "Login activity recording failed:",
      error.message
    );
  }
};

// POST /api/auth/register
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required.",
      });
    }

    if (String(password).length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must contain at least 8 characters.",
      });
    }

    const normalizedEmail = String(email)
      .trim()
      .toLowerCase();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    // Public signup must never create an admin.
    const user = await User.create({
      name: String(name).trim(),
      email: normalizedEmail,
      password,
      role: "user",
      isActive: true,
    });

    return res.status(201).json({
      success: true,
      message: "Account created successfully.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Unable to create account.",
    });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    const normalizedEmail = String(email)
      .trim()
      .toLowerCase();

    const user = await User.findOne({
      email: normalizedEmail,
    }).select("+password");

    const requestInfo = getRequestInfo(req);

    if (!user) {
      await recordActivity({
        email: normalizedEmail,
        action: "login_failed",
        status: "failed",
        ...requestInfo,
      });

      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    if (!user.isActive) {
      await recordActivity({
        user: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        action: "login_failed",
        status: "failed",
        ...requestInfo,
      });

      return res.status(403).json({
        success: false,
        message:
          "Your account is inactive. Contact an administrator.",
      });
    }

    const passwordMatches = await user.comparePassword(password);

    if (!passwordMatches) {
      await recordActivity({
        user: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        action: "login_failed",
        status: "failed",
        ...requestInfo,
      });

      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        success: false,
        message: "JWT_SECRET is not configured.",
      });
    }

    const sessionId = crypto.randomUUID();

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
        sessionId,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );

    user.lastLogin = new Date();
    await user.save();

    await recordActivity({
      user: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      action: "login",
      status: "success",
      sessionId,
      ...requestInfo,
    });

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      success: false,
      message: "Login failed due to a server error.",
    });
  }
};

// POST /api/auth/logout
const logout = async (req, res) => {
  try {
    await recordActivity({
      user: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      action: "logout",
      status: "success",
      sessionId: req.sessionId,
      ...getRequestInfo(req),
    });

    return res.status(200).json({
      success: true,
      message: "Logged out successfully.",
    });
  } catch (error) {
    console.error("Logout error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to record logout.",
    });
  }
};

// GET /api/auth/me
const getMe = async (req, res) => {
  return res.status(200).json({
    success: true,
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      isActive: req.user.isActive,
    },
  });
};

// PATCH /api/auth/change-password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current and new passwords are required.",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 8 characters.",
      });
    }

    const user = await User.findById(req.user._id)
      .select("+password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const matches = await user.comparePassword(currentPassword);

    if (!matches) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect.",
      });
    }

    user.password = newPassword;
    await user.save();

    await recordActivity({
      user: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      action: "password_changed",
      status: "success",
      ...getRequestInfo(req),
    });

    return res.status(200).json({
      success: true,
      message:
        "Password changed successfully. Please log in again.",
    });
  } catch (error) {
    console.error("Change password error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to change password.",
    });
  }
};

module.exports = {
  register,
  login,
  logout,
  getMe,
  changePassword,
};
