import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { getDashboard } from "../controllers/dashboardController.js";

const router = express.Router();

router.get("/dashboard", requireAuth, getDashboard);

export default router;
