import express from "express";
import passport from "passport";

const router = express.Router();

router.get("/", passport.authenticate("google", { scope: ["profile"] }));

router.get(
  "/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: "/login",
  }),
  (req, res) => {
    const { token } = req.user;

    res.redirect(`${process.env.FRONTEND_URL}/oauth-success?token=${token}`);
  }
);

export default router;
