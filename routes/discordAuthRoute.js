import express from "express";
import passport from "passport";

const router = express.Router();

router.get("/", passport.authenticate("discord"));

router.get(
  "/callback",
  passport.authenticate("discord", { session: false }),
  (req, res) => {
    res.redirect(`${process.env.FRONTEND_URL}/oauth-success?token=${token}`);
  }
);

export default router;
