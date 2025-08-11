import express from "express";
import { isAuth } from "../middlewares/isAuth.js";
import { createNewChat, getAllChats } from "../controllers/chat.js";

const router = express.Router();

router.post("/new", isAuth, createNewChat); 
router.get("/all", isAuth, getAllChats);

export default router;