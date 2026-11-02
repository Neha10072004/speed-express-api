
require("dotenv").config();

const mongoose = require("mongoose");
const User = require("./models/User");
const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function checkPassword() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    rl.question("Enter the existing admin email: ", (email) => {
      rl.question("Enter that admin's password: ", async (password) => {
        try {
          const normalizedEmail = email.trim().toLowerCase();

          const user = await User.findOne({
            email: normalizedEmail,
          }).select("+password");

          if (!user) {
            console.log("Account not found.");
            return;
          }

          const matches = await user.comparePassword(password);

          console.log({
            accountFound: true,
            role: user.role,
            isActive: user.isActive,
            passwordMatches: matches,
          });
        } catch (error) {
          console.error("Verification failed:", error.message);
        } finally {
          rl.close();
          await mongoose.disconnect();
        }
      });
    });
  } catch (error) {
    console.error("Database connection failed:", error.message);
    rl.close();
  }
}

checkPassword();
