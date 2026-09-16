const mongoose = require("mongoose");

const siteSettingsSchema = new mongoose.Schema(
  {
    key: { type: String, unique: true, default: "main" },
    pakhwadaDateRangeLabel: {
      type: String,
      default: process.env.PAKHWADA_DATE_RANGE_LABEL || "14 से 28 सितंबर, 2026",
      trim: true,
    },
    registrationDeadlineLabel: {
      type: String,
      default: "14 सितम्बर 2026, 06:00 PM",
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SiteSettings", siteSettingsSchema);
