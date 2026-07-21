import cron from "node-cron";
import User from "../models/User.js";
import Milestone from "../models/Milestone.js";
import Notification from "../models/Notification.js";
import { getCFUserInfo, getCFUserStats, detectCFMilestones } from "./codeforcesService.js";
import { getLCUserStats, detectLCMilestones } from "./leetcodeService.js";
import { getGHUserStats, detectGHMilestones } from "./githubService.js";
import { generateMilestonePost } from "./geminiService.js";
import logger from "../utils/logger.js";

const checkUserMilestones = async (user) => {
  const { codingProfiles, stats } = user;
  const newMilestones = [];

  // ── Codeforces ──
  if (codingProfiles?.codeforces?.handle) {
    try {
      const handle = codingProfiles.codeforces.handle;
      logger.info(`Checking Codeforces for ${handle}...`);

      const [cfInfo, cfStats] = await Promise.all([
        getCFUserInfo(handle),
        getCFUserStats(handle),
      ]);

      const prevStats    = stats?.codeforces || {};
      const currentStats = { ...cfInfo, ...cfStats };

      const cfMilestones = detectCFMilestones(prevStats, currentStats, handle);
      newMilestones.push(...cfMilestones);

      // Always update cached stats
      user.stats.codeforces = {
        rating:               currentStats.rating,
        rank:                 currentStats.rank,
        maxRating:            currentStats.maxRating,
        maxRank:              currentStats.maxRank,
        problemsSolved:       currentStats.problemsSolved,
        contestsParticipated: currentStats.contestsParticipated,
        lastUpdated:          new Date(),
      };

      logger.info(`CF ${handle}: rating=${currentStats.rating}, rank=${currentStats.rank}, problems=${currentStats.problemsSolved}`);
    } catch (err) {
      logger.error(`CF check failed for ${user.email}: ${err.message}`);
    }
  }

  // ── LeetCode ──
  if (codingProfiles?.leetcode?.username) {
    try {
      const username = codingProfiles.leetcode.username;
      logger.info(`Checking LeetCode for ${username}...`);

      const lcStats  = await getLCUserStats(username);
      const prevStats = stats?.leetcode || {};

      const lcMilestones = detectLCMilestones(prevStats, lcStats, username);
      newMilestones.push(...lcMilestones);

      user.stats.leetcode = {
        totalSolved:  lcStats.totalSolved,
        easySolved:   lcStats.easySolved,
        mediumSolved: lcStats.mediumSolved,
        hardSolved:   lcStats.hardSolved,
        streak:       lcStats.streak,
        ranking:      lcStats.ranking,
        lastUpdated:  new Date(),
      };

      logger.info(`LC ${username}: solved=${lcStats.totalSolved}, streak=${lcStats.streak}`);
    } catch (err) {
      logger.error(`LC check failed for ${user.email}: ${err.message}`);
    }
  }

  // ── GitHub ──
  if (codingProfiles?.github?.username) {
    try {
      const username   = codingProfiles.github.username;
      const accessToken = codingProfiles.github.accessToken;
      logger.info(`Checking GitHub for ${username}...`);

      const ghStats  = await getGHUserStats(username, accessToken);
      const prevStats = stats?.github || {};

      const ghMilestones = detectGHMilestones(prevStats, ghStats);
      newMilestones.push(...ghMilestones);

      user.stats.github = {
        publicRepos: ghStats.publicRepos,
        followers:   ghStats.followers,
        totalStars:  ghStats.totalStars,
        lastUpdated: new Date(),
      };

      logger.info(`GH ${username}: repos=${ghStats.publicRepos}, stars=${ghStats.totalStars}`);
    } catch (err) {
      logger.error(`GH check failed for ${user.email}: ${err.message}`);
    }
  }

  // Save updated stats regardless of milestones found
  await user.save({ validateBeforeSave: false });

  // Process new milestones
  for (const milestoneData of newMilestones) {
    try {
      // Avoid duplicate milestone detection
      const existing = await Milestone.findOne({
        userId: user._id,
        type:   milestoneData.type,
        "data.count": milestoneData.data?.count,
        "data.to":    milestoneData.data?.to,
      });
      if (existing) continue;

      // Generate AI draft
      let draftedContent = "";
      try {
        const generated = await generateMilestonePost({
          ...milestoneData,
          platform: "linkedin",
        });
        draftedContent = `${generated.content}\n\n${generated.hashtags?.join(" ") || ""}`;
      } catch {
        draftedContent = milestoneData.description;
      }

      const milestone = await Milestone.create({
        userId: user._id,
        ...milestoneData,
        draftedContent,
        status: "pending",
      });

      if (user.notifications?.milestones !== false) {
        await Notification.create({
          userId:  user._id,
          type:    "milestone_detected",
          title:   `🎉 ${milestoneData.title}`,
          message: "We've drafted a post for this milestone. Review and publish it!",
          link:    `/milestones/${milestone._id}`,
          data:    { milestoneId: milestone._id },
        });
      }

      logger.info(`🏆 New milestone for ${user.email}: ${milestoneData.type}`);
    } catch (err) {
      logger.error(`Failed to save milestone: ${err.message}`);
    }
  }

  return newMilestones.length;
};

export const runMilestoneCheck = async () => {
  logger.info("🔍 Starting milestone check for all users...");

  const users = await User.find({
    isActive: true,
    $or: [
      { "codingProfiles.codeforces.handle":  { $exists: true, $ne: "" } },
      { "codingProfiles.leetcode.username":  { $exists: true, $ne: "" } },
      { "codingProfiles.github.username":    { $exists: true, $ne: "" } },
    ],
  }).select("+codingProfiles.github.accessToken");

  logger.info(`Found ${users.length} user(s) with connected profiles`);

  let totalMilestones = 0;
  for (const user of users) {
    const count = await checkUserMilestones(user);
    totalMilestones += count;
    // Small delay between users to avoid hitting API rate limits
    await new Promise(r => setTimeout(r, 500));
  }

  logger.info(`✅ Milestone check done. ${totalMilestones} new milestone(s) detected.`);
  return totalMilestones;
};

export const startMilestoneChecker = () => {
  // Run every 30 minutes
  cron.schedule("*/30 * * * *", async () => {
    try {
      await runMilestoneCheck();
    } catch (error) {
      logger.error("Milestone cron job failed:", error.message);
    }
  });
  logger.info("⏰ Milestone checker cron started (every 30 min + on startup)");
};