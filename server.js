import express from "express";
import googleAuthRoutes from "./routes/googleAuthRoutes.js";
import githubAuthRoutes from "./routes/githubAuthRoute.js";
import discordAuthRoutes from "./routes/discordAuthRoute.js";
import "./controllers/googleAuthControllers.js";
import "./controllers/discordAuthController.js";
import "./controllers/githubAuthController.js";
import userRoutes from "./routes/userRoutes.js";
import cors from "cors";

const PORT = 8000;

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Routes
app.use("/auth/google", googleAuthRoutes);
app.use("/auth/github", githubAuthRoutes);
app.use("/auth/discord", discordAuthRoutes);

app.use("/api", userRoutes);

app.listen(PORT, (req, res) => {
  console.log(`server is running on ${PORT}`);
});
