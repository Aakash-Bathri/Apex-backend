import express from "express";
import { requireAuth } from "../controllers/auth.js";

const router = express.Router();

router.get("/login", (req, res) => {
  res.send("login");
});

router.get("/protected", requireAuth, (req, res) => {
  res.json({
    message: "Protected route",
    user: req.user,
  });
});

router.get("/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }

    req.session.destroy(() => {
      res.clearCookie("connect.sid");
      res.redirect("/login");
    });
  });
});

export default router;
