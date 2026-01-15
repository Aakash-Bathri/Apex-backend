import User from "../config/database.js";
import { UserStats } from "../config/UserStats.js";
import { Game } from "../config/Game.js";

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
      { overall: 1, topics: 1, _id: 0 }
    ).lean();

    // Get Recent Matches (History)
    console.log(`Fetching matches for user: ${userId}`);
    const matches = await Game.find({ "players.userId": userId })
      .sort({ endedAt: -1 })
      .limit(20)
      .populate("players.userId", "name avatar") // basic info of opponent
      .lean();
    console.log(`Found ${matches.length} matches`);

    // Format matches for frontend
    const formattedMatches = matches.map((match) => {
      const playerInfo = match.players.find(
        (p) => p.userId._id.toString() === userId.toString()
      );
      const opponentInfo = match.players.find(
        (p) => p.userId._id.toString() !== userId.toString()
      );

      return {
        id: match._id,
        opponent: opponentInfo
          ? { name: opponentInfo.userId.name, avatar: opponentInfo.userId.avatar }
          : { name: "Unknown", avatar: "" },
        result: playerInfo.result,
        ratingChange: playerInfo.ratingChange,
        topic: match.topic,
        date: match.endedAt,
      };
    });

    // Generate Rating History for Graph
    // (This is a simplified approach: we take the 'newRating' from each game)
    // We reverse it to be chronological for the graph
    const ratingHistory = matches
      .map((match) => {
        const playerInfo = match.players.find(
          (p) => p.userId._id.toString() === userId.toString()
        );
        return {
          date: match.endedAt,
          rating: playerInfo.newRating,
        };
      })
      .reverse();

    return res.json({
      user,
      stats,
      matches: formattedMatches,
      ratingHistory,
    });
  } catch (err) {
    console.error("Dashboard error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
