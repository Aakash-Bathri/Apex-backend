import mongoose from "mongoose";
import { Game } from "../config/Game.js";
import User from "../config/database.js";

mongoose.connect("mongodb://localhost:27017/passport-google")
    .then(async () => {
        console.log("Connected to DB...");

        try {
            // emulate request user (take the ID of the first player in the last game)
            const lastGame = await Game.findOne().sort({ createdAt: -1 });
            if (!lastGame) throw new Error("No games found");

            const userId = lastGame.players[0].userId; // This is an ObjectId
            console.log(`Testing dashboard for User ID: ${userId.toString()}`);

            // Logic from dashboardController.js
            const matches = await Game.find({
                "players.userId": userId,
                status: "FINISHED"
            })
                .sort({ endTime: -1 })
                .limit(5)
                .populate("players.userId", "name avatar")
                .lean(); // LEAN IS IMPORTANT

            console.log(`Found ${matches.length} matches`);

            const formattedMatches = matches.map((match) => {
                // Log raw structure for first match
                if (match === matches[0]) {
                    console.log("First Match Players (Raw):");
                    console.log(JSON.stringify(match.players, null, 2));
                }

                const playerInfo = match.players.find((p) => {
                    return (
                        p.userId &&
                        p.userId._id &&
                        p.userId._id.toString() === userId.toString()
                    );
                });

                const opponentInfo = match.players.find((p) => {
                    return (
                        p.userId &&
                        p.userId._id &&
                        p.userId._id.toString() !== userId.toString()
                    );
                });

                if (!opponentInfo) {
                    console.log("  -> Opponent NOT found via logic!");
                } else {
                    console.log(`  -> Opponent found: ${opponentInfo.userId.name}`);
                }

                return {
                    id: match._id,
                    opponent: opponentInfo && opponentInfo.userId
                        ? {
                            name: opponentInfo.userId.name || "Unknown",
                            avatar: opponentInfo.userId.avatar || "",
                        }
                        : { name: "Unknown", avatar: "" },
                };
            });

            console.log("\nFormatted Result:", formattedMatches);

        } catch (err) {
            console.error("Test Error:", err);
        } finally {
            mongoose.disconnect();
        }
    });
