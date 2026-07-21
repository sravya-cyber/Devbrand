import axios from "axios";
import logger from "../utils/logger.js";

const GH_API = "https://api.github.com";

const ghHeaders = (token) => ({
  Authorization: `Bearer ${token}`,
  Accept: "application/vnd.github.v3+json",
});

export const getGHUserStats = async (username, accessToken) => {
  try {
    const headers = accessToken ? ghHeaders(accessToken) : {};

    const [userRes, reposRes] = await Promise.all([
      axios.get(`${GH_API}/users/${username}`, { headers, timeout: 10000 }),
      axios.get(`${GH_API}/users/${username}/repos?per_page=100&sort=updated`, {
        headers,
        timeout: 10000,
      }),
    ]);

    const user = userRes.data;
    const repos = reposRes.data;

    // Calculate total stars
    const totalStars = repos.reduce((sum, repo) => sum + repo.stargazers_count, 0);

    // Find most starred repos
    const topRepos = repos
      .sort((a, b) => b.stargazers_count - a.stargazers_count)
      .slice(0, 5)
      .map((r) => ({
        name: r.name,
        stars: r.stargazers_count,
        description: r.description,
        language: r.language,
        url: r.html_url,
      }));

    return {
      username,
      name: user.name,
      publicRepos: user.public_repos,
      followers: user.followers,
      following: user.following,
      totalStars,
      topRepos,
      bio: user.bio,
      company: user.company,
      blog: user.blog,
      location: user.location,
    };
  } catch (error) {
    logger.error(`GH getUserStats error for ${username}:`, error.message);
    throw error;
  }
};

// Get recent commits/pushes for content generation
export const getRecentActivity = async (username, accessToken) => {
  try {
    const headers = accessToken ? ghHeaders(accessToken) : {};

    const response = await axios.get(
      `${GH_API}/users/${username}/events/public?per_page=30`,
      { headers, timeout: 10000 }
    );

    const events = response.data;

    // Filter meaningful events
    const pushEvents = events
      .filter((e) => e.type === "PushEvent")
      .slice(0, 5)
      .map((e) => ({
        repo: e.repo.name,
        commits: e.payload.commits?.map((c) => c.message) || [],
        createdAt: e.created_at,
      }));

    const prEvents = events
      .filter((e) => e.type === "PullRequestEvent" && e.payload.action === "closed" && e.payload.pull_request?.merged)
      .slice(0, 3)
      .map((e) => ({
        repo: e.repo.name,
        title: e.payload.pull_request.title,
        url: e.payload.pull_request.html_url,
        createdAt: e.created_at,
      }));

    return { pushEvents, mergedPRs: prEvents };
  } catch (error) {
    logger.error(`GH getRecentActivity error for ${username}:`, error.message);
    return { pushEvents: [], mergedPRs: [] };
  }
};

// Detect GitHub milestones
export const detectGHMilestones = (prevStats, currentStats) => {
  const milestones = [];

  // Total stars milestone
  const starMilestones = [10, 50, 100, 500, 1000];
  for (const milestone of starMilestones) {
    if ((prevStats.totalStars || 0) < milestone && currentStats.totalStars >= milestone) {
      milestones.push({
        type: "gh_repo_stars",
        platform: "github",
        title: `${milestone} Total GitHub Stars!`,
        description: `Accumulated ${milestone} total stars across GitHub repositories`,
        data: {
          stars: milestone,
          actual: currentStats.totalStars,
          topRepo: currentStats.topRepos?.[0],
        },
      });
    }
  }

  // Per-repo star milestones
  if (currentStats.topRepos) {
    for (const repo of currentStats.topRepos) {
      const prevRepo = prevStats.topRepos?.find((r) => r.name === repo.name);
      const prevStars = prevRepo?.stars || 0;

      for (const milestone of starMilestones) {
        if (prevStars < milestone && repo.stars >= milestone) {
          milestones.push({
            type: "gh_repo_stars",
            platform: "github",
            title: `"${repo.name}" hit ${milestone} stars!`,
            description: `Repository ${repo.name} crossed ${milestone} GitHub stars`,
            data: {
              repoName: repo.name,
              stars: milestone,
              actual: repo.stars,
              description: repo.description,
              url: repo.url,
            },
          });
        }
      }
    }
  }

  // New repo created
  if ((currentStats.publicRepos || 0) > (prevStats.publicRepos || 0)) {
    milestones.push({
      type: "gh_new_repo",
      platform: "github",
      title: "New GitHub Repository Created!",
      description: `Created a new repository on GitHub`,
      data: {
        totalRepos: currentStats.publicRepos,
        newestRepo: currentStats.topRepos?.[0],
      },
    });
  }

  // First PR merged
  if (!prevStats.firstPRMerged && currentStats.firstPRMerged) {
    milestones.push({
      type: "gh_first_pr_merged",
      platform: "github",
      title: "First Open Source PR Merged!",
      description: "Had first ever Pull Request merged into an open source project",
      data: currentStats.firstPRMerged,
    });
  }

  return milestones;
};
