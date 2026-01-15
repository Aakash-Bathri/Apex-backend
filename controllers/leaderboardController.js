import User from "../config/database.js";
import { UserStats } from "../config/UserStats.js";
import { Game } from "../config/Game.js";

export const getLeaderboard = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 50,
            timeframe = "all-time", // all-time, monthly, weekly
            filter = "global", // global, friends (friends not implemented yet)
            search = "",
        } = req.query;

        const userId = req.user?.id; // May be undefined if not logged in
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        // Build time filter for games
        let dateFilter = {};
        const now = new Date();
        if (timeframe === "weekly") {
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            dateFilter = { createdAt: { $gte: weekAgo } };
        } else if (timeframe === "monthly") {
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            dateFilter = { createdAt: { $gte: monthAgo } };
        }

        // For time-filtered leaderboards, we need to recalculate ratings from games
        // For simplicity, we'll just use overall ratings for "all-time"
        // For weekly/monthly, we'll filter users who played in that period
        let query = {};

        if (timeframe !== "all-time") {
            // Find users who played games in the timeframe
            const recentGames = await Game.find(dateFilter).distinct("players.userId");
            query.userId = { $in: recentGames };
        }

        // Search by username
        if (search) {
            const users = await User.find({
                name: { $regex: search, $options: "i" },
            }).select("_id");
            const userIds = users.map((u) => u._id);
            query.userId = query.userId
                ? { $in: query.userId.$in.filter((id) => userIds.some((uid) => uid.equals(id))) }
                : { $in: userIds };
        }

        // Get total count
        const totalCount = await UserStats.countDocuments(query);

        // Fetch leaderboard data
        const leaderboardData = await UserStats.find(query)
            .sort({ "overall.rating": -1 })
            .skip(skip)
            .limit(limitNum)
            .populate("userId", "name avatar")
            .lean();

        // Format data
        const formattedData = leaderboardData.map((entry, index) => {
            const globalRank = skip + index + 1;
            const stats = entry.overall || {};
            const totalGames = (stats.wins || 0) + (stats.losses || 0);
            const winRate = totalGames > 0 ? Math.round(((stats.wins || 0) / totalGames) * 100) : 0;

            return {
                rank: globalRank,
                userId: entry.userId._id,
                username: entry.userId.name,
                avatar: entry.userId.avatar,
                rating: stats.rating || 0,
                games: totalGames,
                winRate: winRate,
                isCurrentUser: userId ? entry.userId._id.toString() === userId.toString() : false,
            };
        });

        // Find current user's position if not in the current page
        let userPosition = null;
        if (userId) {
            const userInPage = formattedData.find((entry) => entry.isCurrentUser);
            if (!userInPage) {
                // Find user's rank
                const userStats = await UserStats.findOne({ userId }).populate("userId", "name avatar").lean();
                if (userStats) {
                    const higherRankedCount = await UserStats.countDocuments({
                        ...query,
                        "overall.rating": { $gt: userStats.overall?.rating || 0 },
                    });
                    const userRank = higherRankedCount + 1;
                    const totalGames = (userStats.overall?.wins || 0) + (userStats.overall?.losses || 0);
                    const winRate = totalGames > 0 ? Math.round(((userStats.overall?.wins || 0) / totalGames) * 100) : 0;

                    userPosition = {
                        rank: userRank,
                        userId: userStats.userId._id,
                        username: userStats.userId.name,
                        avatar: userStats.userId.avatar,
                        rating: userStats.overall?.rating || 0,
                        games: totalGames,
                        winRate: winRate,
                    };
                }
            }
        }

        return res.json({
            leaderboard: formattedData,
            pagination: {
                currentPage: pageNum,
                totalPages: Math.ceil(totalCount / limitNum),
                totalItems: totalCount,
                itemsPerPage: limitNum,
            },
            userPosition,
            filters: {
                timeframe,
                filter,
            },
        });
    } catch (err) {
        console.error("Leaderboard error:", err);
        res.status(500).json({ message: "Server error" });
    }
};
