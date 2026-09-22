const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const GalleryCategory = require("../models/Gallery");
const { protect, adminOnly } = require("../middleware/auth");

const router = express.Router();
router.use(protect, adminOnly);

const galleryRoot = path.join(__dirname, "../../frontend/public/assets/gallery");
const legacyGalleryRoot = path.join(__dirname, "../../public/assets/gallery");

function validateCategoryInput({ id, title, subtitle = "", eventDate, folder, order = 0 }) {
  const errors = {};
  if (id !== undefined && (!String(id).trim() || !/^[a-zA-Z0-9_-]{1,100}$/.test(String(id)))) {
    errors.id = "ID may contain only letters, numbers, hyphens, and underscores.";
  }
  if (!String(title || "").trim() || String(title).trim().length < 2 || String(title).trim().length > 150) {
    errors.title = "Title must be between 2 and 150 characters.";
  }
  if (String(subtitle).length > 250) errors.subtitle = "Subtitle cannot exceed 250 characters.";
  if (!eventDate || Number.isNaN(Date.parse(eventDate))) errors.eventDate = "A valid event date is required.";
  if (folder !== undefined && (!String(folder).trim() || !/^[a-zA-Z0-9_-]{1,100}$/.test(String(folder)))) {
    errors.folder = "Folder may contain only letters, numbers, hyphens, and underscores.";
  }
  if (!Number.isInteger(Number(order)) || Number(order) < 0) errors.order = "Order must be a non-negative integer.";
  return errors;
}

function removeGalleryFile(categoryFolder, filename) {
  [galleryRoot, legacyGalleryRoot].forEach((root) => {
    const filePath = path.join(root, categoryFolder, filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  });
}

function removeGalleryFolder(folder) {
  [galleryRoot, legacyGalleryRoot].forEach((root) => {
    const folderPath = path.join(root, folder);
    if (fs.existsSync(folderPath)) {
      fs.rmSync(folderPath, { recursive: true, force: true });
    }
  });
}

// Configure multer for photo uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    GalleryCategory.findById(req.params.categoryId)
      .then((category) => {
        if (!category) {
          cb(new Error("Category not found"), null);
          return;
        }
        const uploadPath = path.join(galleryRoot, category.folder);
        fs.mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
      })
      .catch((err) => cb(err, null));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: function (req, file, cb) {
    const allowedTypes = {
      ".jpg": ["image/jpeg", "image/jpg"],
      ".jpeg": ["image/jpeg", "image/jpg"],
      ".png": ["image/png"],
      ".webp": ["image/webp"],
    };
    const extension = path.extname(file.originalname).toLowerCase();
    if (allowedTypes[extension]?.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only images (jpeg, jpg, png, webp) are allowed"));
    }
  },
});

function uploadPhotosMiddleware(req, res, next) {
  upload.array("photos", 20)(req, res, (err) => {
    if (err) {
      return res.status(400).json({ message: err.message || "Invalid photo upload" });
    }
    next();
  });
}

// GET /api/admin/gallery - Get all gallery categories with photos
router.get("/", async (req, res) => {
  try {
    const categories = await GalleryCategory.find({ isActive: true }).sort({ eventDate: -1, createdAt: -1 });
    res.json({ categories });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch gallery", error: err.message });
  }
});

// POST /api/admin/gallery - Create new category
router.post("/", async (req, res) => {
  try {
    const { id, title, subtitle, eventDate, folder, order } = req.body;
    const validationErrors = validateCategoryInput({ id, title, subtitle, eventDate, folder, order });
    if (Object.keys(validationErrors).length > 0) {
      return res.status(400).json({ message: "Please correct the gallery fields.", errors: validationErrors });
    }

    const existing = await GalleryCategory.findOne({ id });
    if (existing) {
      return res.status(400).json({ message: "Category with this ID already exists" });
    }

    const category = await GalleryCategory.create({
      id,
      title,
      subtitle: subtitle || "",
      eventDate: eventDate || null,
      folder,
      order: order || 0,
      photos: [],
    });

    // Create the folder in public/assets/gallery
    const folderPath = path.join(galleryRoot, folder);
    fs.mkdirSync(folderPath, { recursive: true });

    res.status(201).json({ message: "Category created successfully", category });
  } catch (err) {
    res.status(500).json({ message: "Failed to create category", error: err.message });
  }
});

// PUT /api/admin/gallery/:categoryId - Update category
router.put("/:categoryId", async (req, res) => {
  try {
    const { title, subtitle, eventDate, folder, order, isActive } = req.body;
    const validationErrors = validateCategoryInput({ title, subtitle, eventDate, folder, order });
    if (Object.keys(validationErrors).length > 0) {
      return res.status(400).json({ message: "Please correct the gallery fields.", errors: validationErrors });
    }

    const category = await GalleryCategory.findByIdAndUpdate(
      req.params.categoryId,
      { title: String(title).trim(), subtitle: String(subtitle || "").trim(), eventDate, ...(folder ? { folder } : {}), ...(order !== undefined ? { order } : {}), ...(isActive !== undefined ? { isActive: Boolean(isActive) } : {}) },
      { new: true, runValidators: true }
    );

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.json({ message: "Category updated successfully", category });
  } catch (err) {
    res.status(500).json({ message: "Failed to update category", error: err.message });
  }
});

// DELETE /api/admin/gallery/:categoryId - Delete category
router.delete("/:categoryId", async (req, res) => {
  try {
    const category = await GalleryCategory.findByIdAndDelete(req.params.categoryId);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    removeGalleryFolder(category.folder);

    res.json({ message: "Category deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete category", error: err.message });
  }
});

// POST /api/admin/gallery/:categoryId/photos - Upload photos to category
router.post("/:categoryId/photos", uploadPhotosMiddleware, async (req, res) => {
  try {
    const category = await GalleryCategory.findById(req.params.categoryId);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No photos uploaded" });
    }

    const newPhotos = req.files.map((file, index) => ({
      filename: file.filename,
      originalName: file.originalname,
      path: `/assets/gallery/${category.folder}/${file.filename}`,
      size: file.size,
      mimeType: file.mimetype,
      order: category.photos.length + index,
    }));

    category.photos.push(...newPhotos);
    await category.save();

    res.json({ message: "Photos uploaded successfully", photos: newPhotos });
  } catch (err) {
    res.status(500).json({ message: "Failed to upload photos", error: err.message });
  }
});

// DELETE /api/admin/gallery/:categoryId/photos/:photoId - Delete photo
router.delete("/:categoryId/photos/:photoId", async (req, res) => {
  try {
    const category = await GalleryCategory.findById(req.params.categoryId);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    const photo = category.photos.id(req.params.photoId);
    if (!photo) {
      return res.status(404).json({ message: "Photo not found" });
    }

    removeGalleryFile(category.folder, photo.filename);

    category.photos.pull(req.params.photoId);
    await category.save();

    res.json({ message: "Photo deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete photo", error: err.message });
  }
});

// PUT /api/admin/gallery/:categoryId/photos/reorder - Reorder photos
router.put("/:categoryId/photos/reorder", async (req, res) => {
  try {
    const { photoOrders } = req.body; // Array of { photoId, order }
    
    const category = await GalleryCategory.findById(req.params.categoryId);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    photoOrders.forEach(({ photoId, order }) => {
      const photo = category.photos.id(photoId);
      if (photo) {
        photo.order = order;
      }
    });

    // Sort photos by order
    category.photos.sort((a, b) => a.order - b.order);
    await category.save();

    res.json({ message: "Photos reordered successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to reorder photos", error: err.message });
  }
});

module.exports = router;