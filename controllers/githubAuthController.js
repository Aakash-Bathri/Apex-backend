import passport from "passport";
import { Strategy as GitHubStrategy } from "passport-github2";
import { generateToken } from "../utils/jwt.js";
import { findOrCreateOAuthUser } from "../utils/findOrCreateUser.js";

passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: `${process.env.BACKEND_URL}/auth/github/callback`,
      scope: ["user:email"],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email =
          profile.emails?.find((e) => e.primary)?.value ||
          profile.emails?.[0]?.value;

        if (!email) {
          console.error("No email in GitHub profile");
          return done(
            new Error(
              "No email provided by GitHub. Please make your email public in GitHub settings."
            ),
            null
          );
        }

        const user = await findOrCreateOAuthUser({
          email,
          name: profile.username,
          avatar: profile.photos?.[0]?.value,
          provider: "github",
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
