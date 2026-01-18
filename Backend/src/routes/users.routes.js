import { Router } from "express";
import {
  addToHistory,
  getUserHistory,
  login,
  register,
  deleteHistory,
  clearAllHistory,
  getCurrentUser,
  completeMeeting,
} from "../controllers/user.controller.js";

const router = Router();

router.route("/login").post(login);
router.route("/register").post(register);
router.route("/add_to_activity").post(addToHistory);
router.route("/get_all_activity").get(getUserHistory);
router.route("/delete_history").post(deleteHistory);
router.route("/clear_all_history").post(clearAllHistory);
router.route("/current_user").get(getCurrentUser);
router.route("/complete_meeting").post(completeMeeting);

export default router;
