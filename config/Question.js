import mongoose from "mongoose";

const QuestionSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            required: true,
        },
        difficulty: {
            type: String,
            enum: ["EASY", "MEDIUM", "HARD"],
            required: true,
        },
        topic: {
            type: String,
            required: true,
            enum: ["DSA", "OOPS", "OS", "DBMS", "CN", "Digital", "Analog", "Signals", "COA", "C_Prog"],
        },
        category: {
            type: String,
            default: "CS", // Default main category
            required: true,
        },
        type: {
            type: String,
            enum: ["MULTIPLE_CHOICE", "CODE"],
            default: "MULTIPLE_CHOICE",
        },
        // For multiple choice questions
        options: [
            {
                text: String,
                isCorrect: Boolean,
            },
        ],
        correctAnswer: String, // The correct option text or code solution
        explanation: String, // Why this answer is correct
        timeLimit: {
            type: Number,
            default: 60, // seconds
        },
        points: {
            type: Number,
            default: 100,
        },
        tags: [String],
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

// Index for efficient filtering
QuestionSchema.index({ topic: 1, difficulty: 1, isActive: 1 });
QuestionSchema.index({ tags: 1 });

export const Question = mongoose.model("Question", QuestionSchema);
