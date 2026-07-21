import express from "express";
import crypto from "crypto";
import { protect } from "../middleware/auth.js";
import User from "../models/User.js";
import SocialAccount from "../models/SocialAccount.js";
import { getCFUserInfo } from "../services/codeforcesService.js";
import { getLCUserStats } from "../services/leetcodeService.js";
import { getGHUserStats } from "../services/githubService.js";
import { runMilestoneCheck } from "../services/milestoneService.js";
import {
  getTwitterAuthUrl, exchangeTwitterCode, getTwitterUser,
} from "../services/twitterService.js";
import {
  getLinkedInAuthUrl, exchangeLinkedInCode, getLinkedInUser,
} from "../services/linkedinService.js";
import logger from "../utils/logger.js";

const router = express.Router();
const oauthStates = new Map();

// ─── Coding Profiles ───────────────────────────────────────────────────────

router.post("/codeforces", protect, async (req, res, next) => {
  try {
    const { handle } = req.body;
    if (!handle) return res.status(400).json({ message: "Codeforces handle required" });
    const cfInfo = await getCFUserInfo(handle);
    await User.findByIdAndUpdate(req.user._id, {
      "codingProfiles.codeforces.handle": handle,
      "codingProfiles.codeforces.connectedAt": new Date(),
      "stats.codeforces.rating": cfInfo.rating,
      "stats.codeforces.rank": cfInfo.rank,
      "stats.codeforces.maxRating": cfInfo.maxRating,
    });
    res.json({ message: "Codeforces profile connected", profile: cfInfo });
  } catch (error) {
    next(error);
  }
});

router.post("/leetcode", protect, async (req, res, next) => {
  try {
    const { username } = req.body;
    if (!username) return res.status(400).json({ message: "LeetCode username required" });
    const lcStats = await getLCUserStats(username);
    await User.findByIdAndUpdate(req.user._id, {
      "codingProfiles.leetcode.username": username,
      "codingProfiles.leetcode.connectedAt": new Date(),
      "stats.leetcode.totalSolved": lcStats.totalSolved,
      "stats.leetcode.easySolved": lcStats.easySolved,
      "stats.leetcode.mediumSolved": lcStats.mediumSolved,
      "stats.leetcode.hardSolved": lcStats.hardSolved,
      "stats.leetcode.streak": lcStats.streak,
    });
    res.json({ message: "LeetCode profile connected", profile: lcStats });
  } catch (error) {
    next(error);
  }
});

router.post("/github", protect, async (req, res, next) => {
  try {
    const { username } = req.body;
    if (!username) return res.status(400).json({ message: "GitHub username required" });
    const ghStats = await getGHUserStats(username, null);
    await User.findByIdAndUpdate(req.user._id, {
      "codingProfiles.github.username": username,
      "codingProfiles.github.connectedAt": new Date(),
      "stats.github.publicRepos": ghStats.publicRepos,
      "stats.github.followers": ghStats.followers,
      "stats.github.totalStars": ghStats.totalStars,
    });
    res.json({ message: "GitHub profile connected", profile: ghStats });
  } catch (error) {
    next(error);
  }
});

router.get("/", protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const socialAccounts = await SocialAccount.find({ userId: req.user._id, isActive: true });
    res.json({
      codingProfiles: user.codingProfiles,
      socialAccounts: socialAccounts.map((a) => ({
        _id: a._id, platform: a.platform, username: a.username,
        displayName: a.displayName, profileImage: a.profileImage, connectedAt: a.connectedAt,
      })),
      stats: user.stats,
    });
  } catch (error) {
    next(error);
  }
});

router.delete("/:platform", protect, async (req, res, next) => {
  try {
    const { platform } = req.params;
    if (["twitter", "linkedin"].includes(platform)) {
      await SocialAccount.findOneAndUpdate({ userId: req.user._id, platform }, { isActive: false });
    } else {
      await User.findByIdAndUpdate(req.user._id, { [`codingProfiles.${platform}`]: {} });
    }
    res.json({ message: `${platform} disconnected` });
  } catch (error) {
    next(error);
  }
});

router.post("/check-milestones", protect, async (req, res, next) => {
  try {
    res.json({ message: "Milestone check started in background" });
    runMilestoneCheck().catch(console.error);
  } catch (error) {
    next(error);
  }
});

// ─── Twitter OAuth ─────────────────────────────────────────────────────────

router.get("/twitter/auth", protect, (req, res) => {
  const state = `${req.user._id}:${crypto.randomBytes(16).toString("hex")}`;
  oauthStates.set(state, { userId: req.user._id.toString() });
  setTimeout(() => oauthStates.delete(state), 10 * 60 * 1000);
  res.redirect(getTwitterAuthUrl(state));
});

router.get("/twitter/callback", async (req, res) => {
  const { code, state, error } = req.query;
  if (error) return res.redirect(`${process.env.CLIENT_URL}/accounts?error=twitter_denied`);
  const stateData = oauthStates.get(state);
  if (!stateData) return res.redirect(`${process.env.CLIENT_URL}/accounts?error=invalid_state`);
  oauthStates.delete(state);
  try {
    const tokens = await exchangeTwitterCode(code);
    const twUser = await getTwitterUser(tokens.access_token);
    await SocialAccount.findOneAndUpdate(
      { userId: stateData.userId, platform: "twitter" },
      {
        userId: stateData.userId, platform: "twitter",
        platformUserId: twUser.id, username: twUser.username,
        displayName: twUser.name, profileImage: twUser.profile_image_url,
        accessToken: tokens.access_token, refreshToken: tokens.refresh_token || "",
        isActive: true,
      },
      { upsert: true, new: true }
    );
    res.redirect(`${process.env.CLIENT_URL}/accounts?success=twitter`);
  } catch (err) {
    logger.error("Twitter callback error:", err.message);
    res.redirect(`${process.env.CLIENT_URL}/accounts?error=twitter_failed`);
  }
});

// ─── LinkedIn OAuth ────────────────────────────────────────────────────────

router.get("/linkedin/auth", protect, (req, res) => {
  const state = `${req.user._id}:${crypto.randomBytes(16).toString("hex")}`;
  oauthStates.set(state, { userId: req.user._id.toString() });
  setTimeout(() => oauthStates.delete(state), 10 * 60 * 1000);
  res.redirect(getLinkedInAuthUrl(state));
});

router.get("/linkedin/callback", async (req, res) => {
  const { code, state, error } = req.query;
  if (error) return res.redirect(`${process.env.CLIENT_URL}/accounts?error=linkedin_denied`);
  const stateData = oauthStates.get(state);
  if (!stateData) return res.redirect(`${process.env.CLIENT_URL}/accounts?error=invalid_state`);
  oauthStates.delete(state);
  try {
    const tokens = await exchangeLinkedInCode(code);
    const liUser = await getLinkedInUser(tokens.access_token);
    await SocialAccount.findOneAndUpdate(
      { userId: stateData.userId, platform: "linkedin" },
      {
        userId: stateData.userId, platform: "linkedin",
        platformUserId: liUser.sub, username: liUser.email || liUser.sub,
        displayName: liUser.name, profileImage: liUser.picture,
        accessToken: tokens.access_token, refreshToken: tokens.refresh_token || "",
        isActive: true,
      },
      { upsert: true, new: true }
    );
    res.redirect(`${process.env.CLIENT_URL}/accounts?success=linkedin`);
  } catch (err) {
    logger.error("LinkedIn callback error FULL:", JSON.stringify(err.response?.data || err.message || err));
    res.redirect(`${process.env.CLIENT_URL}/accounts?error=linkedin_failed`);
  }
});

export default router;

// Refresh stats for current user immediately
router.post("/refresh-stats", protect, async (req, res, next) => {
  try {
    const { runMilestoneCheck } = await import("../services/milestoneService.js");
    res.json({ message: "Stats refresh started" });
    // Fire in background
    runMilestoneCheck().catch(console.error);
  } catch (error) {
    next(error);
  }
});