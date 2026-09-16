const express = require("express");
const { body, validationResult } = require("express-validator");
const Competition = require("../models/Competition");
const Participation = require("../models/Participation");
const User = require("../models/User");
const { protect, adminOnly } = require("../middleware/auth");

const router = express.Router();
router.use(protect, adminOnly);

const POSITION_TITLES = { first: "प्रथम", second: "द्वितीय", third: "तृतीय" };

function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg });
  }
  next();
}

// GET /api/admin/stats
router.get("/stats", async (req, res) => {
  try {
    const [competitions, users, participations] = await Promise.all([
      Competition.countDocuments({ isActive: true }),
      User.countDocuments({ role: "user" }),
      Participation.countDocuments(),
    ]);
    res.json({ competitions, users, participations });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch stats", error: err.message });
  }
});

// POST /api/admin/declare-winners
// body: { competitionId, results: [{ participationId, position, remarks }] }
// position one of: first | second | third | consolation | null (to clear)
router.post(
  "/declare-winners",
  [
    body("competitionId").isMongoId().withMessage("मान्य प्रतियोगिता आवश्यक है।"),
    body("results").isArray({ min: 1 }).withMessage("परिणाम सूची खाली नहीं हो सकती।"),
    body("results.*.participationId").isMongoId().withMessage("मान्य प्रतिभागी आईडी आवश्यक है।"),
    body("results.*.position")
      .optional({ nullable: true, checkFalsy: true })
      .isIn(["first", "second", "third", "consolation"])
      .withMessage("अमान्य पुरस्कार श्रेणी।"),
    body("results.*.remarks").optional({ checkFalsy: true }).isLength({ max: 300 }).withMessage("टिप्पणी बहुत लंबी है।"),
  ],
  handleValidation,
  async (req, res) => {
    try {
      const { competitionId, results } = req.body;

      const competition = await Competition.findById(competitionId);
      if (!competition) return res.status(404).json({ message: "Competition not found" });

      // Business rule: only one winner each for first / second / third per competition
      // (consolation may have multiple winners).
      const seen = {};
      for (const r of results) {
        if (r.position && POSITION_TITLES[r.position]) {
          if (seen[r.position]) {
            return res.status(400).json({
              message: `एक प्रतियोगिता में केवल एक ही प्रतिभागी को ${POSITION_TITLES[r.position]} पुरस्कार दिया जा सकता है।`,
            });
          }
          seen[r.position] = true;
        }
      }

      const bulkOps = results
        .filter((r) => r.participationId)
        .map((r) => ({
          updateOne: {
            filter: { _id: r.participationId, competition: competitionId },
            update: { position: r.position || null, remarks: r.remarks || "" },
          },
        }));

      if (bulkOps.length) {
        await Participation.bulkWrite(bulkOps);
      }

      competition.resultsDeclared = true;
      await competition.save();

      res.json({ message: "Results declared successfully", competition });
    } catch (err) {
      res.status(500).json({ message: "Failed to declare winners", error: err.message });
    }
  }
);

module.exports = router;
