import express from "express";
import googleAuthRoutes from "./routes/googleAuthRoutes.js";
import "./controllers/googleAuthControllers.js";
import userRoutes from "./routes/userRoutes.js";
import cors from "cors";

const PORT = 8000;

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Routes
app.use("/auth/google", googleAuthRoutes);

app.use("/", userRoutes);

app.listen(PORT, (req, res) => {
  console.log(`server is running on ${PORT}`);
});
