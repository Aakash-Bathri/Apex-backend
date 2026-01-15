import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { Game } from "../config/Game.js";

const router = express.Router();

/**
 * Get Game Details (Result/Summary)
 */
router.get("/:gameId", requireAuth, async (req, res) => {
    try {
        const { gameId } = req.params;
        console.log("DEBUG: GET Game API called for:", gameId);
        const game = await Game.findById(gameId)
            .populate("players.userId", "name avatar")
            .populate("questions.questionId", "title description options type timeLimit");

        if (!game) {
            console.log("DEBUG: Game not found for ID:", gameId);
            return res.status(404).json({ message: "Game not found" });
        }

        console.log("DEBUG: Game found, returning:", game._id);

        // Ideally strip sensitive info (correctAnswer) if game IN_PROGRESS
        // But for finished games, or if careful, send what is needed.
        // For now send full game but maybe sanitize answers?
        // Question schema fields select: false for correctAnswer helps here?
        // We defined correctAnswer in Question schema but didn't put select: false explicitly.
        // We should handle that in query or manual transform.

        res.json(game);
    } catch (error) {
        console.error("Get Game Error:", error);
        res.status(500).json({ message: "Failed to fetch game" });
    }
});

export default router;
