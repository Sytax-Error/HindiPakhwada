const mongoose = require("mongoose");

const competitionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true }, // e.g. हिंदी निबन्ध लेखन प्रतियोगिता
    description: { type: String, trim: true },
    date: { type: Date, required: true },
    time: { type: String, default: "2:30 PM" },
    duration: { type: String, default: "" }, // e.g. "1 घंटा", "30 मिनट"
    minParticipants: { type: Number, default: 9 },
    registrationDeadline: { type: Date, required: true },
    resultsDeclared: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Competition", competitionSchema);
