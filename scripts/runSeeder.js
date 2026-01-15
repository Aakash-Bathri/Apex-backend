import mongoose from "mongoose";
import seedQuestions from "./seedQuestions.js";

async function run() {
    try {
        await mongoose.connect("mongodb://localhost:27017/passport-google");
        console.log("Connected to MongoDB for seeding");

        await seedQuestions();

        console.log("Seeding complete. Closing connection.");
        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error("Seeding failed:", error);
        process.exit(1);
    }
}

run();
