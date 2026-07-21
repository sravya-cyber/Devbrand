import express from "express";
import { protect } from "../middleware/auth.js";
import Milestone from "../models/Milestone.js";
import Notification from "../models/Notification.js";
import Post from "../models/Post.js";

const router = express.Router();
router.use(protect);

// Get all milestones for user
router.get("/", async (req, res, next) => {
  try {
    const { status, platform } = req.query;
    const query = { userId: req.user._id };
    if (status) query.status = status;
    if (platform) query.platform = platform;

    const milestones = await Milestone.find(query).sort({ detectedAt: -1 }).limit(50);
    res.json({ milestones });
  } catch (error) {
    next(error);
  }
});

// Get single milestone
router.get("/:id", async (req, res, next) => {
  try {
    const milestone = await Milestone.findOne({ _id: req.params.id, userId: req.user._id });
    if (!milestone) return res.status(404).json({ message: "Milestone not found" });
    res.json({ milestone });
  } catch (error) {
    next(error);
  }
});

// Dismiss a milestone
router.patch("/:id/dismiss", async (req, res, next) => {
  try {
    const milestone = await Milestone.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { status: "dismissed", dismissedAt: new Date() },
      { new: true }
    );
    if (!milestone) return res.status(404).json({ message: "Milestone not found" });
    res.json({ message: "Milestone dismissed", milestone });
  } catch (error) {
    next(error);
  }
});

// Get unread notifications
router.get("/notifications/all", async (req, res, next) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(30);

    const unreadCount = await Notification.countDocuments({
      userId: req.user._id,
      isRead: false,
    });

    res.json({ notifications, unreadCount });
  } catch (error) {
    next(error);
  }
});

// Mark notifications as read
router.patch("/notifications/read", async (req, res, next) => {
  try {
    await Notification.updateMany({ userId: req.user._id, isRead: false }, { isRead: true });
    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    next(error);
  }
});

export default router;