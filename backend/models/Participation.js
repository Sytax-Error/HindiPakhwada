const mongoose = require("mongoose");

const participationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    competition: { type: mongoose.Schema.Types.ObjectId, ref: "Competition", required: true },
    registeredAt: { type: Date, default: Date.now },
    attendedAt: { type: Date, default: null },
    // Result fields — set by admin when declaring winners
    position: {
      type: String,
      enum: ["first", "second", "third", "consolation", null],
      default: null,
    },
    remarks: { type: String, trim: true },
    certificateIssued: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// A user can register only once per competition
participationSchema.index({ user: 1, competition: 1 }, { unique: true });

module.exports = mongoose.model("Participation", participationSchema);
