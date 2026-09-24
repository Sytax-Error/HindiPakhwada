const express = require("express");
const { body, validationResult } = require("express-validator");
const SocialPost = require("../models/SocialPost");
const { protect, adminOnly } = require("../middleware/auth");

const publicRouter = express.Router();
const adminRouter = express.Router();

function normalizeFacebookUrl(input) {
  if (!input) return "";
  return String(input).trim();
}

function isLikelyFacebookPostUrl(url) {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    if (!host.includes("facebook.com")) return false;
    const pathname = parsed.pathname.toLowerCase();
    return pathname.includes("/posts/") || pathname.includes("/photo") || pathname.includes("/photos/");
  } catch (err) {
    return false;
  }
}

function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg });
  }
  next();
}

publicRouter.get("/", async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(12, Math.max(1, Number(req.query.limit) || 1));
    const skip = (page - 1) * limit;

    const query = { platform: "facebook", status: "published", isActive: true };

    const [posts, total] = await Promise.all([
      SocialPost.find(query)
        .sort({ sortOrder: 1, publishedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      SocialPost.countDocuments(query),
    ]);

    const hasMore = page * limit < total;

    res.json({ posts, page, limit, total, hasMore });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch social posts", error: err.message });
  }
});

adminRouter.use(protect, adminOnly);

adminRouter.get("/", async (req, res) => {
  try {
    const posts = await SocialPost.find({ platform: "facebook" })
      .sort({ sortOrder: 1, publishedAt: -1, createdAt: -1 })
      .lean();

    res.json({ posts });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch admin social posts", error: err.message });
  }
});

adminRouter.post(
  "/",
  [
    body("url").trim().notEmpty().withMessage("Facebook URL is required."),
    body("url").custom((value) => {
      const normalized = normalizeFacebookUrl(value);
      if (!isLikelyFacebookPostUrl(normalized)) {
        throw new Error("Please enter a valid public Facebook post URL.");
      }
      return true;
    }),
    body("title").optional().trim().isLength({ max: 200 }).withMessage("Title must be 200 characters or less."),
    body("status").optional().isIn(["draft", "published", "archived"]).withMessage("Invalid status."),
    body("sortOrder").optional().isInt({ min: 0 }).withMessage("Sort order must be a non-negative integer."),
  ],
  handleValidation,
  async (req, res) => {
    try {
      const normalizedUrl = normalizeFacebookUrl(req.body.url);
      const existing = await SocialPost.findOne({ url: normalizedUrl, platform: "facebook" });
      if (existing) {
        return res.status(400).json({ message: "This Facebook post is already added." });
      }

      const post = await SocialPost.create({
        platform: "facebook",
        url: normalizedUrl,
        title: String(req.body.title || "").trim(),
        status: req.body.status || "published",
        sortOrder: Number(req.body.sortOrder || 0),
        publishedAt: req.body.publishedAt ? new Date(req.body.publishedAt) : new Date(),
        isActive: req.body.isActive !== undefined ? Boolean(req.body.isActive) : true,
        createdBy: req.user?._id || null,
      });

      res.status(201).json({ message: "Facebook post added successfully", post });
    } catch (err) {
      res.status(500).json({ message: "Failed to create social post", error: err.message });
    }
  }
);

adminRouter.put(
  "/:id",
  [
    body("url").optional().trim().notEmpty().withMessage("Facebook URL is required."),
    body("url").optional().custom((value) => {
      const normalized = normalizeFacebookUrl(value);
      if (!isLikelyFacebookPostUrl(normalized)) {
        throw new Error("Please enter a valid public Facebook post URL.");
      }
      return true;
    }),
    body("title").optional().trim().isLength({ max: 200 }).withMessage("Title must be 200 characters or less."),
    body("status").optional().isIn(["draft", "published", "archived"]).withMessage("Invalid status."),
    body("sortOrder").optional().isInt({ min: 0 }).withMessage("Sort order must be a non-negative integer."),
  ],
  handleValidation,
  async (req, res) => {
    try {
      const post = await SocialPost.findById(req.params.id);
      if (!post) {
        return res.status(404).json({ message: "Social post not found" });
      }

      if (req.body.url) {
        const normalizedUrl = normalizeFacebookUrl(req.body.url);
        const duplicate = await SocialPost.findOne({
          _id: { $ne: post._id },
          url: normalizedUrl,
          platform: "facebook",
        });
        if (duplicate) {
          return res.status(400).json({ message: "This Facebook post is already added." });
        }
        post.url = normalizedUrl;
      }

      if (req.body.title !== undefined) post.title = String(req.body.title || "").trim();
      if (req.body.status) post.status = req.body.status;
      if (req.body.sortOrder !== undefined) post.sortOrder = Number(req.body.sortOrder);
      if (req.body.publishedAt) post.publishedAt = new Date(req.body.publishedAt);
      if (req.body.isActive !== undefined) post.isActive = Boolean(req.body.isActive);

      await post.save();
      res.json({ message: "Facebook post updated successfully", post });
    } catch (err) {
      res.status(500).json({ message: "Failed to update social post", error: err.message });
    }
  }
);

adminRouter.delete("/:id", async (req, res) => {
  try {
    const deleted = await SocialPost.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Social post not found" });
    }

    res.json({ message: "Facebook post deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete social post", error: err.message });
  }
});

module.exports = { publicRouter, adminRouter };
