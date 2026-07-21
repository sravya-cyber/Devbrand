import express from "express";
import {
  generateVariants,
  scorePostRoute,
  suggestHashtags,
  generateImagePromptRoute,
  getWeeklyDigest,
} from "../controllers/aiController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();
router.use(protect);

router.post("/generate", generateVariants);
router.post("/score", scorePostRoute);
router.post("/hashtags", suggestHashtags);
router.post("/image-prompt", generateImagePromptRoute);
router.get("/weekly-digest", getWeeklyDigest);

export default router;
