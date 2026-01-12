import passport from "passport";
import { Strategy as DiscordStrategy } from "passport-discord";
import { generateToken } from "../utils/jwt.js";
import { findOrCreateOAuthUser } from "../utils/findOrCreateUser.js";

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
        const email = profile.email;

        if (!email) {
          console.error("No email in Discord profile");
          return done(new Error("No email provided by Discord"), null);
        }

        const avatar = profile.avatar
          ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png`
          : null;

        const user = await findOrCreateOAuthUser({
          email,
          name: profile.username,
          avatar,
          provider: "discord",
          providerId: profile.id,
        });

        const token = generateToken(user);
        done(null, { token });
      } catch (err) {
        done(err, null);
      }
    }
  )
);
