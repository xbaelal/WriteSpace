console.log("Server file is executing...");

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import rateLimit from "express-rate-limit"; // Continue from here

import { supabase } from "./supabaseClient";
import authRoutes from "./routes/auth";
import postRoutes from "./routes/posts";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet());
app.use(cors());
app.use(express.json());

// General rate limiter for all routes
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // 1000 requests per window
  message: "Too many requests from this IP, please try again later.",
});

// Stricter limiter for auth routes (prevent brute force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // Only 20 login/signup attempts per 15 minutes
  message: "Too many login attempts, please try again later.",
});

// Apply limiters
app.use("/api/posts", generalLimiter);
app.use("/api/auth", authLimiter);

app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);

app.get("/ping", async (req, res) => {
  const { error } = await supabase
    .from("posts")
    .select("*", { count: "exact", head: true });

  if (error) {
    return res.status(500).json({
      message: "Supabase connection failed",
      error: error.message,
    });
  }
  res.json({
    message: "pong",
    supabase: "connected",
  });
});

// app.get("/debug-url", (req, res) => {
//   res.json({
//     SUPABASE_URL: process.env.SUPABASE_URL,
//     SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY?.substring(0, 10) + "...",
//   });
// });

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
