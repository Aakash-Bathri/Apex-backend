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

import http from "http";
import { initSocket } from "./services/socketService.js";

const PORT = 8000;

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
initSocket(server);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

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
