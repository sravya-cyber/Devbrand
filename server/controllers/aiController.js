import {
  generatePostVariants,
  scorePost,
  generateHashtags,
  generateImagePrompt,
  generateWeeklyDigest,
} from "../services/geminiService.js";
import Post from "../models/Post.js";

// @desc    Generate 3 A/B post variants
// @route   POST /api/ai/generate
export const generateVariants = async (req, res, next) => {
  try {
    const { context, platform, tone, audience } = req.body;
    if (!context) return res.status(400).json({ message: "Context is required" });

    const result = await generatePostVariants({ context, platform, tone, audience });
    res.json(result);
  } catch (error) {
    next(error);
  }
};

// @desc    Score a post before publishing
// @route   POST /api/ai/score
export const scorePostRoute = async (req, res, next) => {
  try {
    const { content, platform } = req.body;
    if (!content) return res.status(400).json({ message: "Content is required" });

    const score = await scorePost(content, platform || "linkedin");
    res.json(score);
  } catch (error) {
    next(error);
  }
};

// @desc    Generate hashtags for a post
// @route   POST /api/ai/hashtags
export const suggestHashtags = async (req, res, next) => {
  try {
    const { content, platform } = req.body;
    if (!content) return res.status(400).json({ message: "Content is required" });

    const hashtags = await generateHashtags(content, platform);
    res.json({ hashtags });
  } catch (error) {
    next(error);
  }
};

// @desc    Generate image prompt for a post
// @route   POST /api/ai/image-prompt
export const generateImagePromptRoute = async (req, res, next) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ message: "Content is required" });

    const prompt = await generateImagePrompt(content);
    res.json({ prompt });
  } catch (error) {
    next(error);
  }
};

// @desc    Generate weekly digest
// @route   GET /api/ai/weekly-digest
export const getWeeklyDigest = async (req, res, next) => {
  try {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const posts = await Post.find({
      userId: req.user._id,
      status: "published",
      publishedAt: { $gte: oneWeekAgo },
    });

    const bestPost = posts.reduce(
      (best, post) =>
        (post.engagementScore?.score || 0) > (best?.engagementScore?.score || 0) ? post : best,
      null
    );

    const stats = {
      postsPublished: posts.length,
      bestPost,
      cfSolved: req.user.stats?.codeforces?.problemsSolved || 0,
      lcSolved: req.user.stats?.leetcode?.totalSolved || 0,
      ghCommits: 0,
      linkedinImpressions: posts.reduce((sum, p) => sum + (p.analytics?.linkedin?.impressions || 0), 0),
    };

    const digest = await generateWeeklyDigest(stats);
    res.json({ digest, stats });
  } catch (error) {
    next(error);
  }
};
