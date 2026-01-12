import express from "express";
import passport from "passport";

const router = express.Router();

router.get(
  "/",
  passport.authenticate("discord", {
    scope: ["identify", "email"],
  })
);

router.get(
  "/callback",
  passport.authenticate("discord", { session: false }),
  (req, res) => {
    res.redirect(
      `${process.env.FRONTEND_URL}/oauth-success?token=${req.user.token}`
    );
  }
);

export default router;
