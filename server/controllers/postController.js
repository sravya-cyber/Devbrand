import Post from "../models/Post.js";
import { schedulePost, cancelPost, getJobStatus } from "../queues/postQueue.js";
import { scorePost } from "../services/geminiService.js";
import logger from "../utils/logger.js";

// @desc    Create and schedule a post
// @route   POST /api/posts
export const createPost = async (req, res, next) => {
  try {
    const { content, platforms, scheduledAt, imageUrl, aiGenerated, variants, hashtags } = req.body;

    if (!content || !platforms || !scheduledAt) {
      return res.status(400).json({ message: "Content, platforms, and scheduledAt are required" });
    }

    if (new Date(scheduledAt) <= new Date()) {
      return res.status(400).json({ message: "Scheduled time must be in the future" });
    }

    // Auto-score the post with AI (non-blocking)
    let engagementScore = null;
    try {
      engagementScore = await scorePost(content, platforms[0]);
    } catch {
      // Non-critical, continue without score
    }

    // Save post to DB first — respond immediately
    const post = await Post.create({
      userId: req.user._id,
      content,
      platforms,
      scheduledAt,
      imageUrl: imageUrl || "",
      aiGenerated: aiGenerated || false,
      variants: variants || [],
      hashtags: hashtags || [],
      engagementScore,
      status: "scheduled",
    });

    // Schedule Bull job in background — don't block response
    schedulePost(post._id, req.user._id, scheduledAt)
      .then((jobId) => {
        post.jobId = jobId.toString();
        return post.save();
      })
      .then(() => logger.info(`📅 Job scheduled for post ${post._id}`))
      .catch((err) => {
        logger.error(`Failed to schedule job for post ${post._id}: ${err.message}`);
        // Post is still saved, just won't auto-publish via queue
        // Update status to reflect this
        Post.findByIdAndUpdate(post._id, { status: "draft" }).catch(() => {});
      });

    // Respond immediately without waiting for queue
    res.status(201).json({ message: "Post scheduled successfully", post });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all posts for user
// @route   GET /api/posts
export const getPosts = async (req, res, next) => {
  try {
    const { status, platform, page = 1, limit = 20 } = req.query;
    const query = { userId: req.user._id, isDeleted: false };

    if (status) query.status = status;
    if (platform) query.platforms = platform;

    const posts = await Post.find(query)
      .sort({ scheduledAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Post.countDocuments(query);

    res.json({
      posts,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single post
// @route   GET /api/posts/:id
export const getPost = async (req, res, next) => {
  try {
    const post = await Post.findOne({ _id: req.params.id, userId: req.user._id });
    if (!post) return res.status(404).json({ message: "Post not found" });

    let jobStatus = null;
    if (post.jobId && post.status === "scheduled") {
      try { jobStatus = await getJobStatus(post.jobId); } catch {}
    }

    res.json({ post, jobStatus });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a post
// @route   PUT /api/posts/:id
export const updatePost = async (req, res, next) => {
  try {
    const post = await Post.findOne({ _id: req.params.id, userId: req.user._id });
    if (!post) return res.status(404).json({ message: "Post not found" });
    if (post.status === "published") {
      return res.status(400).json({ message: "Cannot edit a published post" });
    }

    const { content, platforms, scheduledAt, imageUrl } = req.body;

    if (scheduledAt && post.jobId) {
      try { await cancelPost(post.jobId); } catch {}
    }

    if (content) post.content = content;
    if (platforms) post.platforms = platforms;
    if (imageUrl !== undefined) post.imageUrl = imageUrl;

    if (scheduledAt) {
      post.scheduledAt = scheduledAt;
      try {
        const jobId = await schedulePost(post._id, req.user._id, scheduledAt);
        post.jobId = jobId.toString();
      } catch (err) {
        logger.error(`Failed to reschedule: ${err.message}`);
      }
    }

    if (content) {
      try { post.engagementScore = await scorePost(content, post.platforms[0]); } catch {}
    }

    await post.save();
    res.json({ message: "Post updated", post });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a post
// @route   DELETE /api/posts/:id
export const deletePost = async (req, res, next) => {
  try {
    const post = await Post.findOne({ _id: req.params.id, userId: req.user._id });
    if (!post) return res.status(404).json({ message: "Post not found" });

    if (post.jobId && post.status === "scheduled") {
      try { await cancelPost(post.jobId); } catch {}
    }

    post.isDeleted = true;
    post.status = "draft";
    await post.save();
    res.json({ message: "Post deleted" });
  } catch (error) {
    next(error);
  }
};

// @desc    Get posts for calendar view
// @route   GET /api/posts/calendar
export const getCalendarPosts = async (req, res, next) => {
  try {
    const { month, year } = req.query;
    const startDate = new Date(year, month - 1, 1);
    const endDate   = new Date(year, month, 0, 23, 59, 59);

    const posts = await Post.find({
      userId: req.user._id,
      isDeleted: false,
      scheduledAt: { $gte: startDate, $lte: endDate },
    }).select("content platforms scheduledAt status engagementScore imageUrl");

    res.json({ posts });
  } catch (error) {
    next(error);
  }
};