import mongoose from "mongoose";
import { Game } from "../config/Game.js";
import User from "../config/database.js";

// Connect to DB (copy from database.js but manually here)
mongoose.connect("mongodb://localhost:27017/passport-google")
    .then(async () => {
        console.log("Connected to DB for debugging...");

        try {
            const games = await Game.find().sort({ createdAt: -1 }).limit(5).lean();
            console.log(`Found ${games.length} recent games.`);

            for (const game of games) {
                console.log(`\nGame ID: ${game._id} (Status: ${game.status})`);
                console.log(`Created At: ${game.createdAt}`);

                for (const player of game.players) {
                    const userId = player.userId;
                    const idString = userId ? userId.toString() : "null";
                    console.log(`  - Player userId: ${idString} (Type: ${typeof userId})`);

                    if (userId) {
                        const user = await User.findById(userId);
                        if (user) {
                            console.log(`    -> User FOUND: ${user.name} (${user.email})`);
                        } else {
                            console.log(`    -> User NOT FOUND!`);
                        }
                    } else {
                        console.log(`    -> User ID is missing!`);
                    }
                }
            }
        } catch (err) {
            console.error("Debug Error:", err);
        } finally {
            mongoose.disconnect();
        }
    })
    .catch(err => console.error("DB Connection Error:", err));
