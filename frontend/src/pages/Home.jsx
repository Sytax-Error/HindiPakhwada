import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function Home() {
  const { user } = useAuth();
  const sliderImages = [
    { src: "/assets/slider55.jpg", alt: "हिंदी पखवाड़ा प्रतियोगिता कार्यक्रम" },
    { src: "/assets/services.jpg", alt: "हिंदी पखवाड़ा प्रतियोगिता कार्यक्रम" },
    { src: "/assets/slider1.jpg", alt: "हिंदी पखवाड़ा प्रतियोगिता कार्यक्रम" },
    { src: "/assets/slider2.jpg", alt: "हिंदी पखवाड़ा प्रतियोगिता कार्यक्रम" },
    { src: "/assets/slider3.jpg", alt: "हिंदी पखवाड़ा प्रतियोगिता कार्यक्रम" },
    { src: "/assets/slider4.jpg", alt: "हिंदी पखवाड़ा प्रतियोगिता कार्यक्रम" },
    { src: "/assets/slider5.jpg", alt: "हिंदी पखवाड़ा प्रतियोगिता कार्यक्रम" },
    { src: "/assets/slider6.jpg", alt: "हिंदी पखवाड़ा प्रतियोगिता कार्यक्रम" },
    // { src: "/assets/home slider.png", alt: "हिंदी पखवाड़ा सामग्री और निर्देश" },
  ];
  const [competitions, setCompetitions] = useState([]);
  const [myIds, setMyIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [activeSlide, setActiveSlide] = useState(0);

  async function loadData() {
    setLoading(true);
    try {
      const { data } = await api.get("/competitions");
      setCompetitions(data.competitions);

      if (user) {
        const mine = await api.get("/participations/mine");
        setMyIds(new Set(mine.data.participations.map((p) => p.competition._id)));
      }
    } finally {
      setLoading(false);
    }

  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveSlide((slide) => (slide + 1) % sliderImages.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [sliderImages.length]);

  async function handleRegister(competitionId) {
    setMessage("");
    try {
      await api.post("/participations", { competitionId });
      setMessage("आपका नामांकन सफलतापूर्वक हो गया है।");
      loadData();
    } catch (err) {
      setMessage(err.response?.data?.message || "नामांकन विफल रहा");
    }
  }

  async function downloadBlankSheet(competition) {
    try {
      const { data } = await api.get(`/competitions/${competition._id}/blank-sheet`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([data], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = `${competition.name}-blank-sheet.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setMessage("प्रतियोगिता प्रपत्र डाउनलोड नहीं हो सका।");
    }
  }

  return (
    <div className="page">
      <section className="home-slider" aria-label="हिंदी पखवाड़ा जानकारी">
        <div className="slides-track" style={{ transform: `translateX(-${activeSlide * 100}%)` }}>
          {sliderImages.map((slide) => (
            <div className="slide" key={slide.src}>
              <img src={slide.src} alt={slide.alt} />
            </div>
          ))}
        </div>
        <button
          className="slider-arrow slider-arrow-prev"
          type="button"
          aria-label="पिछली स्लाइड"
          onClick={() => setActiveSlide((activeSlide - 1 + sliderImages.length) % sliderImages.length)}
        >
          ‹
        </button>
        <button
          className="slider-arrow slider-arrow-next"
          type="button"
          aria-label="अगली स्लाइड"
          onClick={() => setActiveSlide((activeSlide + 1) % sliderImages.length)}
        >
          ›
        </button>
        <div className="slider-dots">
          {sliderImages.map((slide, index) => (
            <button
              key={slide.src}
              className={`slider-dot${index === activeSlide ? " is-active" : ""}`}
              type="button"
              aria-label={`स्लाइड ${index + 1}`}
              aria-pressed={index === activeSlide}
              onClick={() => setActiveSlide(index)}
            />
          ))}
        </div>
      </section>
      <h1>प्रतियोगिता कार्यक्रम</h1>
      <p >हिंदी पखवाड़ा के दौरान होने वाली विभिन्न प्रतियोगिताएँ</p>

      {message && <div className="alert alert-info">{message}</div>}

      {loading ? (
        <div className="page-loading">लोड हो रहा है...</div>
      ) : (
        <div className="grid">
          {console.log("competitions: ",competitions)}
          {competitions.map((c) => {
            const deadlinePassed = new Date() > new Date(c.registrationDeadline);
            const alreadyRegistered = myIds.has(c._id);
            return (
              <div key={c._id} className="card competition-card">
                <h3>{c.name}</h3>
                <div className="meta">
                  <span>दिनांक: {new Date(c.date).toLocaleDateString("en-IN")}</span>
                  <span>समय: {c.time}</span>
                  {c.duration && <span>अवधि: {c.duration}</span>}
                </div>
                {c.description && <p>{c.description}</p>}
                <p className="deadline">
                  नामांकन अंतिम तिथि:{" "}
                  {new Date(c.registrationDeadline).toLocaleString("en-IN")}
                </p>

                <button className="btn btn-download btn-sm blank-sheet-button" type="button" onClick={() => downloadBlankSheet(c)}>
                  <Download className="download-icon" aria-hidden="true" />
                  खाली प्रपत्र डाउनलोड करें
                </button>

                {!user ? (
                  <p className="muted">प्रतिभाग करने के लिए कृपया लॉगिन करें।</p>
                ) : user.role === "admin" ? (
                  <p className="muted">एडमिन प्रतियोगिताओं में भाग नहीं ले सकते।</p>
                ) : alreadyRegistered ? (
                  <span className="badge badge-success">पंजीकृत ✓</span>
                ) : deadlinePassed ? (
                  <span className="badge badge-muted">नामांकन बंद</span>
                ) : (
                  <button className="btn btn-primary" onClick={() => handleRegister(c._id)}>
                    नामांकन करें
                  </button>
                )}
              </div>
            );
          })}
          {competitions.length === 0 && <p>कोई प्रतियोगिता उपलब्ध नहीं है।</p>}
        </div>
      )}
    </div>
  );
}
