import express from "express";
import {
  getAllUsers,
  getAUser,
  loginUser,
  myProfile,
  updateProfileName,
  verifyUser,
} from "../controllers/user.js";
import { isAuth } from "../middleware/isAuth.js";

const router = express.Router();

router.post("/login", loginUser);
router.post("/verify", verifyUser);
router.post("/update/name", isAuth, updateProfileName);
router.get("/me", isAuth, myProfile);
router.get("/all", isAuth, getAllUsers);
router.get("/:id", getAUser);

export default router; 
