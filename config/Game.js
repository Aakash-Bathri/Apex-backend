import mongoose from "mongoose";

const GameSchema = new mongoose.Schema(
    {
        players: [
            {
                userId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "User",
                    required: true,
                },
                score: { type: Number, default: 0 },
                result: {
                    type: String,
                    enum: ["win", "loss", "draw"],
                    required: true,
                },
                ratingChange: { type: Number, required: true },
                newRating: { type: Number, required: true },
            },
        ],
        topic: {
            type: String,
            required: true,
            enum: ["DSA", "OOPS", "OS", "DBMS", "CN"],
        },
        status: {
            type: String,
            enum: ["active", "completed", "aborted"],
            default: "completed",
        },
        startedAt: { type: Date, default: Date.now },
        endedAt: { type: Date, default: Date.now },
    },
    {
        timestamps: true,
    }
);

// Index for fetching user's game history efficiently
GameSchema.index({ "players.userId": 1, endedAt: -1 });

export const Game = mongoose.model("Game", GameSchema);
