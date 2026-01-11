import mongoose from "mongoose";

mongoose.connect("mongodb://localhost:27017/passport-google");

const userSchema = mongoose.Schema(
  {
    googleId: {
      type: String,
      required: true,
      unique: true, // Prevents duplicate accounts for the same Google ID
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true, // Ensures one account per email address
      lowercase: true,
    },
    avatar: {
      type: String, // Stores the URL of the Google profile photo
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true, // Automatically manages createdAt and updatedAt fields
  }
);

const UserModel = mongoose.model("User", userSchema);

export default UserModel;
