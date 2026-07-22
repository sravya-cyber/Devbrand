import axios from "axios";
import logger from "../utils/logger.js";

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent";
const callGemini = async (prompt) => {
  try {
    const response = await axios.post(
      `${GEMINI_API_URL}?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.8,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
      }
    );
    return response.data.candidates[0].content.parts[0].text;
  } catch (error) {
    logger.error("Gemini API error:", error.response?.data || error.message);
    throw new Error("AI generation failed");
  }
};

// Generate 3 A/B variants of a social media post
export const generatePostVariants = async ({ context, platform, tone, audience }) => {
  const prompt = `You are a personal branding expert for developers. Generate exactly 3 different social media post variants for ${platform}.

Context: ${context}
Tone options: professional, casual, educational
Target audience: ${audience || "developers and tech recruiters"}

Requirements:
- Each variant should have a different angle/tone
- Include relevant hashtags at the end
- LinkedIn posts can be 150-300 words
- Make them authentic, not generic

Respond ONLY with valid JSON in this exact format:
{
  "variants": [
    { "tone": "professional", "content": "post content here", "hashtags": ["#tag1", "#tag2"] },
    { "tone": "casual", "content": "post content here", "hashtags": ["#tag1", "#tag2"] },
    { "tone": "educational", "content": "post content here", "hashtags": ["#tag1", "#tag2"] }
  ]
}`;

  const raw = await callGemini(prompt);
  try {
    const cleaned = raw.replace(/```json|```/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    throw new Error("Failed to parse AI variants response");
  }
};

// Score a post before publishing
export const scorePost = async (content, platform) => {
  const prompt = `You are a social media expert. Score this ${platform} post for a developer's personal brand.

Post: "${content}"

Evaluate based on:
1. Hook strength (does it grab attention?)
2. Value delivery (does it teach or inspire?)
3. Authenticity (does it sound like a real person?)
4. Call to action (does it encourage engagement?)
5. Platform fit (is it appropriate for ${platform}?)

Respond ONLY with valid JSON:
{
  "score": 7.5,
  "reasoning": "Brief overall assessment in 1-2 sentences",
  "tips": ["Specific improvement tip 1", "Specific improvement tip 2"]
}`;

  const raw = await callGemini(prompt);
  try {
    const cleaned = raw.replace(/```json|```/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return { score: 7, reasoning: "Could not analyze post", tips: [] };
  }
};

// Generate milestone celebration post
export const generateMilestonePost = async (milestone) => {
  const { type, data, platform } = milestone;

  let context = "";
  switch (type) {
    case "cf_rank_upgrade":
      context = `Just upgraded from ${data.from} to ${data.to} on Codeforces! New rating: ${data.rating}. Participated in ${data.contests} contests and solved ${data.solved} problems to get here.`;
      break;
    case "cf_personal_best_rating":
      context = `Achieved personal best rating of ${data.rating} (${data.rank}) on Codeforces in the latest contest!`;
      break;
    case "cf_first_contest":
      context = `Just participated in my first ever rated contest on Codeforces! Got a rating of ${data.rating}.`;
      break;
    case "cf_problems_milestone":
      context = `Just solved my ${data.count}th problem on Codeforces!`;
      break;
    case "lc_problems_milestone":
      context = `Just solved my ${data.count}th problem on LeetCode! Breakdown: ${data.easy} Easy, ${data.medium} Medium, ${data.hard} Hard.`;
      break;
    case "lc_streak_milestone":
      context = `Maintained a ${data.days}-day streak on LeetCode! Solving problems consistently every single day.`;
      break;
    case "gh_repo_stars":
      context = `My GitHub repository "${data.repoName}" just crossed ${data.stars} stars! It's a project where ${data.description}.`;
      break;
    case "gh_commit_streak":
      context = `Just hit a ${data.days}-day GitHub commit streak! Building consistently every day.`;
      break;
    case "gh_first_pr_merged":
      context = `Just had my first ever open source Pull Request merged into ${data.repoName}!`;
      break;
    default:
      context = milestone.description;
  }

  const prompt = `You are a personal branding expert for developers. Write an authentic, engaging ${platform || "linkedin"} post celebrating this developer milestone.

Milestone: ${context}

Make it:
- Personal and authentic, not corporate-sounding
- Include what this milestone means to the developer's journey
- Encourage others who are on the same path
- Include 3-5 relevant hashtags

Respond ONLY with valid JSON:
{
  "content": "the full post content",
  "hashtags": ["#tag1", "#tag2", "#tag3"]
}`;

  const raw = await callGemini(prompt);
  try {
    const cleaned = raw.replace(/```json|```/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    throw new Error("Failed to generate milestone post");
  }
};

// Generate hashtag suggestions
export const generateHashtags = async (content, platform) => {
  const prompt = `Suggest 5-8 relevant hashtags for this ${platform} developer post. Return ONLY a JSON array of hashtag strings with # symbol.

Post: "${content}"

Example response: ["#coding", "#developer", "#leetcode"]`;

  const raw = await callGemini(prompt);
  try {
    const cleaned = raw.replace(/```json|```/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return ["#coding", "#developer", "#programming"];
  }
};

// Generate weekly digest summary
export const generateWeeklyDigest = async (stats) => {
  const prompt = `Generate a motivating weekly summary for a developer based on their activity this week.

Stats:
- Posts published: ${stats.postsPublished}
- Best performing post: "${stats.bestPost?.content?.slice(0, 100)}..."
- Codeforces problems solved: ${stats.cfSolved}
- LeetCode problems solved: ${stats.lcSolved}
- GitHub commits: ${stats.ghCommits}
- LinkedIn impressions: ${stats.linkedinImpressions}

Write a brief (3-4 sentences), encouraging plain-English summary highlighting wins and one suggestion for next week. No bullet points, just natural prose.`;

  return await callGemini(prompt);
};

// Generate image prompt for DALL-E / HuggingFace
export const generateImagePrompt = async (postContent) => {
  const prompt = `Create a concise image generation prompt for this developer social media post. The image should be professional, tech-themed, and suitable for LinkedIn.

Post: "${postContent.slice(0, 200)}"

Return ONLY the image prompt as a plain string (no JSON, no quotes, just the prompt itself). Keep it under 100 words. Style: clean, modern, professional tech illustration.`;

  return await callGemini(prompt);
};
