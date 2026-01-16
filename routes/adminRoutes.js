import express from "express";
import { adminLogin } from "../controllers/adminController.js";
import {
    getQuestions,
    createQuestion,
    bulkCreateQuestions,
    updateQuestionStatus
} from "../controllers/questionController.js";
import { adminMiddleware } from "../middleware/adminMiddleware.js";

const router = express.Router();

// Public Admin Login
router.post("/login", adminLogin);

// Protected Routes
router.use(adminMiddleware);

router.get("/questions", getQuestions);
router.post("/questions", createQuestion);
router.post("/questions/bulk", bulkCreateQuestions);
router.patch("/questions/:id/status", updateQuestionStatus);

export default router;
