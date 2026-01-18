import mongoose from "mongoose";

const GameSchema = new mongoose.Schema(
    {
        type: {
            type: String,
            enum: ["PUBLIC", "PRIVATE"],
            required: true,
        },
        status: {
            type: String,
            enum: ["WAITING", "IN_PROGRESS", "FINISHED", "ABORTED"],
            default: "WAITING",
        },
        code: {
            type: String, // For private games
            sparse: true,
        },
        players: [
            {
                userId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "User",
                    required: true,
                },
                socketId: {
                    type: String, // To track active connection
                },
                score: {
                    type: Number,
                    default: 0,
                },
                answers: [
                    {
                        questionId: {
                            type: mongoose.Schema.Types.ObjectId,
                            ref: "Question",
                        },
                        answer: String,
                        isCorrect: Boolean,
                        timeTaken: Number, // In seconds
                        submittedAt: {
                            type: Date,
                            default: Date.now,
                        },
                        points: {
                            type: Number,
                            default: 0
                        }
                    }
                ],
                result: {
                    type: String, // "win", "loss", "draw"
                    enum: ["win", "loss", "draw", null],
                    default: null
                },
                ratingChange: {
                    type: Number,
                    default: 0
                },
                newRating: {
                    type: Number
                }
            }
        ],
        topic: {
            type: String,
            required: true,
        },
        category: {
            type: String,
            default: "CS",
            required: true,
        },
        questions: [
            {
                questionId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Question",
                },
                timeLimit: Number, // Persist dynamic limit (15/20/25)
            }
        ],
        currentRoundStartTime: { type: Date, default: Date.now },
        startTime: Date,
        endTime: Date,
        abortReason: String,
    },
    {
        timestamps: true,
    }
);

// Indexes
GameSchema.index({ status: 1 });
GameSchema.index({ "players.userId": 1 });
GameSchema.index({ code: 1 }); // For finding private games

export const Game = mongoose.model("Game", GameSchema);
