import axios from "axios";
import logger from "../utils/logger.js";

// LeetCode GraphQL endpoint (unofficial but public)
const LC_GRAPHQL = "https://leetcode.com/graphql";

export const getLCUserStats = async (username) => {
  try {
    const query = `
      query getUserProfile($username: String!) {
        matchedUser(username: $username) {
          username
          profile {
            ranking
            reputation
            starRating
          }
          submitStats: submitStatsGlobal {
            acSubmissionNum {
              difficulty
              count
              submissions
            }
          }
          userCalendar {
            streak
            totalActiveDays
            submissionCalendar
          }
        }
      }
    `;

    const response = await axios.post(
      LC_GRAPHQL,
      { query, variables: { username } },
      {
        headers: {
          "Content-Type": "application/json",
          Referer: "https://leetcode.com",
        },
        timeout: 10000,
      }
    );

    const user = response.data?.data?.matchedUser;
    if (!user) throw new Error(`LeetCode user ${username} not found`);

    const stats = user.submitStats.acSubmissionNum;
    const totalSolved = stats.find((s) => s.difficulty === "All")?.count || 0;
    const easySolved = stats.find((s) => s.difficulty === "Easy")?.count || 0;
    const mediumSolved = stats.find((s) => s.difficulty === "Medium")?.count || 0;
    const hardSolved = stats.find((s) => s.difficulty === "Hard")?.count || 0;

    return {
      username,
      ranking: user.profile.ranking,
      totalSolved,
      easySolved,
      mediumSolved,
      hardSolved,
      streak: user.userCalendar?.streak || 0,
      totalActiveDays: user.userCalendar?.totalActiveDays || 0,
    };
  } catch (error) {
    logger.error(`LC getUserStats error for ${username}:`, error.message);
    throw error;
  }
};

// Detect LeetCode milestones
export const detectLCMilestones = (prevStats, currentStats, username) => {
  const milestones = [];

  // Problem count milestones
  const problemMilestones = [50, 100, 250, 500, 1000];
  for (const milestone of problemMilestones) {
    if (
      (prevStats.totalSolved || 0) < milestone &&
      currentStats.totalSolved >= milestone
    ) {
      milestones.push({
        type: "lc_problems_milestone",
        platform: "leetcode",
        title: `${milestone} Problems Solved on LeetCode!`,
        description: `Solved ${milestone} problems on LeetCode`,
        data: {
          count: milestone,
          actual: currentStats.totalSolved,
          easy: currentStats.easySolved,
          medium: currentStats.mediumSolved,
          hard: currentStats.hardSolved,
        },
      });
    }
  }

  // Streak milestones
  const streakMilestones = [7, 30, 100, 365];
  for (const milestone of streakMilestones) {
    if (
      (prevStats.streak || 0) < milestone &&
      currentStats.streak >= milestone
    ) {
      milestones.push({
        type: "lc_streak_milestone",
        platform: "leetcode",
        title: `${milestone}-Day LeetCode Streak!`,
        description: `Maintained a ${milestone}-day solving streak on LeetCode`,
        data: { days: milestone, currentStreak: currentStats.streak },
      });
    }
  }

  return milestones;
};
