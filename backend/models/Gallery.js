const mongoose = require("mongoose");

const photoSchema = new mongoose.Schema(
  {
    filename: { type: String, required: true, trim: true },
    originalName: { type: String, required: true, trim: true },
    path: { type: String, required: true, trim: true },
    size: { type: Number },
    mimeType: { type: String },
    uploadedAt: { type: Date, default: Date.now },
    order: { type: Number, default: 0 },
  },
  { _id: true }
);

const galleryCategorySchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, trim: true },
    title: { type: String, required: true, trim: true },
    subtitle: { type: String, trim: true, default: "" },
    folder: { type: String, required: true, trim: true },
    photos: [photoSchema],
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("GalleryCategory", galleryCategorySchema);