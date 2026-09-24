const mongoose = require("mongoose");

const socialPostSchema = new mongoose.Schema(
  {
    platform: {
      type: String,
      enum: ["facebook"],
      default: "facebook",
      required: true,
    },
    url: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    title: {
      type: String,
      default: "",
      trim: true,
      maxlength: 200,
    },
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
      required: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
      min: 0,
      validate: Number.isInteger,
    },
    publishedAt: {
      type: Date,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SocialPost", socialPostSchema);
