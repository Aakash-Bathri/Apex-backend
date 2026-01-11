import express from "express";
import passport from "passport";
import session from "express-session";
import MongoStore from "connect-mongo";
import UserModel from "./config/database.js";
import googleAuthRoutes from "./routes/googleAuthRoutes.js";
import "./controllers/googleAuthControllers.js";
import userRoutes from "./routes/userRoutes.js";
import cors from "cors";

const PORT = 8000;

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.use(
  session({
    secret: "keyboard cat",
    resave: false,
    saveUninitialized: true,
    store: MongoStore.create({
      mongoUrl: "mongodb://localhost:27017/passport-google",
      collectionName: "sessions",
    }),
    cookie: {
      maxAge: 1000 * 60 * 60 * 24,
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use("/auth/google", googleAuthRoutes);

app.use("/", userRoutes);

app.listen(PORT, (req, res) => {
  console.log(`server is running on ${PORT}`);
});
