import { useEffect, useRef, useState } from "react";
import { Upload, Loader2, Image, Edit, Trash2, X } from "lucide-react";
import api from "../services/api";

export default function AdminGallery() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const submittingRef = useRef(false);

  async function loadCategories() {
    try {
      const { data } = await api.get("/admin/gallery");
      setCategories(data.categories || []);
    } catch (err) {
      setMessage(err.response?.data?.message || "गैलरी लोड नहीं हो सकी।");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCategories();
  }, []);

  async function uploadPhotos(categoryMongoId, files) {
    const formData = new FormData();
    Array.from(files).forEach((file) => formData.append("photos", file));

    setUploading(true);
    setUploadProgress(0);
    try {
      const { data } = await api.post(`/admin/gallery/${categoryMongoId}/photos`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percent);
        },
      });
      return data.photos;
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }

  async function handlePhotoUpload(files) {
    if (!files || files.length === 0 || !title.trim()) {
      setMessage("मुख्य शीर्षक और कम से कम एक फोटो चुनें।");
      return false;
    }
    
    setMessage("");

    let createdCategoryMongoId = null;
    try {
      const categoryId = `gallery-${Date.now()}`;
      const { data: categoryData } = await api.post("/admin/gallery", {
        id: categoryId,
        title: title.trim(),
        subtitle: subtitle.trim(),
        folder: categoryId,
      });
      createdCategoryMongoId = categoryData.category._id;

      const photos = await uploadPhotos(createdCategoryMongoId, files);
      setMessage(`${photos.length} फोटो अपलोड की गईं।`);
      setSelectedFiles([]);
      setTitle("");
      setSubtitle("");
      await loadCategories();
      return true;
    } catch (err) {
      if (createdCategoryMongoId) {
        await api.delete(`/admin/gallery/${createdCategoryMongoId}`).catch(() => {});
      }
      setMessage(err.response?.data?.message || "फोटो अपलोड नहीं हो सकीं।");
      return false;
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }

  async function handleSave() {
    if (submittingRef.current) return;
    submittingRef.current = true;

    if (editingCategoryId) {
      if (!title.trim()) {
        setMessage("मुख्य शीर्षक आवश्यक है।");
        submittingRef.current = false;
        return;
      }

      try {
        await api.put(`/admin/gallery/${editingCategoryId}`, {
          title: title.trim(),
          subtitle: subtitle.trim(),
        });
        if (selectedFiles.length > 0) {
          const photos = await uploadPhotos(editingCategoryId, selectedFiles);
          setMessage(`विवरण अपडेट हुआ और ${photos.length} फोटो जोड़ी गईं।`);
        } else {
          setMessage("गैलरी entry अपडेट हो गई।");
        }
        cancelEdit();
        await loadCategories();
      } catch (err) {
        setMessage(err.response?.data?.message || "गैलरी entry अपडेट नहीं हो सकी।");
      } finally {
        submittingRef.current = false;
      }
      return;
    }

    try {
      const uploaded = await handlePhotoUpload(selectedFiles);
      if (uploaded) {
        window.location.reload();
      }
    } finally {
      submittingRef.current = false;
    }
  }

  function startEdit(category) {
    setEditingCategoryId(category._id);
    setTitle(category.title);
    setSubtitle(category.subtitle || "");
    setSelectedFiles([]);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingCategoryId(null);
    setTitle("");
    setSubtitle("");
    setSelectedFiles([]);
  }

  async function handleDelete(category) {
    if (!confirm(`क्या आप "${category.title}" entry और उसकी सभी photos हटाना चाहते हैं?`)) return;

    try {
      await api.delete(`/admin/gallery/${category._id}`);
      setMessage("गैलरी entry और photos हटा दी गईं।");
      if (editingCategoryId === category._id) cancelEdit();
      await loadCategories();
    } catch (err) {
      setMessage(err.response?.data?.message || "गैलरी entry हटाई नहीं जा सकी।");
    }
  }

  async function handleDeletePhoto(categoryId, photoId) {
    if (!confirm("क्या आप इस फोटो को हटाना चाहते हैं?")) return;

    try {
      await api.delete(`/admin/gallery/${categoryId}/photos/${photoId}`);
      setMessage("फोटो हटा दी गई।");
      await loadCategories();
    } catch (err) {
      setMessage(err.response?.data?.message || "फोटो हटाई नहीं जा सकी।");
    }
  }

  function handleFileSelect(e) {
    const files = Array.from(e.target.files);
    const validFiles = files.filter(f => f.type.startsWith("image/"));
    if (validFiles.length !== files.length) {
      setMessage("केवल इमेज फाइलें (JPEG, PNG, WebP) चुनें।");
    }
    setSelectedFiles(validFiles);
  }

  const editingCategory = categories.find((category) => category._id === editingCategoryId);

  return (
    <div className="page admin-gallery-simple">
      <h1>गैलरी प्रबंधन</h1>

      {message && <div className="alert alert-info">{message}</div>}

      <div className="category-selector">
        <label>
          <span>मुख्य शीर्षक</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="उदाहरण: हिन्दी पखवाड़ा 2026"
            disabled={uploading}
          />
        </label>
        <label>
          <span>उपशीर्षक</span>
          <input
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            placeholder="उदाहरण: 14 से 28 सितंबर 2026"
            disabled={uploading}
          />
        </label>
      </div>

      <div className="photo-upload-section">
        <div className="upload-section-heading">
          <div>
            <span className="section-kicker">{editingCategoryId ? "प्रविष्टि संपादन" : "नई प्रविष्टि"}</span>
            <h2>{editingCategoryId ? "गैलरी विवरण बदलें" : "नई फोटो गैलरी बनाएं"}</h2>
          </div>
          {editingCategoryId && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={cancelEdit}>
              <X size={16} /> रद्द करें
            </button>
          )}
        </div>
        <label className="upload-area" htmlFor="photo-upload">
          <input
            id="photo-upload"
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            multiple
            onChange={handleFileSelect}
            disabled={uploading}
            style={{ display: "none" }}
          />
          <div className="upload-content">
            <Image size={48} />
            <p className="upload-text">
              {selectedFiles.length > 0
                ? `${selectedFiles.length} फोटो चुनी गईं`
                : "फोटो अपलोड करने के लिए क्लिक करें या खींचकर छोड़ें"}
            </p>
            <p className="upload-hint">JPEG, PNG, WebP • अधिकतम 10MB प्रति फाइल</p>
          </div>
        </label>

        {selectedFiles.length > 0 && (
          <div className="selected-files-preview">
            {selectedFiles.slice(0, 6).map((file, idx) => (
              <div key={idx} className="file-preview">
                <span>{file.name}</span>
                <span>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
              </div>
            ))}
            {selectedFiles.length > 6 && (
              <div className="more-files">+{selectedFiles.length - 6} और फाइलें</div>
            )}
          </div>
        )}

        <div className="upload-actions">
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={uploading || !title.trim() || (!editingCategoryId && selectedFiles.length === 0)}
          >
            {uploading ? (
              <>
                <Loader2 className="spin" size={16} />
                अपलोड हो रहा है... {uploadProgress}%
              </>
            ) : (
              <>
                {editingCategoryId ? <Edit size={16} /> : <Upload size={16} />}
                {editingCategoryId && selectedFiles.length > 0
                  ? "विवरण और फोटो अपडेट करें"
                  : editingCategoryId
                    ? "विवरण अपडेट करें"
                    : "फोटो अपलोड करें"}
              </>
            )}
          </button>
          {selectedFiles.length > 0 && (
            <button
              className="btn btn-ghost"
              onClick={() => setSelectedFiles([])}
              disabled={uploading}
            >
              साफ़ करें
            </button>
          )}
        </div>

        {uploading && (
          <div className="upload-progress">
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${uploadProgress}%` }}></div>
            </div>
          </div>
        )}
      </div>

      {editingCategory && (
        <section className="edit-photo-section">
          <div className="entry-list-heading">
            <div>
              <span className="section-kicker">फोटो प्रबंधन</span>
              <h2>मौजूदा फोटो ({editingCategory.photos.length})</h2>
            </div>
          </div>
          <div className="edit-photo-grid">
            {editingCategory.photos.length === 0 ? (
              <div className="entry-empty">इस entry में अभी कोई फोटो नहीं है।</div>
            ) : (
              editingCategory.photos.map((photo) => (
                <div className="edit-photo-item" key={photo._id}>
                  <img src={photo.path} alt={photo.originalName} />
                  <button
                    type="button"
                    className="btn-icon btn-danger edit-photo-delete"
                    onClick={() => handleDeletePhoto(editingCategory._id, photo._id)}
                    disabled={uploading}
                    title="फोटो हटाएं"
                  >
                    <Trash2 size={16} />
                  </button>
                  <p title={photo.originalName}>{photo.originalName}</p>
                </div>
              ))
            )}
          </div>
        </section>
      )}

      <section className="admin-entry-list">
        <div className="entry-list-heading">
          <div>
            <span className="section-kicker">संग्रहीत प्रविष्टियाँ</span>
            <h2>मौजूदा गैलरी</h2>
          </div>
          <span className="entry-count">{categories.length} प्रविष्टियाँ</span>
        </div>
        {loading ? (
          <div className="entry-empty">गैलरी लोड हो रही है...</div>
        ) : categories.length === 0 ? (
          <div className="entry-empty">अभी कोई dynamic gallery entry नहीं है।</div>
        ) : (
          <div className="admin-entry-grid">
            {categories.map((category) => (
              <article className="admin-entry-card" key={category._id}>
                <div className="admin-entry-thumb">
                  {category.photos[0] ? (
                    <img src={category.photos[0].path} alt="" />
                  ) : (
                    <Image size={22} aria-hidden="true" />
                  )}
                </div>
                <div className="admin-entry-copy">
                  <h3>{category.title}</h3>
                  {category.subtitle && <p>{category.subtitle}</p>}
                </div>
                <div className="admin-entry-image-count">
                  <Image size={15} /> {category.photos.length} फोटो
                </div>
                <div className="admin-entry-actions">
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => startEdit(category)}>
                    <Edit size={15} /> संपादित करें
                  </button>
                  <button type="button" className="btn btn-danger btn-sm" onClick={() => handleDelete(category)}>
                    <Trash2 size={15} /> हटाएं
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

    </div>
  );
}