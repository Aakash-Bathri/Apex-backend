import "dotenv/config";
import express from "express";
import googleAuthRoutes from "./routes/googleAuthRoutes.js";
import githubAuthRoutes from "./routes/githubAuthRoute.js";
import discordAuthRoutes from "./routes/discordAuthRoute.js";
import "./controllers/googleAuthControllers.js";
import "./controllers/discordAuthController.js";
import "./controllers/githubAuthController.js";
import userRoutes from "./routes/userRoutes.js";
import gameRoutes from "./routes/gameRoutes.js";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import http from "http";
import { initSocket } from "./services/socketService.js";
import "./config/database.js"; // Initialize MongoDB connection

const PORT = process.env.PORT || 8000;

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
initSocket(server);

app.set("trust proxy", 1); // Trust first key, which is the Nginx proxy
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(helmet());

// Rate limiting: 300 requests per 15 minutes
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: "draft-7",
  legacyHeaders: false,
});
app.use(limiter);
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true
}));

// Routes
app.use("/auth/google", googleAuthRoutes);
app.use("/auth/github", githubAuthRoutes);
app.use("/auth/discord", discordAuthRoutes);

import adminRoutes from "./routes/adminRoutes.js";
app.use("/api/admin", adminRoutes);

app.use("/api", userRoutes);
app.use("/api/game", gameRoutes);

server.listen(PORT, () => {
  console.log(`server is running on ${PORT}`);
});
