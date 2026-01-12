import mongoose from "mongoose";

mongoose.connect("mongodb://localhost:27017/passport-google");

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
