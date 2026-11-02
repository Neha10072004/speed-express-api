
require("dotenv").config();

const mongoose = require("mongoose");
const User = require("./models/User");

async function checkAdminUsers() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const users = await User.find({
      email: {
        $in: [
          "nehabhalerao@gmail.com",
          "nehabhalerao07@gmail.com",
          "milindrokade@gmail.com",
        ],
      },
    }).select("+password");

    console.log("\n--- ADMIN ACCOUNT DIAGNOSTIC ---");

    for (const user of users) {
      console.log({
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        passwordExists: Boolean(user.password),
        passwordLooksBcrypt:
          typeof user.password === "string" &&
          /^\$2[aby]\$\d{2}\$/.test(user.password),
      });
    }

    console.log("\nMatching accounts:", users.length);
  } catch (error) {
    console.error("Diagnostic failed:", error.message);
  } finally {
    await mongoose.disconnect();
  }
}

checkAdminUsers();
