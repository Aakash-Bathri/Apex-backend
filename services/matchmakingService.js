import { Game } from "../config/Game.js";
import { Question } from "../config/Question.js";
import crypto from "crypto";

import { connectedUsers } from "./socketService.js";

// In-memory queue: { userId, socketId, rating, topic, joinedAt }
const publicQueue = [];

/**
 * Handle Disconnect
 */
export const handleDisconnect = (socket) => {
    // Remove from public queue if exists
    const index = publicQueue.findIndex(p => p.socketId === socket.id);
    if (index !== -1) {
        console.log(`Removed user ${publicQueue[index].userId} from queue (disconnect)`);
        publicQueue.splice(index, 1);
    }
};

/**
 * Join the public matchmaking queue
 */
/**
 * Join the public matchmaking queue
 */
export const handleJoinQueue = async (io, socket, data) => {
    const { userId, rating, topic, category = "CS" } = data; // topic could be 'RANDOM'

    // Check if I am already in queue (by userId) and update socketId if so
    const existingIndex = publicQueue.findIndex(p => p.userId === userId);
    if (existingIndex !== -1) {
        publicQueue.splice(existingIndex, 1); // Remove old entry
    }

    console.log(`User ${userId} joined queue for ${topic}`);

    // Try to find a match immediately
    const matchIndex = publicQueue.findIndex(p => {
        // Simple matching logic: same topic or random, same category
        // Also ensure we aren't matching with ourselves
        return (p.category === category) && (p.topic === topic || topic === "RANDOM" || p.topic === "RANDOM") && p.userId !== userId;
    });

    if (matchIndex !== -1) {
        // Match found!
        const opponent = publicQueue.splice(matchIndex, 1)[0];

        // Verify opponent socket is still active
        const opponentSocketId = connectedUsers.get(opponent.userId);

        if (!opponentSocketId) {
            // Opponent disconnected while in queue?
            console.log("Opponent missing, requeuing...");
            // Add myself to queue
            publicQueue.push({ userId, socketId: socket.id, rating, topic, joinedAt: Date.now() });
            socket.emit("queue_joined", { message: "Waiting for opponent..." });
            return;
        }

        await createGameSession(io, [
            { userId: userId, socketId: socket.id },
            { userId: opponent.userId, socketId: opponentSocketId }
        ], topic === "RANDOM" ? opponent.topic : topic, category);
    } else {
        // No match, add to queue
        publicQueue.push({ userId, socketId: socket.id, rating, topic, category, joinedAt: Date.now() });
        socket.emit("queue_joined", { message: "Waiting for opponent..." });
    }
};

/**
 * Create a private game room
 */
export const handleCreatePrivate = async (io, socket, data) => {
    const { userId, topic } = data;
    const code = crypto.randomBytes(3).toString("hex").toUpperCase(); // 6 chars

    try {
        const game = await Game.create({
            type: "PRIVATE",
            status: "WAITING",
            code: code,
            players: [{ userId: userId, socketId: socket.id }],
            topic: topic || "DSA",
            category: data.category || "CS",
        });

        socket.join(game._id.toString());
        socket.emit("private_created", { gameId: game._id.toString(), code: game.code });
        console.log(`Private game created: ${code}`);
    } catch (error) {
        console.error("Create Private Error:", error);
        socket.emit("error", { message: "Failed to create room" });
    }
};

/**
 * Join a private game room
 */
/**
 * Join a private game room
 */
export const handleJoinPrivate = async (io, socket, data) => {
    const { userId, code } = data;

    try {
        const game = await Game.findOne({ code: code, status: "WAITING" });

        if (!game) {
            return socket.emit("error", { message: "Invalid or expired code" });
        }

        // Check if already joined
        if (game.players.some(p => p.userId.toString() === userId)) {
            return socket.emit("error", { message: "You are already in this game" });
        }

        // Start Game!

        // 1. Get Creator Info
        const creatorPlayer = game.players[0]; // Assuming creator is first
        const creatorUserId = creatorPlayer.userId.toString();

        // 2. Check if Creator is still online
        const creatorSocketId = connectedUsers.get(creatorUserId);

        if (!creatorSocketId) {
            // Creator disconnected? 
            // We could either error out, or allow join and wait for creator to reconnect?
            // For now, let's allow join but maybe warn or just proceed. 
            // If we proceed, creator needs to handle reconnection flow on dashboard.
            // Updating socketId just in case they reconnected with new socket
        } else {
            // Update Creator Socket ID in DB (or just use it for emission)
            // Ideally we update the DB record too so we have fresh socketId
            creatorPlayer.socketId = creatorSocketId;
        }

        // Add joining player
        game.players.push({ userId, socketId: socket.id });
        game.status = "IN_PROGRESS"; // Auto-start
        game.startTime = new Date();

        // Select Questions
        const questions = await selectQuestions(game.topic, game.category);
        game.questions = questions.map(q => ({ questionId: q._id }));

        await game.save();

        const gameId = game._id.toString();

        // Make sure both players are joined to the room
        socket.join(gameId); // Joiner

        if (creatorSocketId) {
            const creatorSocket = io.sockets.sockets.get(creatorSocketId);
            if (creatorSocket) {
                creatorSocket.join(gameId);
            }
        }

        // Emit Game Start
        io.to(gameId).emit("game_started", {
            gameId: gameId,
            players: game.players,
            questions: questions.map(q => ({
                _id: q._id,
                title: q.title,
                description: q.description,
                options: q.options.map(o => ({ text: o.text })),
                type: q.type
            })),
            startTime: game.startTime
        });

    } catch (error) {
        console.error("Join Private Error:", error);
        socket.emit("error", { message: "Failed to join room" });
    }
};

// Helper: Create Game Session
async function createGameSession(io, players, topic, category) {
    try {
        // 1. Select Questions
        const questions = await selectQuestions(topic, category);

        // 2. Create DB Record
        const game = await Game.create({
            type: "PUBLIC",
            status: "IN_PROGRESS",
            players: players.map(p => ({ userId: p.userId, socketId: p.socketId })),
            topic: topic,
            category: category || "CS",
            questions: questions.map(q => ({ questionId: q._id })),
            startTime: new Date()
        });

        const gameId = game._id.toString();

        // 3. Notify Players
        players.forEach(p => {
            const s = io.sockets.sockets.get(p.socketId);
            if (s) {
                s.join(gameId);
                s.emit("match_found", { gameId }); // Just notify match found first
            }
        });

        // 4. Emit Game Start Payload
        io.to(gameId).emit("game_started", {
            gameId: gameId,
            players: game.players, // Should populate names? Frontend might need IDs only or fetch profile
            questions: questions.map(q => ({
                _id: q._id,
                title: q.title,
                description: q.description,
                options: q.options.map(o => ({ text: o.text })), // No isCorrect
                type: q.type
            })),
            startTime: game.startTime
        });

        console.log(`Game started: ${gameId}`);

    } catch (error) {
        console.error("Session Creation Error:", error);
    }
}

// Helper: Select Questions
async function selectQuestions(topic, category) {
    console.log(`DEBUG: selectQuestions called with topic=${topic}, category=${category}`);
    const matchStage = { isActive: true };
    if (category) matchStage.category = category;
    if (topic && topic !== "RANDOM") {
        matchStage.topic = topic;
    }

    console.log("DEBUG: matchStage:", matchStage);

    const questions = await Question.aggregate([
        { $match: matchStage },
        { $sample: { size: 3 } } // 3 questions per match
    ]);

    console.log(`DEBUG: Found ${questions.length} questions`);
    return questions;
}
