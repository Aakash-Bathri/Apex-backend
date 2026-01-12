import passport from "passport";
import { Strategy as DiscordStrategy } from "passport-discord";
import jwt from "jsonwebtoken";
import User from "../config/database.js";

passport.use(
  new DiscordStrategy(
    {
      clientID: process.env.DISCORD_CLIENT_ID,
      clientSecret: process.env.DISCORD_CLIENT_SECRET,
      callbackURL: `${process.env.BACKEND_URL}/auth/discord/callback`,
      scope: ["identify", "email"],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ discordId: profile.id });

        if (!user) {
          user = await User.create({
            discordId: profile.id,
            name: profile.username,
            email: profile.email,
            avatar: `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png`,
          });
        }

        const token = jwt.sign(
          { id: user._id, discordId: profile.id },
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
