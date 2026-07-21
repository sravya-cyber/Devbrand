import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    content: {
      type: String,
      required: [true, "Post content is required"],
      maxlength: 3000,
    },
    imageUrl: { type: String, default: "" },
    imagePrompt: { type: String, default: "" },

    // Which platforms to post to
    platforms: {
      type: [String],
      enum: ["twitter", "linkedin"],
      required: true,
      validate: [(arr) => arr.length > 0, "At least one platform required"],
    },

    // Scheduling
    scheduledAt: { type: Date, required: true },
    publishedAt: { type: Date },

    // Job tracking
    status: {
      type: String,
      enum: ["draft", "scheduled", "publishing", "published", "failed"],
      default: "draft",
    },
    jobId: { type: String }, // Bull job ID
    retryCount: { type: Number, default: 0 },
    lastError: { type: String, default: "" },

    // Platform post IDs after publishing
    publishedIds: {
      twitter: String,
      linkedin: String,
    },

    // AI metadata
    aiGenerated: { type: Boolean, default: false },
    aiSource: {
      type: String,
      enum: ["github", "codeforces", "leetcode", "manual", ""],
      default: "",
    },
    milestoneId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Milestone",
    },

    // AI scoring
    engagementScore: {
      score: { type: Number, min: 0, max: 10 },
      reasoning: String,
      tips: [String],
    },

    // A/B variants
    variants: [
      {
        content: String,
        tone: String,
        score: Number,
      },
    ],

    // Analytics (populated after publishing)
    analytics: {
      twitter: {
        likes: { type: Number, default: 0 },
        retweets: { type: Number, default: 0 },
        replies: { type: Number, default: 0 },
        impressions: { type: Number, default: 0 },
      },
      linkedin: {
        likes: { type: Number, default: 0 },
        comments: { type: Number, default: 0 },
        shares: { type: Number, default: 0 },
        impressions: { type: Number, default: 0 },
      },
    },

    hashtags: [String],
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Index for calendar queries
postSchema.index({ userId: 1, scheduledAt: 1 });
postSchema.index({ userId: 1, status: 1 });

const Post = mongoose.model("Post", postSchema);
export default Post;
