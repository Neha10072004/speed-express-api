
const mongoose = require("mongoose");

const connectDB = async () => {
  const mongoUri =
    process.env.MONGO_URI || process.env.MONGODB_URI;

  if (!mongoUri) {
    console.error(
      "MongoDB connection string is missing. Set MONGO_URI or MONGODB_URI."
    );
    process.exit(1);
  }

  try {
    const connection = await mongoose.connect(mongoUri);

    console.log(
      `MongoDB Connected: ${connection.connection.host}`
    );
  } catch (error) {
    console.error("MongoDB Connection Error:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;