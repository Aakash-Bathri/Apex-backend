import express from "express";

const router = express.Router();

router.get("/login", (req, res) => {
  res.send("login");
});

router.get("/protected", (req, res) => {
  if (req.isAuthenticated()) {
    res.send("protected");
  } else {
    res.status(401).send({ message: "Unauthorized" });
  }
  console.log(req.session);
  console.log(req.user);
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
