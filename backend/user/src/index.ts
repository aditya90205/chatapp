import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import { createClient } from "redis";

// dotenv.config({ path: "./.env" });
dotenv.config();

connectDB();

export const redisClient = createClient({
  url: process.env.REDIS_URI,
});

redisClient
  .connect()
  .then(() => console.log("Redis connected successfully"))
  .catch((err) => {
    console.error("Error connecting to Redis:", err);
  });

const app = express();
const PORT = process.env.PORT || 3000;
app.get("/", (req, res) => {
  res.send("User Service is running");
});

app.listen(PORT, () => {
  console.log(`User service running on port ${PORT}`);
});

export default app;
