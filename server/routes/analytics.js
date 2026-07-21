import express from "express";
import { protect } from "../middleware/auth.js";
import Post from "../models/Post.js";

const router = express.Router();
router.use(protect);

// Get dashboard analytics overview
router.get("/overview", async (req, res, next) => {
  try {
    const userId = req.user._id;
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [totalPosts, publishedPosts, scheduledPosts, recentPosts] = await Promise.all([
      Post.countDocuments({ userId, isDeleted: false }),
      Post.countDocuments({ userId, status: "published" }),
      Post.countDocuments({ userId, status: "scheduled" }),
      Post.find({
        userId,
        status: "published",
        publishedAt: { $gte: thirtyDaysAgo },
      }).select("content platforms publishedAt analytics engagementScore"),
    ]);

    // Calculate total impressions
    const totalImpressions = recentPosts.reduce((sum, post) => {
      return (
        sum +
        (post.analytics?.twitter?.impressions || 0) +
        (post.analytics?.linkedin?.impressions || 0)
      );
    }, 0);

    // Platform breakdown
    const platformStats = recentPosts.reduce((acc, post) => {
      post.platforms.forEach((platform) => {
        if (!acc[platform]) acc[platform] = { posts: 0, impressions: 0, engagement: 0 };
        acc[platform].posts++;
        acc[platform].impressions += post.analytics?.[platform]?.impressions || 0;
        acc[platform].engagement +=
          (post.analytics?.[platform]?.likes || 0) +
          (post.analytics?.[platform]?.comments || 0) +
          (post.analytics?.[platform]?.shares || 0);
      });
      return acc;
    }, {});

    // Posting activity for heatmap (last 365 days)
    const yearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
    const activityData = await Post.find({
      userId,
      status: "published",
      publishedAt: { $gte: yearAgo },
    }).select("publishedAt");

    const activityMap = {};
    activityData.forEach((post) => {
      const dateKey = post.publishedAt.toISOString().split("T")[0];
      activityMap[dateKey] = (activityMap[dateKey] || 0) + 1;
    });

    // Average engagement score
    const scoredPosts = recentPosts.filter((p) => p.engagementScore?.score);
    const avgScore =
      scoredPosts.length > 0
        ? scoredPosts.reduce((sum, p) => sum + p.engagementScore.score, 0) / scoredPosts.length
        : 0;

    res.json({
      overview: {
        totalPosts,
        publishedPosts,
        scheduledPosts,
        totalImpressions,
        avgEngagementScore: Math.round(avgScore * 10) / 10,
      },
      platformStats,
      activityHeatmap: activityMap,
    });
  } catch (error) {
    next(error);
  }
});

// Get top performing posts
router.get("/top-posts", async (req, res, next) => {
  try {
    const posts = await Post.find({
      userId: req.user._id,
      status: "published",
    })
      .sort({ "engagementScore.score": -1 })
      .limit(10)
      .select("content platforms publishedAt analytics engagementScore aiGenerated");

    res.json({ posts });
  } catch (error) {
    next(error);
  }
});

export default router;
