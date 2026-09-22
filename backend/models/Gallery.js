const mongoose = require("mongoose");

const photoSchema = new mongoose.Schema(
  {
    filename: { type: String, required: true, trim: true, maxlength: 255 },
    originalName: { type: String, required: true, trim: true, maxlength: 255 },
    path: { type: String, required: true, trim: true, maxlength: 500 },
    size: { type: Number, min: 1, max: 10 * 1024 * 1024 },
    mimeType: { type: String, enum: ["image/jpeg", "image/jpg", "image/png", "image/webp"] },
    uploadedAt: { type: Date, default: Date.now },
    order: { type: Number, default: 0, min: 0, validate: Number.isInteger },
  },
  { _id: true }
);

const galleryCategorySchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, trim: true, minlength: 1, maxlength: 100, match: /^[a-zA-Z0-9_-]+$/ },
    title: { type: String, required: true, trim: true, minlength: 2, maxlength: 150 },
    subtitle: { type: String, trim: true, default: "", maxlength: 250 },
    eventDate: { type: Date },
    folder: { type: String, required: true, trim: true, minlength: 1, maxlength: 100, match: /^[a-zA-Z0-9_-]+$/ },
    photos: [photoSchema],
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0, min: 0, validate: Number.isInteger },
  },
  { timestamps: true }
);

module.exports = mongoose.model("GalleryCategory", galleryCategorySchema);