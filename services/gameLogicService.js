import { Game } from "../config/Game.js";
import { Question } from "../config/Question.js";
import { UserStats } from "../config/UserStats.js";

/**
 * Handle Answer Submission
 */
export const handleSubmitAnswer = async (io, socket, data) => {
    const { gameId, questionId, answer, timeTaken } = data; // answer: index or text
    const userId = getUserIdFromSocket(socket); // Need a way to map socket to user

    if (!userId) return; // Should not happen if auth middleware works or we track mapping

    try {
        console.log(`Submit Answer: Game ${gameId}, User ${userId}, Q: ${questionId}, Ans: ${answer}`);
        const game = await Game.findById(gameId);
        if (!game || game.status !== "IN_PROGRESS") {
            console.log("Game invalid or not in progress");
            return socket.emit("error", { message: "Game not active" });
        }

        const player = game.players.find(p => p.userId.toString() === userId);
        if (!player) {
            console.log("Player not found in game");
            return socket.emit("error", { message: "Player not found" });
        }

        // Check if already answered
        const existingAnswer = player.answers.find(a => a.questionId.toString() === questionId);
        if (existingAnswer) {
            console.log("Already answered - resending result");
            // Re-emit the result so frontend can recover if it missed the first packet
            // We need to calculate points again or store them? 
            // We stored score, but not per-question points in the array (only total score updated).
            // But we stored isCorrect. We can roughly estimate points or just send isCorrect + current total score.
            // Currently frontend uses points for display, newScore for state.

            // Re-calculate points roughly or just send what stored?
            // We stored: answer, isCorrect, timeTaken.
            // Let's re-calculate points for consistency in display
            let points = 0;
            if (existingAnswer.isCorrect) {
                const question = await Question.findById(questionId);
                const timeLimit = question.timeLimit || 60;
                const bonus = Math.max(0, ((timeLimit - existingAnswer.timeTaken) / timeLimit) * 50);
                points = 100 + Math.round(bonus);
            } else {
                points = -20;
            }

            return socket.emit("answer_result", {
                questionId,
                isCorrect: existingAnswer.isCorrect,
                points,
                newScore: player.score // Current total score
            });
        }

        // Validate Answer
        const question = await Question.findById(questionId);
        if (!question) {
            console.log("Question not found in DB");
            return socket.emit("error", { message: "Question not found" });
        }

        let isCorrect = false;

        if (question.type === "MULTIPLE_CHOICE") {
            const correctOption = question.options.find(o => o.isCorrect);
            if (!correctOption) {
                console.error(`Question ${questionId} has no correct option!`);
                // Fallback or error?
                isCorrect = false;
            } else {
                // Compare trimmed strings to be safe
                isCorrect = (correctOption.text || "").trim() === (answer || "").trim();
            }
        } else {
            isCorrect = question.correctAnswer === answer;
        }

        console.log(`Answer Validated: ${isCorrect} (Expected: ${question.correctAnswer || "Check Options"}, Got: ${answer})`);

        // Calculate Score
        // Base 100 + Time Bonus (up to 50)
        let points = 0;
        if (isCorrect) {
            const timeLimit = question.timeLimit || 60;
            const bonus = Math.max(0, ((timeLimit - timeTaken) / timeLimit) * 50);
            points = 100 + Math.round(bonus);
        } else {
            points = -20; // Penalty
        }

        // Update State
        player.score += points;
        player.answers.push({
            questionId,
            answer,
            isCorrect,
            timeTaken,
            submittedAt: new Date()
        });

        await game.save();

        // Notify Player of Result (Personal)
        socket.emit("answer_result", {
            questionId,
            isCorrect,
            points,
            newScore: player.score
        });

        // Notify Opponent of Progress (Blind)
        const opponent = game.players.find(p => p.userId.toString() !== userId);
        if (opponent && opponent.socketId) {
            io.to(opponent.socketId).emit("opponent_progress", {
                userId,
                score: player.score, // Maybe hide score? Or show it? Competitive usually shows score.
                questionIndex: player.answers.length // simplified progress
            });
        }

        // Check Game Completion
        const allAnswered = player.answers.length === game.questions.length;
        if (allAnswered) {
            socket.emit("player_finished", { message: "Waiting for opponent..." });
            checkGameFinished(io, game);
        }

    } catch (error) {
        console.error("Submit Answer Error:", error);
        socket.emit("error", { message: "Server error processing answer: " + error.message });
    }
};

/**
 * Check if game should finish
 */
async function checkGameFinished(io, game) {
    const p1 = game.players[0];
    const p2 = game.players[1];

    const p1Done = p1.answers.length === game.questions.length;
    const p2Done = p2.answers.length === game.questions.length;

    if (p1Done && p2Done) {
        game.status = "FINISHED";
        game.endTime = new Date();

        // Determine Winner
        if (p1.score > p2.score) {
            p1.result = "win";
            p2.result = "loss";
        } else if (p2.score > p1.score) {
            p2.result = "win";
            p1.result = "loss";
        } else {
            // Tie breaker: Total time taken?
            // For now, draw
            p1.result = "draw";
            p2.result = "draw";
        }

        // Calc Rating Changes
        const p1Stats = await UserStats.findOne({ userId: p1.userId });
        const p2Stats = await UserStats.findOne({ userId: p2.userId });

        if (p1Stats && p2Stats) {
            const p1Rating = p1Stats.overall.rating;
            const p2Rating = p2Stats.overall.rating;

            // Elo Calculation
            const { p1Change, p2Change } = calculateElo(p1Rating, p2Rating, p1.result);

            p1.ratingChange = p1Change;
            p1.newRating = p1Rating + p1Change;

            p2.ratingChange = p2Change;
            p2.newRating = p2Rating + p2Change;

            // Update DB stats
            await updateUserStats(p1Stats, p1.result, p1Change, game.topic);
            await updateUserStats(p2Stats, p2.result, p2Change, game.topic);
        } else {
            // Fallback if stats missing (shouldn't happen)
            p1.ratingChange = 0; p1.newRating = 1000;
            p2.ratingChange = 0; p2.newRating = 1000;
        }

        await game.save();

        io.to(game._id.toString()).emit("game_over", {
            gameId: game._id.toString(), // Fix: Ensure string ID
            winnerId: p1.result === "win" ? p1.userId : (p2.result === "win" ? p2.userId : null),
            results: {
                [p1.userId]: { score: p1.score, result: p1.result },
                [p2.userId]: { score: p2.score, result: p2.result }
            }
        });

        console.log(`Game Finished: ${game._id}`);
    }
}

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
