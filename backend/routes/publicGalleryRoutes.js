const express = require("express");
const GalleryCategory = require("../models/Gallery");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const categories = await GalleryCategory.find({ isActive: true })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ categories });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch public gallery" });
  }
});

module.exports = router;