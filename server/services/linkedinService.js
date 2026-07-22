import axios from "axios";
import logger from "../utils/logger.js";

const LI_API = "https://api.linkedin.com/v2";

// Post to LinkedIn
export const publishToLinkedIn = async (account, post) => {
  try {
    const accessToken = account?.accessToken;
    if (!accessToken) throw new Error("No LinkedIn access token");

    const profileRes = await axios.get("https://api.linkedin.com/v2/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const personUrn = `urn:li:person:${profileRes.data.sub}`;

    const shareMediaCategory = post.imageUrl ? "ARTICLE" : "NONE";
    const media = post.imageUrl ? [{
      status: "READY",
      originalUrl: post.imageUrl,
      title: { text: post.content.slice(0, 30) || "Post Link" }
    }] : [];

    const payload = {
      author: personUrn,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: { text: post.content },
          shareMediaCategory,
          ...(post.imageUrl ? { media } : {}),
        },
      },
      visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
    };

    const response = await axios.post(`${LI_API}/ugcPosts`, payload, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0",
      },
      timeout: 15000,
    });

    const postId = response.headers["x-restli-id"] || response.data?.id;
    if (!postId) throw new Error("LinkedIn did not return a post ID");
    logger.info(`LinkedIn post published: ${postId}`);
    return postId;
  } catch (error) {
    const msg = error.response?.data?.message || error.message;
    logger.error(`LinkedIn publish error: ${msg}`);
    throw new Error(`LinkedIn: ${msg}`);
  }
};

// Build LinkedIn OAuth URL
export const getLinkedInAuthUrl = (state) => {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: process.env.LINKEDIN_CLIENT_ID,
    redirect_uri: process.env.LINKEDIN_CALLBACK_URL,
    state,
    scope: "openid profile email w_member_social",
  });
  return `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;
};

// Exchange code for access token
export const exchangeLinkedInCode = async (code) => {
  try {
    const params = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: process.env.LINKEDIN_CALLBACK_URL,
      client_id: process.env.LINKEDIN_CLIENT_ID,
      client_secret: process.env.LINKEDIN_CLIENT_SECRET,
    });

    logger.info(`Exchanging LinkedIn code, redirect_uri: ${process.env.LINKEDIN_CALLBACK_URL}`);

    const response = await axios.post(
      "https://www.linkedin.com/oauth/v2/accessToken",
      params.toString(),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    logger.info(`LinkedIn token exchange success, token type: ${response.data.token_type}`);
    return response.data;
  } catch (error) {
    const errData = error.response?.data || error.message;
    logger.error("LinkedIn token exchange FULL error:", JSON.stringify(errData));
    throw new Error(JSON.stringify(errData));
  }
};

// Get LinkedIn user profile
export const getLinkedInUser = async (accessToken) => {
  try {
    const response = await axios.get("https://api.linkedin.com/v2/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    logger.info(`LinkedIn user fetched: ${response.data.email}`);
    return response.data;
  } catch (error) {
    const errData = error.response?.data || error.message;
    logger.error("LinkedIn userinfo error:", JSON.stringify(errData));
    throw new Error("Failed to fetch LinkedIn user info");
  }
};