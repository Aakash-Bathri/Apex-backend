import passport from "passport";
import { Strategy as GitHubStrategy } from "passport-github2";
import jwt from "jsonwebtoken";
import User from "../config/database.js";

passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: `${process.env.BACKEND_URL}/auth/github/callback`,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ githubId: profile.id });

        if (!user) {
          user = await User.create({
            githubId: profile.id,
            name: profile.username,
            avatar: profile.photos?.[0]?.value,
          });
        }

        const token = jwt.sign(
          { id: user._id, githubId: profile.id },
          process.env.JWT_SECRET,
          { expiresIn: "3d" }
        );

        done(null, token);
      } catch (err) {
        done(err, null);
      }
    }
  )
);
