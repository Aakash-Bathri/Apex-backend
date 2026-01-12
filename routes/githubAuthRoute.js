import express from "express";
import passport from "passport";

const router = express.Router();

router.get(
  "/",
  passport.authenticate("github", {
    scope: ["user:email"],
  })
);

router.get(
  "/callback",
  passport.authenticate("github", { session: false }),
  (req, res) => {
    res.redirect(
      `${process.env.FRONTEND_URL}/oauth-success?token=${req.user.token}`
    );
  }
);

export default router;
