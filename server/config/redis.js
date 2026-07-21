import Redis from "ioredis";
import logger from "../utils/logger.js";

let redisClient = null;

export const connectRedis = async () => {
  const redisUrl = process.env.REDIS_URL;

  if (!redisUrl) {
    throw new Error("REDIS_URL is not set in .env file");
  }

  return new Promise((resolve, reject) => {
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      connectTimeout: 15000,
      retryStrategy(times) {
        if (times > 3) return null;
        return Math.min(times * 1000, 3000);
      },
    });

    redisClient.on("ready", () => {
      logger.info("✅ Redis Connected (Upstash)");
      resolve(redisClient);
    });

    redisClient.on("error", (err) => {
      logger.error("❌ Redis Error:", err.message);
      reject(err);
    });
  });
};

export const getRedisClient = () => {
  if (!redisClient) throw new Error("Redis not initialized");
  return redisClient;
};

export default redisClient;