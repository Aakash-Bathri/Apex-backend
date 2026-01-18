import { Game } from "../config/Game.js";
import { Question } from "../config/Question.js";
import { UserStats } from "../config/UserStats.js";
import { getQuestionTimeLimit } from "../utils/gameRules.js";
import mongoose from "mongoose";

/**
 * Handle Answer Submission
 */
export const handleSubmitAnswer = async (io, socket, data) => {
    const { gameId, questionId, answer } = data; // Ignore client's timeTaken
    const userId = getUserIdFromSocket(socket);

    if (!userId) return;

    try {
        // 1. Fetch Game Metadata (Non-atomic for reading state)
        // We need question details to validate answer and calculating points.
        // We can still use findById for reading, but updates must be atomic.
        // Or we can assume game state is valid and just update.
        // However, we need to know IF the answer is correct to calculate score.

        const gameRead = await Game.findById(gameId).select("status currentRoundStartTime players questions topic category");
        if (!gameRead || gameRead.status !== "IN_PROGRESS") {
            return socket.emit("error", { message: "Game not active" });
        }

        // 2. Validate Question & Calculate Server-Side Time
        const question = await Question.findById(questionId);
        if (!question) {
            return socket.emit("error", { message: "Question not found" });
        }

        const now = new Date();
        const startTime = gameRead.currentRoundStartTime || now; // Fallback
        const serverTimeTakenRaw = (now - startTime) / 1000; // seconds
        const timeLimit = getQuestionTimeLimit(question.difficulty);

        // Clamp timeTaken (can't be negative, max at limit + buffer)
        const timeTaken = Math.min(Math.max(0, serverTimeTakenRaw), timeLimit);

        // 3. Check Answer Validity
        let isCorrect = false;
        if (question.type === "MULTIPLE_CHOICE") {
            const correctOption = question.options.find(o => o.isCorrect);
            if (correctOption) {
                isCorrect = (correctOption.text || "").trim() === (answer || "").trim();
            }
        } else {
            isCorrect = question.correctAnswer === answer;
        }

        // 4. Calculate Points
        let points = 0;
        if (isCorrect) {
            const bonus = Math.max(0, ((timeLimit - timeTaken) / timeLimit) * 50);
            points = 100 + Math.round(bonus);
        } else {
            points = -20;
        }

        console.log(`[Submit] User: ${userId}, Q: ${questionId}, Valid: ${isCorrect}, Time: ${timeTaken}s, Pts: ${points}`);

        // 5. ATOMIC UPDATE
        // Use findOneAndUpdate to push answer and update score ONLY if not already answered
        const updatedGame = await Game.findOneAndUpdate(
            {
                _id: new mongoose.Types.ObjectId(gameId),
                players: {
                    $elemMatch: {
                        userId: new mongoose.Types.ObjectId(userId),
                        "answers.questionId": { $ne: new mongoose.Types.ObjectId(questionId) }
                    }
                }
            },
            {
                $inc: { "players.$.score": points },
                $push: {
                    "players.$.answers": {
                        questionId,
                        answer,
                        isCorrect,
                        timeTaken,
                        points,
                        submittedAt: now
                    }
                }
            },
            { new: true } // Return updated doc
        );

        if (!updatedGame) {
            // Either game/player not found OR already answered
            // Check if already answered to resend result
            const freshGame = await Game.findById(gameId);
            const player = freshGame.players.find(p => p.userId.toString() === userId);
            const existingAnswer = player.answers.find(a => a.questionId.toString() === questionId);

            if (existingAnswer) {
                console.log("Already answered (atomic check) - resending");
                return socket.emit("answer_result", {
                    questionId,
                    isCorrect: existingAnswer.isCorrect,
                    points: existingAnswer.points,
                    newScore: player.score
                });
            } else {
                return socket.emit("error", { message: "Update failed (Game not active or Player missing)" });
            }
        }

        // 6. Check Round Completion (using updatedGame)
        const allPlayersAnsweredCurrent = updatedGame.players.every(p =>
            p.answers.some(a => a.questionId.toString() === questionId)
        );

        if (!allPlayersAnsweredCurrent) {
            socket.emit("waiting_for_opponent", { message: "Waiting for opponent..." });
            const opponent = updatedGame.players.find(p => p.userId.toString() !== userId);
            if (opponent && opponent.socketId) {
                io.to(opponent.socketId).emit("opponent_answered", { userId });
            }
            return;
        }

        // --- ROUND COMPLETE ---

        // Prepare Round Stats
        const roundResults = updatedGame.players.map(p => {
            const ans = p.answers.find(a => a.questionId.toString() === questionId);
            return {
                userId: p.userId,
                answer: ans.answer,
                isCorrect: ans.isCorrect,
                points: ans.points,
                newScore: p.score,
                timeTaken: ans.timeTaken
            };
        });

        // Get Correct Answer Text
        let correctAnswerText = question.correctAnswer;
        if (question.type === "MULTIPLE_CHOICE") {
            const correctOpt = question.options.find(o => o.isCorrect);
            if (correctOpt) correctAnswerText = correctOpt.text;
        }

        // Emit Round Over
        io.to(gameId).emit("round_over", {
            questionId,
            correctAnswer: correctAnswerText,
            results: roundResults,
            nextRoundStartTime: new Date(Date.now() + 5000) // Expect next Q in 5s
        });

        // 7. Check Game Over or Schedule Next Round Start
        // We know round is over.
        // If there are more questions, we should PREPARE the next round start time.
        // Does client trigger next question request? Or do we Auto-Start?
        // Match.tsx waits 5s then increments index.
        // We should explicitly set currentRoundStartTime for the NEXT question now (after 5s delay?).
        // Actually, we can just set it to Date.now() + 5000 approx, or update it when the first player *requests*?
        // Better: Update it immediately to "Now + 5s" so when they start submitting for next Q, the start time is correct.

        const totalQuestions = updatedGame.questions.length;
        const p1Answers = updatedGame.players[0].answers.length;

        if (p1Answers >= totalQuestions) {
            console.log("Game Finishing...");
            await checkGameFinished(io, updatedGame);
        } else {
            // Setup next round time (approximate, since client waits 5s)
            // We set it to Now + 5s (Review Time)
            await Game.findByIdAndUpdate(gameId, {
                currentRoundStartTime: new Date(Date.now() + 5000)
            });
        }

    } catch (error) {
        console.error("Submit Answer Error:", error);
        socket.emit("error", { message: "Server error: " + error.message });
    }
};

/**
 * Check if game should finish
 */
/**
 * Check if game should finish
 */
async function checkGameFinished(io, game) {
    // We already have the 'game' object from the previous call, but to be SAFE against race conditions
    // we should re-fetch or rely on the fact that we just did an atomic update.
    // However, for setting STATUS to FINISHED, we should simply use atomic update again to ensure we don't overwrite others.

    // Instead of reading, modifying, and saving, we will:
    // 1. Fetch latest state (or rely on passed 'game' if we trust it's recent enough)
    // 2. Perform atomic set if not already finished.

    // Let's rely on the passed 'game' which came from findOneAndUpdate, so it is latest.
    const p1 = game.players[0];
    const p2 = game.players[1];

    const p1Done = p1.answers.length === game.questions.length;
    const p2Done = p2.answers.length === game.questions.length;

    if (p1Done && p2Done && game.status !== "FINISHED") {

        // Determine Winner Logic (Same as before)
        if (p1.score > p2.score) {
            p1.result = "win";
            p2.result = "loss";
        } else if (p2.score > p1.score) {
            p2.result = "win";
            p1.result = "loss";
        } else {
            p1.result = "draw";
            p2.result = "draw";
        }

        // Calc Rating Changes
        const p1Stats = await UserStats.findOne({ userId: p1.userId });
        const p2Stats = await UserStats.findOne({ userId: p2.userId });

        // Defaults
        let p1Change = 0, p2Change = 0;
        let p1NewRating = 1000, p2NewRating = 1000;

        if (p1Stats && p2Stats) {
            const elo = calculateElo(p1Stats.overall.rating, p2Stats.overall.rating, p1.result);
            p1Change = elo.p1Change;
            p2Change = elo.p2Change;
            p1NewRating = p1Stats.overall.rating + p1Change;
            p2NewRating = p2Stats.overall.rating + p2Change;

            // Update DB stats
            await updateUserStats(p1Stats, p1.result, p1Change, game.topic);
            await updateUserStats(p2Stats, p2.result, p2Change, game.topic);
        }

        // Atomic Update of Game Result
        // We construct the update object dynamically
        // Note: mongoose maps might be tricky, but players array is fixed index.
        const finalizedGame = await Game.findByIdAndUpdate(
            game._id,
            {
                $set: {
                    status: "FINISHED",
                    endTime: new Date(),
                    "players.0.result": p1.result,
                    "players.0.ratingChange": p1Change,
                    "players.0.newRating": p1NewRating,
                    "players.1.result": p2.result,
                    "players.1.ratingChange": p2Change,
                    "players.1.newRating": p2NewRating
                }
            },
            { new: true }
        );

        io.to(game._id.toString()).emit("game_over", {
            gameId: game._id.toString(),
            winnerId: p1.result === "win" ? p1.userId : (p2.result === "win" ? p2.userId : null),
            results: {
                [p1.userId]: { score: p1.score, result: p1.result },
                [p2.userId]: { score: p2.score, result: p2.result }
            }
        });

        console.log(`Game Finished: ${game._id}`);
    }
}

/**
 * Handle Game Sync (Reconnection/Refresh)
 */
export const handleGameSync = async (io, socket, data) => {
    const { gameId } = data;
    const userId = getUserIdFromSocket(socket);

    if (!userId || !gameId) return;

    try {
        const game = await Game.findById(gameId)
            .populate("players.userId", "name avatar")
            .populate({
                path: "questions.questionId",
                select: "description options type difficulty timeLimit"
            });

        if (!game || game.status !== "IN_PROGRESS") {
            return socket.emit("error", { message: "Game not found or finished" });
        }

        const player = game.players.find(p => p.userId._id.toString() === userId);
        if (!player) return;

        // Re-join the socket room
        socket.join(gameId);

        // Determine sync state
        const currentIndex = player.answers.length;
        // Check if finished
        if (currentIndex >= game.questions.length) {
            return; // Or emit game over state if needed
        }

        // Send Sync Event
        socket.emit("game_sync", {
            gameId: game._id,
            status: game.status,
            currentQuestionIndex: currentIndex,
            currentRoundStartTime: game.currentRoundStartTime,
            players: game.players.map(p => ({
                userId: p.userId._id,
                name: p.userId.name,
                avatar: p.userId.avatar,
                score: p.score
            })),
            // Send questions minimal info if needed, or rely on client having them
            // Client usually fetches game details on load, so we just need to set the index and time.
            questions: game.questions // Pass full questions including timeLimit overrides
        });

        console.log(`Synced User ${userId} to Game ${gameId} at Index ${currentIndex}`);

    } catch (error) {
        console.error("Game Sync Error:", error);
    }
};

// Helper to extract user ID from socket (needs middleware/tracking)
function getUserIdFromSocket(socket) {
    // Ideally socket.handshake.auth.token -> decode -> userId
    // Or we stored it in socket object during connection/join
    return socket.userId; // We need to set this!
}

// Elo Helper
function calculateElo(rating1, rating2, result1) {
    const K = 32;
    const expected1 = 1 / (1 + Math.pow(10, (rating2 - rating1) / 400));

    let actual1 = 0.5; // Draw
    if (result1 === "win") actual1 = 1;
    else if (result1 === "loss") actual1 = 0;

    const change1 = Math.round(K * (actual1 - expected1));
    // Zero-sum in 1v1 usually, but let's calculate symmetric
    // In strict Elo, change2 = -change1. 
    // Let's rely on symmetry for standard Elo.

    return {
        p1Change: change1,
        p2Change: -change1
    };
}

// Stats Update Helper
async function updateUserStats(stats, result, ratingChange, topic) {
    stats.overall.gamesPlayed += 1;
    stats.overall.rating += ratingChange;

    if (result === "win") stats.overall.wins += 1;
    else if (result === "loss") stats.overall.losses += 1;

    // Topic Stats (Optional safety check if topic exists in schema keys)
    if (topic && stats.topics && stats.topics[topic]) {
        stats.topics[topic].rating = (stats.topics[topic].rating || 1000) + ratingChange;
    }

    await stats.save();
}
