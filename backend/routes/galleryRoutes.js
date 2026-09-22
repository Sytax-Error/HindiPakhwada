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
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error("Only images (jpeg, jpg, png, webp) are allowed"));
    }
  },
});

// GET /api/admin/gallery - Get all gallery categories with photos
router.get("/", async (req, res) => {
  try {
    const categories = await GalleryCategory.find({ isActive: true }).sort({ createdAt: -1 });
    res.json({ categories });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch gallery", error: err.message });
  }
});

// POST /api/admin/gallery - Create new category
router.post("/", async (req, res) => {
  try {
    const { id, title, subtitle, folder, order } = req.body;
    
    if (!id || !title || !folder) {
      return res.status(400).json({ message: "ID, title, and folder are required" });
    }

    const existing = await GalleryCategory.findOne({ id });
    if (existing) {
      return res.status(400).json({ message: "Category with this ID already exists" });
    }

    const category = await GalleryCategory.create({
      id,
      title,
      subtitle: subtitle || "",
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
    const { title, subtitle, folder, order, isActive } = req.body;
    
    const category = await GalleryCategory.findByIdAndUpdate(
      req.params.categoryId,
      { title, subtitle, folder, order, isActive },
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
router.post("/:categoryId/photos", upload.array("photos", 20), async (req, res) => {
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