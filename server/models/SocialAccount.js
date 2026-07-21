import mongoose from "mongoose";

const socialAccountSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    platform: {
      type: String,
      enum: ["twitter", "linkedin"],
      required: true,
    },
    platformUserId: { type: String, required: true },
    username:       { type: String, required: true },
    displayName:    { type: String },
    profileImage:   { type: String },
    accessToken:    { type: String, select: true },
    refreshToken:   { type: String },
    tokenExpiresAt: { type: Date },
    isActive:       { type: Boolean, default: true },
    connectedAt:    { type: Date, default: Date.now },
  },
  { timestamps: true }
);

socialAccountSchema.index({ userId: 1, platform: 1 }, { unique: true });

const SocialAccount = mongoose.model("SocialAccount", socialAccountSchema);
export default SocialAccount;