import express from "express";
import passport from "passport";

const router = express.Router();

router.get("/", passport.authenticate("github"));

router.get(
  "/callback",
  passport.authenticate("github", { session: false }),
  (req, res) => {
    res.redirect(`${process.env.FRONTEND_URL}/oauth-success?token=${token}`);
  }
);

export default router;
