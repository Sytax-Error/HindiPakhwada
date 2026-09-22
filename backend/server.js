require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const competitionRoutes = require("./routes/competitionRoutes");
const participationRoutes = require("./routes/participationRoutes");
const adminRoutes = require("./routes/adminRoutes");
const certificateRoutes = require("./routes/certificateRoutes");
const settingsRoutes = require("./routes/settingsRoutes");
const galleryRoutes = require("./routes/galleryRoutes");
const publicGalleryRoutes = require("./routes/publicGalleryRoutes");

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || "*" }));
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRoutes);
app.use("/api/competitions", competitionRoutes);
app.use("/api/participations", participationRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/certificates", certificateRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/gallery", publicGalleryRoutes);
app.use("/api/admin/gallery", galleryRoutes);

// 404 handler
app.use((req, res) => res.status(404).json({ message: "Route not found" }));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: "Internal server error" });
});

const PORT = process.env.PORT || 5001;
const HOST = process.env.HOST || "0.0.0.0";

connectDB().then(() => {
  app.listen(PORT, HOST, () => console.log(`Server running at http://${HOST}:${PORT}`));
});
