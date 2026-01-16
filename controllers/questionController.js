import { Question } from "../config/Question.js";

// List Questions (filteable)
export const getQuestions = async (req, res) => {
    try {
        const { topic, difficulty, isActive } = req.query;
        const filter = {};

        if (topic) filter.topic = topic;
        if (difficulty) filter.difficulty = difficulty;
        if (isActive !== undefined) filter.isActive = isActive === "true";

        const questions = await Question.find(filter).sort({ createdAt: -1 });
        res.json(questions);
    } catch (err) {
        res.status(500).json({ message: "Error fetching questions" });
    }
};

// Create Single Question
export const createQuestion = async (req, res) => {
    try {
        // Validate basics (schema does most work)
        const question = await Question.create(req.body);
        res.status(201).json(question);
    } catch (err) {
        res.status(400).json({ message: "Error creating question", error: err.message });
    }
};

// Bulk Create
export const bulkCreateQuestions = async (req, res) => {
    try {
        const questions = req.body; // Expecting array
        if (!Array.isArray(questions)) {
            return res.status(400).json({ message: "Input must be an array" });
        }

        const created = await Question.insertMany(questions);
        res.status(201).json({ message: `Created ${created.length} questions`, count: created.length });
    } catch (err) {
        console.error("Bulk Upload Error:", err);
        res.status(400).json({ message: "Error in bulk upload", error: err.message });
    }
};

// Toggle Active Status (Deactivate mostly)
export const updateQuestionStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { isActive } = req.body;

        const question = await Question.findByIdAndUpdate(
            id,
            { isActive },
            { new: true }
        );

        if (!question) return res.status(404).json({ message: "Question not found" });
        res.json(question);
    } catch (err) {
        res.status(500).json({ message: "Error updating question" });
    }
};
