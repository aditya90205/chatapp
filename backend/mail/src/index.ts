import express from "express";
import dotenv from "dotenv";
import { startSendOtpConsumer } from "./consumer.js";
dotenv.config();

startSendOtpConsumer();

const app = express();const PORT = process.env.PORT || 3000;



app.use(express.json());

app.get("/", (req, res) => {
  res.send("Mail service is running");
});

app.listen(PORT, () => {
  console.log(`Mail service is running on port ${PORT}`);
});
