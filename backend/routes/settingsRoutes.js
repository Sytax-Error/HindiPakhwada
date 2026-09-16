const express = require("express");
const SiteSettings = require("../models/SiteSettings");
const { protect, adminOnly } = require("../middleware/auth");

const router = express.Router();

const defaults = {
  pakhwadaDateRangeLabel:
    process.env.PAKHWADA_DATE_RANGE_LABEL || "14 से 28 सितंबर, 2025",
  registrationDeadlineLabel: "18 सितम्बर 2025, 06:00 PM",
};

router.get("/", async (req, res) => {
  try {
    const settings = (await SiteSettings.findOne({ key: "main" }).lean()) || {
      ...defaults,
    };
    res.json({ settings });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch site settings" });
  }
});

router.put("/", protect, adminOnly, async (req, res) => {
  const pakhwadaDateRangeLabel = String(req.body.pakhwadaDateRangeLabel || "").trim();
  const registrationDeadlineLabel = String(req.body.registrationDeadlineLabel || "").trim();

  if (!pakhwadaDateRangeLabel || !registrationDeadlineLabel) {
    return res.status(400).json({ message: "दोनों दिनांक भरना आवश्यक है।" });
  }

  try {
    const settings = await SiteSettings.findOneAndUpdate(
      { key: "main" },
      { key: "main", pakhwadaDateRangeLabel, registrationDeadlineLabel },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );
    res.json({ message: "दिनांक सफलतापूर्वक अपडेट की गई।", settings });
  } catch (err) {
    res.status(500).json({ message: "Failed to update site settings", error: err.message });
  }
});

module.exports = router;
