import mongoose from "mongoose";

const milestoneSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    platform: {
      type: String,
      enum: ["codeforces", "leetcode", "github"],
      required: true,
    },
    type: {
      type: String,
      enum: [
        // Codeforces milestones
        "cf_rank_upgrade",
        "cf_personal_best_rating",
        "cf_first_contest",
        "cf_problems_milestone",

        // LeetCode milestones
        "lc_problems_milestone",
        "lc_streak_milestone",
        "lc_topic_diversity",

        // GitHub milestones
        "gh_repo_stars",
        "gh_commit_streak",
        "gh_first_pr_merged",
        "gh_new_repo",
        "gh_followers_milestone",
      ],
      required: true,
    },
    title: { type: String, required: true },
    description: { type: String, required: true },

    // Milestone specific data
    data: {
      // For rank upgrades: { from: "Newbie", to: "Pupil", rating: 1200 }
      // For problem milestones: { count: 100, platform: "leetcode" }
      // For streaks: { days: 30 }
      // For stars: { repoName: "myproject", stars: 100 }
      type: mongoose.Schema.Types.Mixed,
    },

    // Status
    status: {
      type: String,
      enum: ["pending", "post_drafted", "post_published", "dismissed"],
      default: "pending",
    },

    // Linked post if drafted
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
    },

    // AI drafted content
    draftedContent: { type: String, default: "" },

    detectedAt: { type: Date, default: Date.now },
    dismissedAt: { type: Date },
  },
  { timestamps: true }
);

milestoneSchema.index({ userId: 1, detectedAt: -1 });
milestoneSchema.index({ userId: 1, status: 1 });

const Milestone = mongoose.model("Milestone", milestoneSchema);
export default Milestone;
