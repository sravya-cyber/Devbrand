import axios from "axios";
import logger from "../utils/logger.js";

const TW_API = "https://api.twitter.com/2";

// Post a tweet using OAuth 2.0 Bearer token
export const publishToTwitter = async (account, post) => {
  try {
    const accessToken = account.accessToken;
    if (!accessToken) throw new Error("No Twitter access token");

    // Twitter v2 - create tweet
    const payload = { text: post.content.slice(0, 280) };

    // Attach media if image URL exists (would need media upload in production)
    // Skipping media upload for simplicity — add later with v1.1 media/upload

    const response = await axios.post(`${TW_API}/tweets`, payload, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      timeout: 15000,
    });

    const tweetId = response.data?.data?.id;
    if (!tweetId) throw new Error("Twitter did not return a tweet ID");

    logger.info(`Twitter post published: ${tweetId}`);
    return tweetId;
  } catch (error) {
    const msg = error.response?.data?.detail || error.response?.data?.title || error.message;
    logger.error(`Twitter publish error: ${msg}`);
    throw new Error(`Twitter: ${msg}`);
  }
};

// Twitter OAuth 2.0 PKCE auth URL builder
export const getTwitterAuthUrl = (state) => {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: process.env.TWITTER_CLIENT_ID,
    redirect_uri: process.env.TWITTER_CALLBACK_URL,
    scope: "tweet.read tweet.write users.read offline.access",
    state,
    code_challenge: "challenge",
    code_challenge_method: "plain",
  });
  return `https://twitter.com/i/oauth2/authorize?${params.toString()}`;
};

// Exchange code for tokens
export const exchangeTwitterCode = async (code) => {
  try {
    const credentials = Buffer.from(
      `${process.env.TWITTER_CLIENT_ID}:${process.env.TWITTER_CLIENT_SECRET}`
    ).toString("base64");

    const response = await axios.post(
      "https://api.twitter.com/2/oauth2/token",
      new URLSearchParams({
        code,
        grant_type: "authorization_code",
        redirect_uri: process.env.TWITTER_CALLBACK_URL,
        code_verifier: "challenge",
      }),
      {
        headers: {
          Authorization: `Basic ${credentials}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    return response.data;
  } catch (error) {
    logger.error("Twitter token exchange error:", error.response?.data);
    throw new Error("Failed to exchange Twitter auth code");
  }
};

// Get Twitter user info
export const getTwitterUser = async (accessToken) => {
  try {
    const response = await axios.get(`${TW_API}/users/me?user.fields=profile_image_url,username`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return response.data.data;
  } catch (error) {
    throw new Error("Failed to fetch Twitter user info");
  }
};
