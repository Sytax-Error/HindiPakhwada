const express = require("express");
const { body, param, validationResult } = require("express-validator");
const Competition = require("../models/Competition");
const Participation = require("../models/Participation");
const { protect, adminOnly } = require("../middleware/auth");
const { streamCompetitionSheet } = require("../utils/generateCompetitionSheet");

const router = express.Router();

function deadlineNotAfterCompetitionDay(req) {
  if (!req.body.date || !req.body.registrationDeadline) return true;
  const compDateEnd = new Date(req.body.date);
  compDateEnd.setHours(23, 59, 59, 999);
  const deadline = new Date(req.body.registrationDeadline);
  if (deadline > compDateEnd) {
    throw new Error("नामांकन अंतिम तिथि प्रतियोगिता की तारीख के बाद नहीं हो सकती।");
  }
  return true;
}

const createValidators = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("प्रतियोगिता का नाम आवश्यक है।")
    .isLength({ min: 3 })
    .withMessage("नाम कम से कम 3 अक्षर का होना चाहिए।"),
  body("description").optional({ checkFalsy: true }).isLength({ max: 1000 }).withMessage("विवरण बहुत लंबा है।"),
  body("date").notEmpty().withMessage("दिनांक आवश्यक है।").isISO8601().withMessage("मान्य दिनांक दर्ज करें।"),
  body("registrationDeadline")
    .notEmpty()
    .withMessage("नामांकन अंतिम तिथि आवश्यक है।")
    .isISO8601()
    .withMessage("मान्य दिनांक/समय दर्ज करें।"),
  body("minParticipants")
    .optional({ checkFalsy: true })
    .isInt({ min: 1 })
    .withMessage("न्यूनतम प्रतियोगी संख्या 1 या अधिक होनी चाहिए।"),
  body().custom((_, { req }) => deadlineNotAfterCompetitionDay(req)),
];

const updateValidators = [
  body("name").optional().trim().isLength({ min: 3 }).withMessage("नाम कम से कम 3 अक्षर का होना चाहिए।"),
  body("description").optional({ checkFalsy: true }).isLength({ max: 1000 }).withMessage("विवरण बहुत लंबा है।"),
  body("date").optional().isISO8601().withMessage("मान्य दिनांक दर्ज करें।"),
  body("registrationDeadline").optional().isISO8601().withMessage("मान्य दिनांक/समय दर्ज करें।"),
  body("minParticipants").optional({ checkFalsy: true }).isInt({ min: 1 }).withMessage("न्यूनतम प्रतियोगी संख्या 1 या अधिक होनी चाहिए।"),
  body().custom((_, { req }) => deadlineNotAfterCompetitionDay(req)),
];

function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg });
  }
  next();
}

// GET /api/competitions  (public list, active competitions)
router.get("/", async (req, res) => {
  try {
    const competitions = await Competition.find({ isActive: true }).sort({ date: 1 });
    res.json({ competitions });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch competitions", error: err.message });
  }
});

// GET /api/competitions/:id/blank-sheet
router.get(
  "/:id/blank-sheet",
  param("id").isMongoId().withMessage("अमान्य प्रतियोगिता आईडी।"),
  handleValidation,
  async (req, res) => {
    try {
      const competition = await Competition.findOne({ _id: req.params.id, isActive: true }).lean();
      if (!competition) return res.status(404).json({ message: "Competition not found" });
      streamCompetitionSheet({ res, competition });
    } catch (err) {
      res.status(500).json({ message: "Blank sheet नहीं बन सकी।", error: err.message });
    }
  }
);

// GET /api/competitions/:id
router.get("/:id", param("id").isMongoId().withMessage("अमान्य प्रतियोगिता आईडी।"), handleValidation, async (req, res) => {
  try {
    const competition = await Competition.findById(req.params.id);
    if (!competition) return res.status(404).json({ message: "Competition not found" });
    const participantCount = await Participation.countDocuments({ competition: competition._id });
    res.json({ competition, participantCount });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch competition", error: err.message });
  }
});

// POST /api/competitions  (admin only)
router.post("/", protect, adminOnly, createValidators, handleValidation, async (req, res) => {
  try {
    const competition = await Competition.create(req.body);
    res.status(201).json({ competition });
  } catch (err) {
    res.status(500).json({ message: "Failed to create competition", error: err.message });
  }
});

// PUT /api/competitions/:id  (admin only)
router.put(
  "/:id",
  protect,
  adminOnly,
  param("id").isMongoId().withMessage("अमान्य प्रतियोगिता आईडी।"),
  updateValidators,
  handleValidation,
  async (req, res) => {
    try {
      const competition = await Competition.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      });
      if (!competition) return res.status(404).json({ message: "Competition not found" });
      res.json({ competition });
    } catch (err) {
      res.status(500).json({ message: "Failed to update competition", error: err.message });
    }
  }
);

// DELETE /api/competitions/:id  (admin only) — soft delete
router.delete(
  "/:id",
  protect,
  adminOnly,
  param("id").isMongoId().withMessage("अमान्य प्रतियोगिता आईडी।"),
  handleValidation,
  async (req, res) => {
    try {
      const competition = await Competition.findByIdAndUpdate(
        req.params.id,
        { isActive: false },
        { new: true }
      );
      if (!competition) return res.status(404).json({ message: "Competition not found" });
      res.json({ message: "Competition deactivated", competition });
    } catch (err) {
      res.status(500).json({ message: "Failed to delete competition", error: err.message });
    }
  }
);

module.exports = router;
