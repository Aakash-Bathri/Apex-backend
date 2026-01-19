import { Server } from "socket.io";
import { handleJoinQueue, handleCreatePrivate, handleJoinPrivate } from "./matchmakingService.js";
import { handleSubmitAnswer, handleGameSync } from "./gameLogicService.js";
import jwt from "jsonwebtoken";

let io;

// Store active user connections: userId -> socketId
export const connectedUsers = new Map();

export const initSocket = (httpServer) => {
    io = new Server(httpServer, {
        cors: {
            origin: process.env.FRONTEND_URL || "http://localhost:5173",
            methods: ["GET", "POST"],
        },
    });

    // Middleware for Auth
    io.use((socket, next) => {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(" ")[1];
        if (!token) {
            return next(new Error("Authentication error"));
        }
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.userId = decoded.id; // Store userId
            next();
        } catch (err) {
            next(new Error("Authentication error"));
        }
    });

    io.on("connection", (socket) => {
        console.log(`Socket connected: ${socket.id} (User: ${socket.userId})`);

        // Track user connection
        connectedUsers.set(socket.userId, socket.id);

        // Matchmaking Events
        socket.on("join_queue", (data) => handleJoinQueue(io, socket, { ...data, userId: socket.userId }));
        socket.on("create_private", (data) => handleCreatePrivate(io, socket, { ...data, userId: socket.userId }));
        socket.on("join_private", (data) => handleJoinPrivate(io, socket, { ...data, userId: socket.userId }));

        // Gameplay Events
        socket.on("join_game", (data) => handleGameSync(io, socket, data));
        socket.on("submit_answer", (data) => handleSubmitAnswer(io, socket, data));

        socket.on("disconnect", () => {
            console.log(`Socket disconnected: ${socket.id}`);
            // Remove from connected users if it matches the current socket
            if (connectedUsers.get(socket.userId) === socket.id) {
                connectedUsers.delete(socket.userId);
            }

            // Handle remove from queue if waiting
            import("./matchmakingService.js").then(({ handleDisconnect }) => {
                handleDisconnect(socket);
            });
        });
    });

    return io;
};


export const getIO = () => {
    if (!io) {
        throw new Error("Socket.io not initialized!");
    }
    return io;
};

export const getOnlineUserCount = () => {
    return connectedUsers.size;
};
