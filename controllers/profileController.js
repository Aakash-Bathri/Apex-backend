import User from "../config/database.js";
import { UserStats } from "../config/UserStats.js";
import { Game } from "../config/Game.js";

export const getProfileByUsername = async (req, res) => {
    try {
        const { username } = req.params;

        // Find user by username (case-insensitive)
        const user = await User.findOne({
            name: { $regex: new RegExp(`^${username}$`, 'i') }
        }).select("name email avatar createdAt");

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const userId = user._id;

        // Get stats
        const stats = await UserStats.findOne(
            { userId: userId },
            { overall: 1, topics: 1, _id: 0 }
        ).lean();

        // Get Recent Matches (History)
        const matches = await Game.find({ "players.userId": userId })
            .sort({ endedAt: -1 })
            .limit(20)
            .populate("players.userId", "name avatar")
            .lean();

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
                    ? {
                        name: opponentInfo.userId.name,
                        avatar: opponentInfo.userId.avatar,
                    }
                    : { name: "Unknown", avatar: "" },
                result: playerInfo.result,
                ratingChange: playerInfo.ratingChange,
                topic: match.topic,
                date: match.endedAt,
            };
        });

        // Generate Rating History for Graph
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
        console.error("Profile error:", err);
        res.status(500).json({ message: "Server error" });
    }
};
