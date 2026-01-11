import express from "express";
import passport from "passport";

const router = express.Router();

router.get("/", passport.authenticate("google", { scope: ["profile"] }));

router.get(
  "/callback",
  passport.authenticate("google", {
    failureRedirect: "/login",
    successRedirect: "/protected",
  })
);

export default router;
