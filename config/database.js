import mongoose from "mongoose";

// Debugging: Check which variable is being used
if (process.env.DATABASE_URL) {
  console.log("Found DATABASE_URL, attempting connection...");
} else if (process.env.MONGO_URI) {
  console.log("Found MONGO_URI, attempting connection...");
} else {
  console.log("⚠️ WARNING: No database environment variables found. Falling back to localhost.");
}

const dbUrl = process.env.DATABASE_URL || process.env.MONGO_URI || "mongodb://localhost:27017/passport-google";

mongoose.connect(dbUrl)
  .then(() => console.log(`✅ MongoDB connected successfully`)) // Don't log full URL for security in prod
  .catch((err) => console.error("❌ MongoDB connection error:", err));

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true, // Crucial: This links the accounts together
      lowercase: true,
    },
    avatar: String,

    // OAuth Identifiers
    googleId: { type: String, unique: true, sparse: true },
    githubId: { type: String, unique: true, sparse: true },
    discordId: { type: String, unique: true, sparse: true },
  },
  { timestamps: true }
);

const UserModel = mongoose.model("User", userSchema);

export default UserModel;
