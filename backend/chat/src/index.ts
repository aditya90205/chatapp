import dotenv from "dotenv";
import express from "express";
import connectDB from "./config/db.js";
import chatRoutes from "./routes/chat.js";

dotenv.config();

connectDB();

const app = express();
app.use(express.json());

app.use("/api/v1/chat", chatRoutes);

const port = process.env.PORT || 5002;

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
