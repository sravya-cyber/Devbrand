import Bull from "bull";
import logger from "../utils/logger.js";

let postQueue = null;

// Parse Redis URL into options Bull can use
const getRedisConfig = () => {
  const url = process.env.REDIS_URL;
  if (!url) throw new Error("REDIS_URL not set");

  try {
    const parsed = new URL(url);
    return {
      host: parsed.hostname,
      port: Number(parsed.port) || 6379,
      password: parsed.password || undefined,
      tls: url.startsWith("rediss://") ? { rejectUnauthorized: false } : undefined,
    };
  } catch {
    return url; // fallback: pass raw URL
  }
};

export const createPostQueue = () => {
  if (postQueue) return postQueue;

  const redisConfig = getRedisConfig();

  postQueue = new Bull("post-publishing", {
    redis: redisConfig,
    settings: { maxStalledCount: 3 },
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: "exponential", delay: 5000 },
      removeOnComplete: 50,
      removeOnFail: 100,
    },
  });

  postQueue.on("completed", (job) =>
    logger.info(`✅ Post job ${job.id} completed`)
  );
  postQueue.on("failed", (job, err) =>
    logger.error(`❌ Post job ${job.id} failed: ${err.message}`)
  );
  postQueue.on("error", (err) =>
    logger.error(`❌ Queue error: ${err.message}`)
  );

  logger.info("📋 Post queue initialized");
  return postQueue;
};

export const getPostQueue = () => {
  if (!postQueue) throw new Error("Post queue not initialized");
  return postQueue;
};

export const schedulePost = async (postId, userId, scheduledAt) => {
  const queue = getPostQueue();
  const delay = new Date(scheduledAt).getTime() - Date.now();
  if (delay < 0) throw new Error("Scheduled time must be in the future");

  const job = await queue.add(
    { postId: postId.toString(), userId: userId.toString() },
    { delay, jobId: postId.toString() }
  );

  logger.info(`📅 Post ${postId} scheduled in ${Math.round(delay / 1000)}s`);
  return job.id;
};

export const cancelPost = async (jobId) => {
  try {
    const queue = getPostQueue();
    const job = await queue.getJob(jobId);
    if (job) { await job.remove(); return true; }
  } catch { }
  return false;
};

export const getJobStatus = async (jobId) => {
  try {
    const queue = getPostQueue();
    const job = await queue.getJob(jobId);
    if (!job) return null;
    const state = await job.getState();
    return { id: job.id, state, attemptsMade: job.attemptsMade };
  } catch { return null; }
};

export default createPostQueue;