
const mongoose = require("mongoose");

const loginActivitySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    name: {
      type: String,
      default: "",
    },

    email: {
      type: String,
      lowercase: true,
      trim: true,
      required: true,
    },

    role: {
      type: String,
      default: "unknown",
    },

    action: {
      type: String,
      enum: ["login", "logout", "login_failed", "password_changed"],
      required: true,
    },

    status: {
      type: String,
      enum: ["success", "failed"],
      required: true,
    },

    ipAddress: {
      type: String,
      default: "",
    },

    userAgent: {
      type: String,
      default: "",
    },

    sessionId: {
      type: String,
      default: null,
      index: true,
    },

    eventTime: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

loginActivitySchema.index({ eventTime: -1 });

module.exports =
  mongoose.models.LoginActivity ||
  mongoose.model("LoginActivity", loginActivitySchema);
