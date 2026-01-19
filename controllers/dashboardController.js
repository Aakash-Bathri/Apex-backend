import User from "../config/database.js";
import { UserStats } from "../config/UserStats.js";
import { Game } from "../config/Game.js";
import { getOnlineUserCount } from "../services/socketService.js";

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

    // Get Active Stats
    const onlineUsers = getOnlineUserCount();

    // Filter out "ghost" games that are stuck in IN_PROGRESS but haven't been updated in 1 hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const activeGamesCount = await Game.countDocuments({
      status: "IN_PROGRESS",
      updatedAt: { $gte: oneHourAgo }
    });
    const activePlayers = activeGamesCount * 2; // Approximation

    // Fetch Top 3 Leaderboard
    const leaderboard = await UserStats.find({})
      .sort({ "overall.rating": -1 })
      .limit(3)
      .populate("userId", "name avatar")
      .lean()
      .then((users) =>
        users.map((u, i) => ({
          rank: i + 1,
          userId: u.userId._id,
          username: u.userId.name,
          avatar: u.userId.avatar,
          rating: u.overall.rating || 0,
        }))
      );

    // Get Recent Matches (History)
    // Only fetch FINISHED matches to ensure valid opponent data
    const matches = await Game.find({
      "players.userId": userId,
      status: "FINISHED",
    })
      .sort({ endTime: -1 }) // Fixed: sort by endTime as endedAt doesn't exist
      .limit(20)
      .populate("players.userId", "name avatar") // basic info of opponent
      .lean();
    console.log(`Found ${matches.length} matches`);

    // Format matches for frontend
    const formattedMatches = matches.map((match) => {
      // Safe find for self
      const playerInfo = match.players.find((p) => {
        return (
          p.userId &&
          p.userId._id &&
          p.userId._id.toString() === userId.toString()
        );
      });

      // Safe find for opponent (anyone who is NOT me)
      const opponentInfo = match.players.find((p) => {
        return (
          p.userId &&
          p.userId._id &&
          p.userId._id.toString() !== userId.toString()
        );
      });

      // Debug log for troubleshooting "Unknown" issue
      if (!opponentInfo) {
        // console.log(
        //   `[Dashboard] Match ${match._id}: Opponent missing. Players:`,
        //   match.players.map((p) => ({
        //     id: p.userId ? p.userId._id : "null",
        //     name: p.userId ? p.userId.name : "null",
        //   }))
        // );
      }

      // If for some reason playerInfo is missing (shouldn't happen if query used userId), skip or handle
      if (!playerInfo) return null;

      return {
        id: match._id,
        opponent: opponentInfo && opponentInfo.userId
          ? {
            name: opponentInfo.userId.name || "Unknown",
            avatar: opponentInfo.userId.avatar || "",
          }
          : { name: "Unknown", avatar: "" },
        result: playerInfo.result,
        ratingChange: playerInfo.ratingChange,
        topic: `CS-${match.topic === "RANDOM" ? "ALL" : match.topic}`,
        date: match.endTime, // Fixed: use endTime instead of endedAt
      };
    }).filter(match => match !== null);

    // Generate Rating History for Graph
    // (This is a simplified approach: we take the 'newRating' from each game)
    // We reverse it to be chronological for the graph
    const ratingHistory = matches
      .map((match) => {
        const playerInfo = match.players.find(
          (p) => p.userId._id.toString() === userId.toString()
        );
        return {
          date: match.endTime, // Fixed: use endTime
          rating: playerInfo.newRating,
        };
      })
      .reverse();

    return res.json({
      user,
      stats,
      onlineUsers,
      activePlayers,
      matches: formattedMatches,
      ratingHistory,
      leaderboard,
    });
  } catch (err) {
    console.error("Dashboard error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
