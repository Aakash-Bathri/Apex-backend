import mongoose from "mongoose";

const TopicStatsSchema = new mongoose.Schema(
  {
    rating: { type: Number, default: 1000 },
    // wins: { type: Number, default: 0 },
    // losses: { type: Number, default: 0 },
    // gamesPlayed: { type: Number, default: 0 },
    // highestStreak: { type: Number, default: 0 }
  },
  { _id: false }
);

const UserStatsSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      unique: true,
      required: true,
      index: true,
    },

    /* ---------------- OVERALL STATS ---------------- */
    overall: {
      rating: { type: Number, default: 800 },

      wins: { type: Number, default: 0 },
      losses: { type: Number, default: 0 },

      currentStreak: { type: Number, default: 0 },
      highestStreak: { type: Number, default: 0 },

      gamesPlayed: { type: Number, default: 0 },

      totalPlayTimeSec: { type: Number, default: 0 },
      avgMatchTimeSec: { type: Number, default: 0 },
    },

    /* ---------------- TOPIC-WISE STATS ---------------- */
    topics: {
      DSA: { type: TopicStatsSchema, default: () => ({}) },
      OOPS: { type: TopicStatsSchema, default: () => ({}) },
      OS: { type: TopicStatsSchema, default: () => ({}) },
      DBMS: { type: TopicStatsSchema, default: () => ({}) },
      CN: { type: TopicStatsSchema, default: () => ({}) },
    },

    // /* ---------------- CURRENT GAME ---------------- */
    // currentGame: {
    //   gameId: {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: "Game",
    //     default: null,
    //   },
    //   topic: { type: String, default: null },
    //   startedAt: { type: Date, default: null },
    // },

    // /* ---------------- META ---------------- */
    // lastGameAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  }
);

export const UserStats = mongoose.model("UserStats", UserStatsSchema);
