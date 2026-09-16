import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const photos = [
  
  "IMG-20260915-WA0017.jpg","IMG-20260915-WA0012.jpg","IMG-20260915-WA0003.jpg",
  "IMG-20260915-WA0010.jpg","IMG-20260915-WA0013.jpg","IMG-20260915-WA0005.jpg", 
  "IMG-20260915-WA0011.jpg","IMG-20260915-WA0009.jpg","IMG-20260915-WA0004.jpg",
  "IMG-20260915-WA0018.jpg","IMG-20260915-WA0007.jpg","IMG-20260915-WA0008.jpg",
  "IMG-20260915-WA0014.jpg","IMG-20260915-WA0019.jpg","IMG-20260915-WA0015.jpg",
  "IMG-20260915-WA0016.jpg","IMG-20260915-WA0006.jpg","IMG-20260915-WA0020.jpg",
  "IMG-20260915-WA0000.jpg","IMG-20260915-WA0002.jpg","IMG-20260908-WA0013.jpg",
  "IMG-20260908-WA0015.jpg","IMG-20260908-WA0016.jpg","IMG-20260908-WA0075.jpg",
  "IMG-20260908-WA0017.jpg","IMG-20260908-WA0018.jpg", "IMG-20260908-WA0019.jpg",
  "IMG-20260908-WA0020.jpg","IMG-20260908-WA0021.jpg", "IMG-20260908-WA0022.jpg",
  "IMG-20260908-WA0023.jpg","IMG-20260908-WA0024.jpg", "IMG-20260908-WA0025.jpg",
  "IMG-20260908-WA0026.jpg","IMG-20260908-WA0027.jpg", "IMG-20260908-WA0028.jpg",
  "IMG-20260908-WA0029.jpg","IMG-20260908-WA0030.jpg", "IMG-20260908-WA0031.jpg",
  "IMG-20260908-WA0032.jpg","IMG-20260908-WA0033.jpg", "IMG-20260908-WA0034.jpg",
  "IMG-20260908-WA0035.jpg","IMG-20260908-WA0036.jpg", "IMG-20260908-WA0037.jpg",
  "IMG-20260908-WA0038.jpg","IMG-20260908-WA0039.jpg", "IMG-20260908-WA0040.jpg",
  "IMG-20260908-WA0041.jpg","IMG-20260908-WA0042.jpg", "IMG-20260908-WA0043.jpg",
  "IMG-20260908-WA0044.jpg","IMG-20260908-WA0045.jpg", "IMG-20260908-WA0046.jpg",
  "IMG-20260908-WA0047.jpg","IMG-20260908-WA0048.jpg", "IMG-20260908-WA0049.jpg",
  "IMG-20260908-WA0050.jpg","IMG-20260908-WA0051.jpg", "IMG-20260908-WA0052.jpg",
  "IMG-20260908-WA0054.jpg","IMG-20260908-WA0055.jpg", "IMG-20260908-WA0056.jpg",
  "IMG-20260908-WA0057.jpg","IMG-20260908-WA0058.jpg", "IMG-20260908-WA0059.jpg",
  "IMG-20260908-WA0060.jpg","IMG-20260908-WA0061.jpg", "IMG-20260908-WA0062.jpg",
  "IMG-20260908-WA0063.jpg","IMG-20260908-WA0064.jpg", "IMG-20260908-WA0065.jpg",
  "IMG-20260908-WA0066.jpg","IMG-20260908-WA0067.jpg", "IMG-20260908-WA0068.jpg",
  "IMG-20260908-WA0069.jpg","IMG-20260908-WA0070.jpg", "IMG-20260908-WA0071.jpg",
  "IMG-20260908-WA0072.jpg","IMG-20260908-WA0073.jpg", "IMG-20260908-WA0074.jpg",
];

export default function PhotoGallery() {
  const photosPerPage = 15;
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const [openedVideo, setOpenedVideo] = useState(null);

  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [photoPage, setPhotoPage] = useState(1);
  const videoRef = useRef(null);
  const totalPages = Math.ceil(photos.length / photosPerPage);
  const visiblePhotos = photos.slice((photoPage - 1) * photosPerPage, photoPage * photosPerPage);

  function showPreviousPhoto() {
    setSelectedPhoto((current) => (current - 1 + photos.length) % photos.length);
  }

  function showNextPhoto() {
    setSelectedPhoto((current) => (current + 1) % photos.length);
  }

  useEffect(() => {
    if (!isVideoOpen && selectedPhoto === null) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === "Escape") {
        setIsVideoOpen(false);
        setSelectedPhoto(null);
      }
      if (selectedPhoto !== null && event.key === "ArrowLeft") showPreviousPhoto();
      if (selectedPhoto !== null && event.key === "ArrowRight") showNextPhoto();
    };
    document.addEventListener("keydown", closeOnEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.body.style.overflow = "";
    };
  }, [isVideoOpen, selectedPhoto]);

  useEffect(() => {
    if (isVideoOpen) videoRef.current?.play().catch(() => {});
  }, [isVideoOpen]);

const handlevieoPreview =(name)=>{
    setIsVideoOpen(true)
    setOpenedVideo(name)
}

  return (
    <div className="page gallery-page">
      <header className="directions-title">
        <p>हिन्दी पखवाड़ा 2026</p>
        <h1>गैलरी</h1>
      </header>
      <section className="gallery-section">
        <h2 className="gallery-section-title">वीडियो</h2>
        <div className="gallery-video-grid">
          <figure className="gallery-item gallery-video-item">
            <button className="gallery-video-preview" type="button" onClick={() => handlevieoPreview("/assets/gallery/video.mp4")} aria-label="वीडियो पूर्ण स्क्रीन में चलाएं">
              <video autoPlay muted loop playsInline preload="metadata" aria-hidden="true">
                <source src="/assets/gallery/video.mp4" type="video/mp4" />
              </video>
              <span className="gallery-play-icon" aria-hidden="true">▶</span>
            </button>
            {/* <figcaption>हिन्दी पखवाड़ा कार्यक्रम वीडियो</figcaption> */}
          </figure>
          <figure className="gallery-item gallery-video-item">
            <button className="gallery-video-preview" type="button" onClick={() => handlevieoPreview("/assets/gallery/VID-20260908-WA0053.mp4")} aria-label="वीडियो पूर्ण स्क्रीन में चलाएं">
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
        <div className="gallery-grid">
          {visiblePhotos.map((file) => {
            const photoIndex = photos.indexOf(file);
            return <figure className="gallery-item" key={file}>
              <button className="gallery-photo-preview" type="button" onClick={() => setSelectedPhoto(photoIndex)} aria-label="फोटो बड़ा करके देखें">
                <img src={`/assets/gallery/${file}`} alt="हिन्दी पखवाड़ा कार्यक्रम" />
              </button>
              {/* <figcaption>हिन्दी पखवाड़ा कार्यक्रम फोटो</figcaption> */}
            </figure>;
          })}
        </div>
        <div className="gallery-pagination" aria-label="फोटो पेज चयन">
          <button type="button" className="gallery-page-button" disabled={photoPage === 1} onClick={() => setPhotoPage((page) => page - 1)}>‹</button>
          {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
            <button key={page} type="button" className={`gallery-page-button${page === photoPage ? " is-active" : ""}`} onClick={() => setPhotoPage(page)}>{page}</button>
          ))}
          <button type="button" className="gallery-page-button" disabled={photoPage === totalPages} onClick={() => setPhotoPage((page) => page + 1)}>›</button>
        </div>
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
      {selectedPhoto !== null && createPortal(
        <div className="photo-modal" role="dialog" aria-modal="true" aria-label="फोटो पूर्वावलोकन" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setSelectedPhoto(null);
        }}>
          <button className="photo-modal-close" type="button" onClick={() => setSelectedPhoto(null)} aria-label="फोटो बंद करें">×</button>
          <button className="photo-modal-arrow photo-modal-prev" type="button" onClick={showPreviousPhoto} aria-label="पिछली फोटो">‹</button>
          <img src={`/assets/gallery/${photos[selectedPhoto]}`} alt="हिन्दी पखवाड़ा कार्यक्रम" />
          <button className="photo-modal-arrow photo-modal-next" type="button" onClick={showNextPhoto} aria-label="अगली फोटो">›</button>
        </div>,
        document.body
      )}
    </div>
  );
}