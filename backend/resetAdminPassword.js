
require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const readline = require("readline");
const User = require("./models/User");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const ask = (question) =>
  new Promise((resolve) => rl.question(question, resolve));

async function resetAdminPassword() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const email = (await ask("Existing admin email: "))
      .trim()
      .toLowerCase();

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      console.log("Admin account not found. No changes made.");
      return;
    }

    if (user.role !== "admin" || !user.isActive) {
      console.log("This is not an active admin account. No changes made.");
      return;
    }

    const password = await ask("Enter a new password (minimum 12 characters): ");

    if (password.length < 12) {
      console.log("Password must contain at least 12 characters.");
      return;
    }

    const confirmation = await ask("Confirm the new password: ");

    if (password !== confirmation) {
      console.log("Passwords do not match. No changes made.");
      return;
    }

    // Assign plain text; the existing User.js pre-save hook hashes it.
    user.password = password;
    await user.save();

    console.log("Admin password updated successfully.");
    console.log("Admin email:", user.email);
    console.log("Admin role preserved:", user.role);
  } catch (error) {
    console.error("Password reset failed:", error.message);
  } finally {
    rl.close();
    await mongoose.disconnect();
  }
}

resetAdminPassword();
