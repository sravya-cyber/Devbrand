import express from "express";
import {
  createPost,
  getPosts,
  getPost,
  updatePost,
  deletePost,
  getCalendarPosts,
} from "../controllers/postController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.use(protect);

router.route("/").get(getPosts).post(createPost);
router.get("/calendar", getCalendarPosts);
router.route("/:id").get(getPost).put(updatePost).delete(deletePost);

export default router;
