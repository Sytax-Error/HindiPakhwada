import { Routes, Route, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import PrivateRoute from "./components/PrivateRoute";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import MyParticipations from "./pages/MyParticipations";
import Results from "./pages/Results";
import AdminDashboard from "./pages/AdminDashboard";
import AdminCompetitions from "./pages/AdminCompetitions";
import AdminDeclareWinners from "./pages/AdminDeclareWinners";
import AdminGallery from "./pages/AdminGallery";
import RajbhashaSamiti from "./pages/RajbhashaSamiti";
import Attendance from "./pages/Attendance";
import Directions from "./pages/Directions";
import PhotoGallery from "./pages/PhotoGallery";
import EPatrika from "./pages/EPatrika";
import Guests from "./pages/Guests";
import SocialEmbedTest from "./pages/SocialEmbedTest";
import PublicFacebookFeed from "./pages/PublicFacebookFeed";
import AdminSocialPosts from "./pages/AdminSocialPosts";

function SocialIcon({ name }) {
  const commonProps = {
    viewBox: "0 0 24 24",
    fill: "currentColor",
    width: 18,
    height: 18,
    "aria-hidden": true,
  };

  switch (name) {
    case "facebook":
      return (
        <svg {...commonProps}>
          <path d="M13.5 8.5V6.8c0-.8.5-1.1 1.1-1.1H16V3h-2.4C11.5 3 10.5 4.2 10.5 6.2v2.3H8v3h2.5V21h3.5v-9.5h2.6l.4-3h-3z" />
        </svg>
      );
    case "x":
      return (
        <svg {...commonProps}>
          <path d="M18.9 3h3.4l-7.4 8.5L22.8 21h-6.7l-5.2-7.3L5.1 21H1.7l7.9-9.1L1.2 3h6.9l4.7 6.6L18.9 3zm-1.2 16.1h1.9L7.1 4.8H5.1l12.6 14.3z" />
        </svg>
      );
    case "instagram":
      return (
        <svg {...commonProps}>
          <path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H7zm5 3.5A4.5 4.5 0 1 1 7.5 12 4.5 4.5 0 0 1 12 7.5zm0 2A2.5 2.5 0 1 0 14.5 12 2.5 2.5 0 0 0 12 9.5zm5.2-3.7a1.1 1.1 0 1 1-1.1 1.1 1.1 1.1 0 0 1 1.1-1.1z" />
        </svg>
      );
    case "linkedin":
      return (
        <svg {...commonProps}>
          <path d="M6.94 8.5A1.56 1.56 0 1 1 6.94 5.4a1.56 1.56 0 0 1 0 3.1ZM5.47 10.1h2.95v9.82H5.47V10.1Zm4.78 0h2.83v1.34h.04c.39-.75 1.35-1.54 2.77-1.54 2.96 0 3.5 1.95 3.5 4.48v6.54h-2.95v-6.13c0-1.45-.03-3.32-2.03-3.32-2.04 0-2.35 1.59-2.35 3.22v6.23H10.25V10.1Z" />
        </svg>
      );
    default:
      return null;
  }
}

export default function App() {
  const location = useLocation();
  const isFixedLayout = location.pathname === '/admin/declare-winners';
  const [showScrollTop, setShowScrollTop] = useState(false);

  const socialLinks = [
    { label: "Facebook", href: "https://www.facebook.com/MeitY.NICSI/", icon: "facebook" },
    { label: "X", href: "https://x.com/MeitY_NICSI", icon: "x" },
    { label: "Instagram", href: "https://www.instagram.com/meity_nicsi/", icon: "instagram" },
    { label: "LinkedIn", href: "https://www.linkedin.com/company/meity-nicsi/", icon: "linkedin" },
  ];

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 0);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Apply fixed-layout class to html and body for viewport-constrained pages
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    if (isFixedLayout) {
      html.classList.add('fixed-layout');
      body.classList.add('fixed-layout');
    } else {
      html.classList.remove('fixed-layout');
      body.classList.remove('fixed-layout');
    }
    return () => {
      html.classList.remove('fixed-layout');
      body.classList.remove('fixed-layout');
    };
  }, [isFixedLayout]);

  return (
    <div className={`app-layout${isFixedLayout ? ' fixed-layout' : ''}`}>
      <Navbar />
      <main className="container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/results" element={<Results />} />
          <Route path="/rajbhasha-samiti" element={<RajbhashaSamiti />} />
          <Route path="/attendance/:competitionId" element={<Attendance />} />
          <Route path="/directions" element={<Directions />} />
          <Route path="/photo-gallery" element={<PhotoGallery />} />
          <Route path="/e-patrika" element={<EPatrika />} />
          <Route path="/guests" element={<Guests />} />
          <Route path="/social-embed-test" element={<SocialEmbedTest />} />
          <Route path="/social-posts" element={<PublicFacebookFeed />} />
          <Route
            path="/my-participations"
            element={
              <PrivateRoute>
                <MyParticipations />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <PrivateRoute adminOnly>
                <AdminDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/competitions"
            element={
              <PrivateRoute adminOnly>
                <AdminCompetitions />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/declare-winners"
            element={
              <PrivateRoute adminOnly>
                <AdminDeclareWinners />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/gallery"
            element={
              <PrivateRoute adminOnly>
                <AdminGallery />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/social-posts"
            element={
              <PrivateRoute adminOnly>
                <AdminSocialPosts />
              </PrivateRoute>
            }
          />
        </Routes>
      </main>

      <div className="floating-social-bar" aria-label="Social media links">
        {socialLinks.map(({ label, href, icon }) => (
          <a
            key={label}
            href={href}
            className="floating-social-link"
            target="_blank"
            rel="noreferrer"
            aria-label={label}
            title={label}
          >
            <SocialIcon name={icon} />
          </a>
        ))}
      </div>

      {showScrollTop && (
        <button
          type="button"
          className="scroll-to-top-btn"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="Go to top"
          title="Go to top"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M12 4.5 4.5 12l1.4 1.4 5.1-5.1V20h2V8.3l5.1 5.1 1.4-1.4L12 4.5Z" fill="currentColor" />
          </svg>
        </button>
      )}

      <Footer />
    </div>
  );
}
