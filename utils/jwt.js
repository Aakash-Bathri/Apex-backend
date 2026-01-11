import jwt from "jsonwebtoken";

export const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, googleId: user.googleId },
    process.env.JWT_SECRET,
    { expiresIn: "3d" }
  );
};
