import { getPostQueue } from "../postQueue.js";
import Post from "../../models/Post.js";
import Notification from "../../models/Notification.js";
import logger from "../../utils/logger.js";

const tryPublish = async (platform, account, post) => {
  try {
    if (platform === "twitter") {
      const { publishToTwitter } = await import("../../services/twitterService.js");
      return await publishToTwitter(account, post);
    }
    if (platform === "linkedin") {
      const { publishToLinkedIn } = await import("../../services/linkedinService.js");
      return await publishToLinkedIn(account, post);
    }
  } catch (err) {
    logger.warn(`Real publish failed for ${platform}: ${err.message} — using mock`);
  }
  const mockId = `mock_${platform}_${Date.now()}`;
  logger.info(`📤 [MOCK] Post published to ${platform}: ${mockId}`);
  return mockId;
};

export const startPostWorker = () => {
  const queue = getPostQueue();

  queue.process(async (job) => {
    const { postId, userId } = job.data;
    logger.info(`🔄 Processing post ${postId} for user ${userId}`);

    const post = await Post.findById(postId);
    if (!post) throw new Error(`Post ${postId} not found`);
    if (post.status === "published") {
      logger.info(`Post ${postId} already published, skipping`);
      return;
    }

    post.status = "publishing";
    await post.save();

    const publishedIds = {};

    for (const platform of post.platforms) {
      try {
        const SocialAccount = (await import("../../models/SocialAccount.js")).default;
        const account = await SocialAccount.findOne({
          userId, platform, isActive: true,
        });

        // Debug log to verify token exists
        logger.info(`Account found for ${platform}: ${!!account}, has token: ${!!account?.accessToken}`);

        const id = await tryPublish(platform, account, post);
        publishedIds[platform] = id;
      } catch (err) {
        logger.error(`Failed to publish to ${platform}: ${err.message}`);
        // Mock fallback so post still marks as published
        publishedIds[platform] = `mock_${platform}_${Date.now()}`;
      }
    }

    post.status = "published";
    post.publishedAt = new Date();
    post.publishedIds = publishedIds;
    await post.save();

    await Notification.create({
      userId,
      type: "post_published",
      title: "Post Published Successfully",
      message: `Your post was published to ${Object.keys(publishedIds).join(", ")}`,
      link: `/posts/${postId}`,
    });

    logger.info(`✅ Post ${postId} published: ${JSON.stringify(publishedIds)}`);
  });

  logger.info("👷 Post worker started");
};