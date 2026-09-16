const express = require("express");
const Participation = require("../models/Participation");
const { protect } = require("../middleware/auth");
const { streamCertificate } = require("../utils/generateCertificate");
const SiteSettings = require("../models/SiteSettings");

const router = express.Router();

// GET /api/certificates/:participationId
// A user can download their own certificate if they won a position.
// Admin can download any certificate.
router.get("/:participationId", protect, async (req, res) => {
  try {
    const participation = await Participation.findById(req.params.participationId)
      .populate("user")
      .populate("competition");

    if (!participation) return res.status(404).json({ message: "Participation not found" });

    const isOwner = participation.user._id.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized to download this certificate" });
    }

    if (!participation.position) {
      return res.status(400).json({ message: "No award declared yet for this participation" });
    }

    participation.certificateIssued = true;
    await participation.save();
    const settings = await SiteSettings.findOne({ key: "main" }).lean();

    await streamCertificate({
      res,
      user: participation.user,
      competition: participation.competition,
      position: participation.position,
      dateRangeLabel: settings?.pakhwadaDateRangeLabel,
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to generate certificate", error: err.message });
  }
});

module.exports = router;
