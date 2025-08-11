import express from "express";
import { isAuth } from "../middlewares/isAuth.js";
import { createNewChat, getAllChats, sendMessage } from "../controllers/chat.js";
import { upload } from "../middlewares/multer.js";

const router = express.Router();

router.post("/new", isAuth, createNewChat); 
router.get("/all", isAuth, getAllChats);
router.post("/upload", isAuth, upload.single("image"), sendMessage);

export default router;