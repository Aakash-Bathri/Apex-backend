import mongoose from "mongoose";
import { Game } from "../config/Game.js";
import User from "../config/database.js";
import { UserStats } from "../config/UserStats.js";
import dotenv from "dotenv";

dotenv.config();

const seedGames = async () => {
    try {
        // 1. Wait for DB Connection
        if (mongoose.connection.readyState !== 1) {
            console.log("Waiting for DB connection...");
            await new Promise((resolve) => {
                if (mongoose.connection.readyState === 1) return resolve();
                mongoose.connection.once("open", resolve);
            });
        }
        console.log("Connected to MongoDB.");

        // 2. Get All Users
        const users = await User.find();
        if (users.length === 0) {
            console.log("No users found to seed.");
            process.exit(1);
        }
        console.log(`Found ${users.length} users. Seeding for all...`);

        const TOPICS = ["DSA", "OOPS", "OS", "DBMS", "CN"];

        for (const user of users) {
            const userId = user._id;
            console.log(`Processing user: ${user.name} (${userId})`);

            // 3. Clear existing games for this user
            await Game.deleteMany({ "players.userId": userId });

            // 4. Create Dummy History (Last 20 days)
            const games = [];
            let currentOverallRating = 1000;

            // Track ratings for each topic independently
            const topicRatings = {
                DSA: 1000,
                OOPS: 1000,
                OS: 1000,
                DBMS: 1000,
                CN: 1000
            };

            const now = new Date();

            for (let i = 20; i >= 0; i--) {
                const isWin = Math.random() > 0.4;
                const ratingChange = isWin ? Math.floor(Math.random() * 20) + 10 : -1 * (Math.floor(Math.random() * 20) + 10);

                // Randomly pick a topic for this game
                const topic = TOPICS[Math.floor(Math.random() * TOPICS.length)];

                // Update Ratings
                currentOverallRating += ratingChange;
                topicRatings[topic] += ratingChange;

                const date = new Date(now);
                date.setDate(date.getDate() - i);

                games.push({
                    players: [
                        {
                            userId: userId,
                            score: Math.floor(Math.random() * 100),
                            result: isWin ? "win" : "loss",
                            ratingChange: ratingChange,
                            newRating: currentOverallRating
                        },
                    ],
                    topic: topic,
                    status: "completed",
                    startedAt: date,
                    endedAt: date
                });
            }

            await Game.insertMany(games);

            // 5. Update UserStats (Overall + Topics)
            const updatePayload = {
                "overall.rating": currentOverallRating,
                "overall.wins": games.filter(g => g.players[0].result === "win").length,
                "overall.losses": games.filter(g => g.players[0].result === "loss").length,
                "overall.gamesPlayed": games.length
            };

            // Add topic specific updates to payload
            TOPICS.forEach(t => {
                updatePayload[`topics.${t}.rating`] = topicRatings[t];
            });

            await UserStats.findOneAndUpdate(
                { userId: userId },
                updatePayload,
                { upsert: true, new: true }
            );

            console.log(`  -> Seeded ${games.length} matches.`);
            console.log(`     Overall Rating: ${currentOverallRating}`);
            console.log(`     Topic Ratings: ${JSON.stringify(topicRatings)}`);
        }

        console.log("Done seeding all users.");
        process.exit(0);
    } catch (error) {
        console.error("Seeding error:", error);
        process.exit(1);
    }
};

seedGames();
