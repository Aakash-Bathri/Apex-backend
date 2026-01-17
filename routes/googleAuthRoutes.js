import express from "express";
import passport from "passport";

const router = express.Router();

router.get(
  "/",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/callback",
  passport.authenticate("google", { session: false }),
  (req, res) => {
    const token = req.user.token;
    const redirectUrl = `${process.env.FRONTEND_URL}/oauth-success?token=${token}`;
    console.log(`[GoogleAuth] Authenticated user. Redirecting to: ${redirectUrl}`);
    res.redirect(redirectUrl);
  }
);

export default router;
