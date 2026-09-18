import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

// Dynamic import of all gallery images using Vite's import.meta.glob
// This automatically imports all images from the specified folders
const galleryModules = import.meta.glob("/public/assets/gallery/**/*.{jpg,jpeg,png,webp}", { eager: true });

// Helper function to get photos from a specific folder
function getPhotosFromFolder(folderPath) {
  const photos = [];
  const prefix = `/public/assets/gallery/${folderPath}/`;
  
  Object.keys(galleryModules).forEach((key) => {
    if (key.startsWith(prefix)) {
      // Extract the relative path from the folder
      const relativePath = key.replace("/public/assets/gallery/", "");
      photos.push(relativePath);
    }
  });
  
  // Sort photos alphabetically for consistent ordering
  return photos.sort();
}

// Photo categories with dynamic folder-based photo loading
const photoCategories = [
  {
    id: "essay-competition",
    title: "हिन्दी पखवाड़ा निबंध लेखन प्रतियोगिता",
    subtitle: "17 सितंबर 2026",
    folder: "17-09-2026", // Folder name under public/assets/gallery/
  },{
    id: "rajbhasha-sammelan",
    title: "छठा अखिल भारतीय राजभाषा सम्मेलन",
    subtitle: "नवी मुंबई 14-15 सितंबर 2026",
    folder: "rajbhasha-sammelan", // Folder name under public/assets/gallery/
  },
  {
    id: "hindi-pakhwada-2025",
    title: "हिन्दी पखवाड़ा 2025",
    subtitle: "",
    folder: "hindi-pakhwada-2025", // Folder name under public/assets/gallery/
  }
  
];

// Load photos dynamically for each category
photoCategories.forEach((category) => {
  if (category.folder) {
    category.photos = getPhotosFromFolder(category.folder);
  }
});

const PREVIEW_COUNT = 6; // Number of photos to show in single row preview
const PHOTOS_PER_PAGE = 12; // 2 rows of 6 photos each

export default function PhotoGallery() {
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const [openedVideo, setOpenedVideo] = useState(null);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [categoryPages, setCategoryPages] = useState({}); // Track page number per category
  const videoRef = useRef(null);

  function showPreviousPhoto(categoryPhotos, currentIndex) {
    setSelectedPhoto((current) => (current - 1 + categoryPhotos.length) % categoryPhotos.length);
  }

  function showNextPhoto(categoryPhotos, currentIndex) {
    setSelectedPhoto((current) => (current + 1) % categoryPhotos.length);
  }

  useEffect(() => {
    if (!isVideoOpen && selectedPhoto === null) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === "Escape") {
        setIsVideoOpen(false);
        setSelectedPhoto(null);
        setExpandedCategory(null);
      }
      if (selectedPhoto !== null && event.key === "ArrowLeft") {
        const category = photoCategories.find((c) => c.id === expandedCategory);
        if (category) showPreviousPhoto(category.photos, selectedPhoto);
      }
      if (selectedPhoto !== null && event.key === "ArrowRight") {
        const category = photoCategories.find((c) => c.id === expandedCategory);
        if (category) showNextPhoto(category.photos, selectedPhoto);
      }
    };
    document.addEventListener("keydown", closeOnEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.body.style.overflow = "";
    };
  }, [isVideoOpen, selectedPhoto, expandedCategory]);

  useEffect(() => {
    if (isVideoOpen) videoRef.current?.play().catch(() => {});
  }, [isVideoOpen]);

  const handleVideoPreview = (name) => {
    setIsVideoOpen(true);
    setOpenedVideo(name);
  };

  const handleCategoryClick = (categoryId) => {
    setExpandedCategory((prev) => (prev === categoryId ? null : categoryId));
  };

  const handlePhotoClick = (categoryId, photoIndex) => {
    setExpandedCategory(categoryId);
    setSelectedPhoto(photoIndex);
  };

  return (
    <div className="page gallery-page">
      {/* <header className="directions-title">
        <p>हिन्दी पखवाड़ा 2026</p>
        <h1>गैलरी</h1>
      </header> */}
      <section className="gallery-section">
        <h2 className="gallery-section-title">वीडियो</h2>
        <div className="gallery-video-grid">
          <figure className="gallery-item gallery-video-item">
            <button className="gallery-video-preview" type="button" onClick={() => handleVideoPreview("/assets/gallery/video.mp4")} aria-label="वीडियो पूर्ण स्क्रीन में चलाएं">
              <video autoPlay muted loop playsInline preload="metadata" aria-hidden="true">
                <source src="/assets/gallery/video.mp4" type="video/mp4" />
              </video>
              <span className="gallery-play-icon" aria-hidden="true">▶</span>
            </button>
            {/* <figcaption>हिन्दी पखवाड़ा कार्यक्रम वीडियो</figcaption> */}
          </figure>
          <figure className="gallery-item gallery-video-item">
            <button className="gallery-video-preview" type="button" onClick={() => handleVideoPreview("/assets/gallery/VID-20260908-WA0053.mp4")} aria-label="वीडियो पूर्ण स्क्रीन में चलाएं">
              <video autoPlay muted loop playsInline preload="metadata" aria-hidden="true">
                <source src="/assets/gallery/VID-20260908-WA0053.mp4" type="video/mp4" />
              </video>
              <span className="gallery-play-icon" aria-hidden="true">▶</span>
            </button>
            {/* <figcaption>हिन्दी पखवाड़ा कार्यक्रम वीडियो</figcaption> */}
          </figure>
        </div>
      </section>
      <section className="gallery-section">
        <h2 className="gallery-section-title">फोटो</h2>
        {photoCategories.map((category) => {
          const isExpanded = expandedCategory === category.id;
          const previewPhotos = category.photos.slice(0, PREVIEW_COUNT);
          const remainingCount = category.photos.length - PREVIEW_COUNT;
          
          // Pagination for expanded view
          const currentPage = categoryPages[category.id] || 1;
          const totalPages = Math.ceil(category.photos.length / PHOTOS_PER_PAGE);
          const startIndex = (currentPage - 1) * PHOTOS_PER_PAGE;
          const endIndex = startIndex + PHOTOS_PER_PAGE;
          const paginatedPhotos = category.photos.slice(startIndex, endIndex);
          
          return (
            <div key={category.id} className="photo-category-card">
              <div className="photo-category-header" onClick={() => handleCategoryClick(category.id)}>
                <div className="photo-category-info">
                  <h3 className="photo-category-title">{category.title}</h3>
                  {category.subtitle && <p className="photo-category-subtitle">{category.subtitle}</p>}
                </div>
                <div className="photo-category-meta">
                  <span className="photo-count">{category.photos.length} फोटो</span>
                  <span className="expand-icon" aria-hidden="true">
                    {isExpanded ? "▲" : "▼"}
                  </span>
                </div>
              </div>
              <div className="photo-category-content">
                <div className={`photo-category-grid ${isExpanded ? "expanded" : ""}`}>
                  {!isExpanded ? (
                    // Preview mode - show first 6 photos
                    <>
                      {previewPhotos.map((file, index) => {
                        const photoIndex = category.photos.indexOf(file);
                        return (
                          <figure key={file} className="gallery-item">
                            <button
                              className="gallery-photo-preview"
                              type="button"
                              onClick={() => handlePhotoClick(category.id, photoIndex)}
                              aria-label={`${category.title} - फोटो ${photoIndex + 1} बड़ा करके देखें`}
                            >
                              <img src={`/assets/gallery/${file}`} alt={`${category.title} - फोटो ${photoIndex + 1}`} />
                            </button>
                          </figure>
                        );
                      })}
                      {remainingCount > 0 && (
                        <button
                          className="gallery-item view-more-btn"
                          type="button"
                          onClick={() => handleCategoryClick(category.id)}
                          aria-label={`${category.title} के सभी ${remainingCount} और फोटो देखें`}
                        >
                          <span className="view-more-content">
                            <span aria-hidden="true">+{remainingCount}</span>
                            <span>और देखें</span>
                          </span>
                        </button>
                      )}
                      {category.photos.length === 0 && (
                        <div className="empty-category-message">
                          <p>इस श्रेणी में अभी कोई फोटो नहीं है</p>
                        </div>
                      )}
                    </>
                  ) : (
                    // Expanded mode - show paginated photos
                    <>
                      {paginatedPhotos.map((file, index) => {
                        const photoIndex = category.photos.indexOf(file);
                        return (
                          <figure key={file} className="gallery-item">
                            <button
                              className="gallery-photo-preview"
                              type="button"
                              onClick={() => handlePhotoClick(category.id, photoIndex)}
                              aria-label={`${category.title} - फोटो ${photoIndex + 1} बड़ा करके देखें`}
                            >
                              <img src={`/assets/gallery/${file}`} alt={`${category.title} - फोटो ${photoIndex + 1}`} />
                            </button>
                          </figure>
                        );
                      })}
                    </>
                  )}
                </div>
                {/* Pagination outside grid but inside category - fixed position at bottom */}
                {isExpanded && totalPages > 1 && (
                  <div className="category-pagination" aria-label={`${category.title} पेज चयन`}>
                    <button
                      type="button"
                      className="gallery-page-button"
                      disabled={currentPage === 1}
                      onClick={() => setCategoryPages((prev) => ({ ...prev, [category.id]: currentPage - 1 }))}
                    >
                      ‹
                    </button>
                    {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                      <button
                        key={page}
                        type="button"
                        className={`gallery-page-button${page === currentPage ? " is-active" : ""}`}
                        onClick={() => setCategoryPages((prev) => ({ ...prev, [category.id]: page }))}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      type="button"
                      className="gallery-page-button"
                      disabled={currentPage === totalPages}
                      onClick={() => setCategoryPages((prev) => ({ ...prev, [category.id]: currentPage + 1 }))}
                    >
                      ›
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </section>
      {isVideoOpen && createPortal(
        <div className="video-modal" role="dialog" aria-modal="true" aria-label="हिन्दी पखवाड़ा कार्यक्रम वीडियो" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setIsVideoOpen(false);
        }}>
          <button className="video-modal-close" type="button" onClick={() => setIsVideoOpen(false)} aria-label="वीडियो बंद करें">×</button>
          <video ref={videoRef} controls autoPlay playsInline>
            <source src={openedVideo} type="video/mp4" />
            आपका ब्राउज़र वीडियो चलाने में सक्षम नहीं है।
          </video>
        </div>,
        document.body
      )}
      {selectedPhoto !== null && expandedCategory && createPortal(
        <div className="photo-modal" role="dialog" aria-modal="true" aria-label="फोटो पूर्वावलोकन" onMouseDown={(event) => {
          if (event.target === event.currentTarget) {
            setSelectedPhoto(null);
            setExpandedCategory(null);
          }
        }}>
          <button className="photo-modal-close" type="button" onClick={() => { setSelectedPhoto(null); setExpandedCategory(null); }} aria-label="फोटो बंद करें">×</button>
          <button className="photo-modal-arrow photo-modal-prev" type="button" onClick={() => {
            const category = photoCategories.find((c) => c.id === expandedCategory);
            if (category) showPreviousPhoto(category.photos, selectedPhoto);
          }} aria-label="पिछली फोटो">‹</button>
          <img src={`/assets/gallery/${photoCategories.find((c) => c.id === expandedCategory).photos[selectedPhoto]}`} alt={`${photoCategories.find((c) => c.id === expandedCategory).title} - फोटो ${selectedPhoto + 1}`} />
          <button className="photo-modal-arrow photo-modal-next" type="button" onClick={() => {
            const category = photoCategories.find((c) => c.id === expandedCategory);
            if (category) showNextPhoto(category.photos, selectedPhoto);
          }} aria-label="अगली फोटो">›</button>
        </div>,
        document.body
      )}
    </div>
  );
}