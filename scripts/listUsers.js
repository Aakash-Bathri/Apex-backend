import mongoose from "mongoose";
import User from "../config/database.js";
import dotenv from "dotenv";

dotenv.config();

const listUsers = async () => {
    try {
        if (mongoose.connection.readyState !== 1) {
            await new Promise((resolve) => {
                if (mongoose.connection.readyState === 1) return resolve();
                mongoose.connection.once("open", resolve);
            });
        }

        const users = await User.find({}, "name email _id");
        console.log("Users in DB:");
        users.forEach(u => console.log(`${u.name} (${u.email}): ${u._id}`));

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

listUsers();
