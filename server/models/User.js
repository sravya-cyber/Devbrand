import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: 50,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email format"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
      select: false,
    },
    avatar: { type: String, default: "" },
    bio: { type: String, default: "", maxlength: 200 },
    refreshToken: { type: String, select: false },

    // Connected coding profiles
    codingProfiles: {
      github: {
        username: String,
        accessToken: { type: String, select: false },
        connectedAt: Date,
      },
      codeforces: {
        handle: String,
        connectedAt: Date,
      },
      leetcode: {
        username: String,
        connectedAt: Date,
      },
    },

    // Cached stats (updated by cron)
    stats: {
      codeforces: {
        rating: { type: Number, default: 0 },
        rank: { type: String, default: "" },
        maxRating: { type: Number, default: 0 },
        maxRank: { type: String, default: "" },
        problemsSolved: { type: Number, default: 0 },
        contestsParticipated: { type: Number, default: 0 },
        lastUpdated: Date,
      },
      leetcode: {
        totalSolved: { type: Number, default: 0 },
        easySolved: { type: Number, default: 0 },
        mediumSolved: { type: Number, default: 0 },
        hardSolved: { type: Number, default: 0 },
        streak: { type: Number, default: 0 },
        ranking: { type: Number, default: 0 },
        lastUpdated: Date,
      },
      github: {
        publicRepos: { type: Number, default: 0 },
        followers: { type: Number, default: 0 },
        totalStars: { type: Number, default: 0 },
        currentStreak: { type: Number, default: 0 },
        lastUpdated: Date,
      },
    },

    // Notification preferences
    notifications: {
      milestones: { type: Boolean, default: true },
      postPublished: { type: Boolean, default: true },
      postFailed: { type: Boolean, default: true },
      weeklyDigest: { type: Boolean, default: true },
    },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare passwords
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Remove sensitive fields from JSON output
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.refreshToken;
  return obj;
};

const User = mongoose.model("User", userSchema);
export default User;
