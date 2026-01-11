import passport from "passport";
import UserModel from "../config/database.js";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { generateToken } from "../utils/jwt.js";

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:8000/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await UserModel.findOne({ googleId: profile.id });

        if (!user) {
          user = await UserModel.create({
            googleId: profile.id,
            name: profile.displayName,
            email: profile.emails?.[0]?.value,
            avatar: profile.photos?.[0]?.value,
          });
        }

        const token = generateToken(user);
        return done(null, { token });
      } catch (err) {
        return done(err, null);
      }
    }
  )
);
