const express = require("express");
const { body, param, validationResult } = require("express-validator");
const Participation = require("../models/Participation");
const Competition = require("../models/Competition");
const User = require("../models/User");
const { protect } = require("../middleware/auth");
const { adminOnly } = require("../middleware/auth");
const { streamAttendancePdf } = require("../utils/generateAttendancePdf");

const router = express.Router();

function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg });
  }
  next();
}

// POST /api/participations  { competitionId }  — logged-in user registers/enrolls
router.post(
  "/",
  protect,
  body("competitionId").isMongoId().withMessage("मान्य प्रतियोगिता आवश्यक है।"),
  handleValidation,
  async (req, res) => {
    try {
      if (req.user.role === "admin") {
        return res.status(403).json({ message: "Admin users cannot participate in competitions" });
      }

      const { competitionId } = req.body;
      const competition = await Competition.findById(competitionId);
      
      if (!competition || !competition.isActive) {
        return res.status(404).json({ message: "Competition not found" });
      }
      if (new Date() > new Date(competition.registrationDeadline)) {
        return res.status(400).json({ message: "नामांकन की अंतिम तिथि समाप्त हो चुकी है।" });
      }

      const existing = await Participation.findOne({ user: req.user._id, competition: competitionId });
      if (existing) {
        return res.status(409).json({ message: "आप पहले से इस प्रतियोगिता में पंजीकृत हैं।" });
      }

      const participation = await Participation.create({
        user: req.user._id,
        competition: competitionId,
      });

      res.status(201).json({ participation, message: "पंजीकरण सफलतापूर्वक हुआ।" });
    } catch (err) {
      res.status(500).json({ message: "Registration failed", error: err.message });
    }
  }
);

// GET /api/participations/mine  — logged-in user's participations + results
router.get("/mine", protect, async (req, res) => {
  try {
    const participations = await Participation.find({ user: req.user._id })
      .populate("competition")
      .sort({ createdAt: -1 });
    res.json({ participations });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch participations", error: err.message });
  }
});

// POST /api/participations/attendance/:competitionId  { employeeCode }
// Public scan flow: only an already enrolled participant can check in.
router.post(
  "/attendance/:competitionId",
  param("competitionId").isMongoId().withMessage("अमान्य प्रतियोगिता आईडी।"),
  body("employeeCode").matches(/^\d{6}$/).withMessage("इम्प्लोयी कोड 6 अंकों का होना चाहिए।"),
  handleValidation,
  async (req, res) => {
    try {
      const user = await User.findOne({ employeeCode: req.body.employeeCode.trim() });
      if (!user) return res.status(404).json({ message: "इस इम्प्लोयी कोड से कोई पंजीकृत प्रतिभागी नहीं मिला।" });

      const participation = await Participation.findOne({
        user: user._id,
        competition: req.params.competitionId,
      }).populate("competition", "name");
      if (!participation) {
        return res.status(403).json({ message: "आप इस प्रतियोगिता के लिए पंजीकृत नहीं हैं।" });
      }

      const alreadyAttended = Boolean(participation.attendedAt);
      if (!alreadyAttended) {
        participation.attendedAt = new Date();
        await participation.save();
      }

      res.json({
        message: alreadyAttended ? "उपस्थिति पहले से दर्ज है।" : "उपस्थिति दर्ज हो गई।",
        participant: { name: user.name, email: user.email, attendedAt: participation.attendedAt },
      });
    } catch (err) {
      res.status(500).json({ message: "उपस्थिति दर्ज नहीं हो सकी।", error: err.message });
    }
  }
);

// GET /api/participations/competition/:competitionId/attendance-pdf
router.get(
  "/competition/:competitionId/attendance-pdf",
  protect,
  adminOnly,
  param("competitionId").isMongoId().withMessage("अमान्य प्रतियोगिता आईडी।"),
  handleValidation,
  async (req, res) => {
    try {
      const competition = await Competition.findById(req.params.competitionId).lean();
      if (!competition) return res.status(404).json({ message: "Competition not found" });
      const participants = await Participation.find({
        competition: req.params.competitionId,
        attendedAt: { $ne: null },
      }).populate("user", "name email employeeCode").sort({ attendedAt: 1 }).lean();
      streamAttendancePdf({ res, competition, participants });
    } catch (err) {
      console.error("Attendance PDF route failed:", err);
      res.status(500).json({ message: "उपस्थिति PDF नहीं बन सकी।", error: err.message });
    }
  }
);

// GET /api/participations/competition/:competitionId/participants-pdf
router.get(
  "/competition/:competitionId/participants-pdf",
  protect,
  adminOnly,
  param("competitionId").isMongoId().withMessage("अमान्य प्रतियोगिता आईडी।"),
  handleValidation,
  async (req, res) => {
    try {
      const competition = await Competition.findById(req.params.competitionId).lean();
      if (!competition) return res.status(404).json({ message: "Competition not found" });
      const participants = await Participation.find({ competition: req.params.competitionId })
        .populate("user", "name email employeeCode")
        .sort({ registeredAt: 1 })
        .lean();
      streamAttendancePdf({ res, competition, participants, allParticipants: true });
    } catch (err) {
      console.error("Participants PDF route failed:", err);
      res.status(500).json({ message: "प्रतिभागी PDF नहीं बन सकी।", error: err.message });
    }
  }
);

// GET /api/participations/results/:competitionId — public declared winners
router.get(
  "/results/:competitionId",
  param("competitionId").isMongoId().withMessage("अमान्य प्रतियोगिता आईडी।"),
  handleValidation,
  async (req, res) => {
    try {
      const participations = await Participation.find({
        competition: req.params.competitionId,
        position: { $ne: null },
      })
        .populate("user", "name employeeCode designation office")
        .sort({ position: 1, registeredAt: 1 });
      res.json({ participations });
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch public results", error: err.message });
    }
  }
);

// GET /api/participations/competition/:competitionId  — participants of a competition (admin view, but
// also usable to show public participant counts). Basic info only unless admin.
router.get(
  "/competition/:competitionId",
  protect,
  param("competitionId").isMongoId().withMessage("अमान्य प्रतियोगिता आईडी।"),
  handleValidation,
  async (req, res) => {
    try {
      const filter = { competition: req.params.competitionId };
      const query = Participation.find(filter).populate("user", "name email employeeCode designation office");
      if (req.user.role !== "admin") {
        // non-admin only sees their own record for this competition
        const mine = await Participation.findOne({ ...filter, user: req.user._id }).populate(
          "user",
          "name email employeeCode designation office"
        );
        return res.json({ participations: mine ? [mine] : [] });
      }
      const participations = await query.sort({ registeredAt: 1 });
      res.json({ participations });
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch participants", error: err.message });
    }
  }
);

module.exports = router;
