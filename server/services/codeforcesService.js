import axios from "axios";
import logger from "../utils/logger.js";

const CF_API = "https://codeforces.com/api";

// Codeforces rank order for comparison
const RANK_ORDER = {
  newbie: 0,
  pupil: 1,
  specialist: 2,
  expert: 3,
  "candidate master": 4,
  master: 5,
  "international master": 6,
  grandmaster: 7,
  "international grandmaster": 8,
  "legendary grandmaster": 9,
};

export const getRankOrder = (rank) => {
  return RANK_ORDER[rank?.toLowerCase()] ?? -1;
};

// Get user info from Codeforces
export const getCFUserInfo = async (handle) => {
  try {
    const response = await axios.get(`${CF_API}/user.info?handles=${handle}`, {
      timeout: 10000,
    });

    if (response.data.status !== "OK") {
      throw new Error(`Codeforces API error: ${response.data.comment}`);
    }

    const user = response.data.result[0];
    return {
      handle: user.handle,
      rating: user.rating || 0,
      maxRating: user.maxRating || 0,
      rank: user.rank || "newbie",
      maxRank: user.maxRank || "newbie",
      avatar: user.avatar,
      titlePhoto: user.titlePhoto,
      country: user.country,
      organization: user.organization,
      contribution: user.contribution,
      friendOfCount: user.friendOfCount,
      registrationTimeSeconds: user.registrationTimeSeconds,
    };
  } catch (error) {
    logger.error(`CF getUserInfo error for ${handle}:`, error.message);
    throw error;
  }
};

// Get user's submission history and calculate stats
export const getCFUserStats = async (handle) => {
  try {
    const [submissionsRes, ratingsRes] = await Promise.all([
      axios.get(`${CF_API}/user.status?handle=${handle}&from=1&count=10000`, {
        timeout: 15000,
      }),
      axios.get(`${CF_API}/user.rating?handle=${handle}`, { timeout: 10000 }),
    ]);

    // Count unique solved problems
    const solvedProblems = new Set();
    const topicsSolved = new Set();

    if (submissionsRes.data.status === "OK") {
      for (const sub of submissionsRes.data.result) {
        if (sub.verdict === "OK") {
          const key = `${sub.problem.contestId}-${sub.problem.index}`;
          solvedProblems.add(key);
          if (sub.problem.tags) {
            sub.problem.tags.forEach((tag) => topicsSolved.add(tag));
          }
        }
      }
    }

    const contestsParticipated =
      ratingsRes.data.status === "OK" ? ratingsRes.data.result.length : 0;

    return {
      problemsSolved: solvedProblems.size,
      contestsParticipated,
      topicsCount: topicsSolved.size,
      topics: [...topicsSolved],
      ratingHistory:
        ratingsRes.data.status === "OK" ? ratingsRes.data.result : [],
    };
  } catch (error) {
    logger.error(`CF getUserStats error for ${handle}:`, error.message);
    throw error;
  }
};

// Check for milestones compared to previous stats
export const detectCFMilestones = (prevStats, currentStats, handle) => {
  const milestones = [];

  // Rank upgrade detection
  if (
    prevStats.rank &&
    currentStats.rank &&
    getRankOrder(currentStats.rank) > getRankOrder(prevStats.rank)
  ) {
    milestones.push({
      type: "cf_rank_upgrade",
      platform: "codeforces",
      title: `Rank Up: ${prevStats.rank} → ${currentStats.rank}!`,
      description: `${handle} upgraded from ${prevStats.rank} to ${currentStats.rank} on Codeforces`,
      data: {
        from: prevStats.rank,
        to: currentStats.rank,
        rating: currentStats.rating,
        solved: currentStats.problemsSolved,
        contests: currentStats.contestsParticipated,
      },
    });
  }

  // Personal best rating
  if (currentStats.rating > (prevStats.maxRating || 0)) {
    milestones.push({
      type: "cf_personal_best_rating",
      platform: "codeforces",
      title: `New Personal Best: ${currentStats.rating} rating!`,
      description: `Achieved personal best rating of ${currentStats.rating} on Codeforces`,
      data: {
        rating: currentStats.rating,
        rank: currentStats.rank,
        previousBest: prevStats.maxRating || 0,
      },
    });
  }

  // First ever contest
  if (prevStats.contestsParticipated === 0 && currentStats.contestsParticipated > 0) {
    milestones.push({
      type: "cf_first_contest",
      platform: "codeforces",
      title: "First Rated Contest on Codeforces!",
      description: `Participated in first ever rated Codeforces contest`,
      data: {
        rating: currentStats.rating,
        rank: currentStats.rank,
      },
    });
  }

  // Problem count milestones
  const problemMilestones = [100, 250, 500, 1000, 2000];
  for (const milestone of problemMilestones) {
    if (
      (prevStats.problemsSolved || 0) < milestone &&
      currentStats.problemsSolved >= milestone
    ) {
      milestones.push({
        type: "cf_problems_milestone",
        platform: "codeforces",
        title: `${milestone} Problems Solved on Codeforces!`,
        description: `Solved ${milestone} problems on Codeforces`,
        data: { count: milestone, actual: currentStats.problemsSolved },
      });
    }
  }

  return milestones;
};
