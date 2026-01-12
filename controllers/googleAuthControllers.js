import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { generateToken } from "../utils/jwt.js";
import { findOrCreateOAuthUser } from "../utils/findOrCreateUser.js";

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.BACKEND_URL}/auth/google/callback`,
      passReqToCallback: false,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email) {
          console.error("No email in profile. Profile emails:", profile.emails);
          return done(new Error("No email provided by Google"), null);
        }

        const user = await findOrCreateOAuthUser({
          email,
          name: profile.displayName,
          avatar: profile.photos?.[0]?.value,
          provider: "google",
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
