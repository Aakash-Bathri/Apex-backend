import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { getDashboard } from "../controllers/dashboardController.js";
import { getLeaderboard } from "../controllers/leaderboardController.js";
import { getProfileByUsername } from "../controllers/profileController.js";

const router = express.Router();

router.get("/dashboard", requireAuth, getDashboard);
router.get("/leaderboard", requireAuth, getLeaderboard); // Protected route now
router.get("/profile/:username", getProfileByUsername); // Public profile route

export default router;
