import User from "../config/database.js";
import { UserStats } from "../config/UserStats.js";

export const getDashboard = async (req, res) => {
  try {
    const userId = req.user.id; // from auth middleware

    // Get user info
    const user = await User.findById(userId).select(
      "name email avatar createdAt"
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get stats
    const stats = await UserStats.findOne(
      { userId: userId },
      { overall: 1, _id: 0 }
    ).lean();
    // console.log("stats: ", stats);

    return res.json({
      user,
      stats,
    });
  } catch (err) {
    console.error("Dashboard error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
