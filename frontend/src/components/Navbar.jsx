import { Link, NavLink, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [settings, setSettings] = useState({
    pakhwadaDateRangeLabel: "14 से 28 सितंबर, 2025",
    registrationDeadlineLabel: "18 सितम्बर 2025, 06:00 PM",
  });

  useEffect(() => {
    api.get("/settings").then((res) => setSettings(res.data.settings)).catch(() => {});
  }, []);

  function handleLogout() {
    logout();
    navigate("/login");
  }

  function navClass({ isActive }) {
    return isActive ? "is-active" : undefined;
  }

  return (
    <div className="navbar-wrapper">
      <header className="institutional-header">
        <div className="institutional-header-inner">
          <img src="/assets/NICSI-logo.png" alt="NICSI" className="nicsi-logo" />
          <h1>नेशनल इन्फोर्मेटिक्स सेंटर सर्विसिज इन्कोर्पोरेटेड</h1>
          <img src="/assets/digital-india.png" alt="Digital India" className="digital-india-logo" />
        </div>
      </header>
      <div className="announcement-bar" role="status">
        <div className="announcement-track">
          <span className="announcement-item">
            <span className="new-badge">NEW</span> हिंदी पखवाड़ा: {settings.pakhwadaDateRangeLabel}
            {/* <span className="announcement-deadline">
              (अंतिम तिथि-{settings.registrationDeadlineLabel})
            </span> */}
          </span>
        </div>
      </div>
      <header className="navbar">
        <div className="navbar-inner">
          <Link to="/" className="brand">
            हिंदी पखवाड़ा
          </Link>
          <nav className="nav-links">
            <NavLink to="/" end className={navClass}>प्रतियोगिताएँ</NavLink>
            <NavLink to="/rajbhasha-samiti" className={navClass}>राजभाषा समिति</NavLink>
            <NavLink to="/directions" className={navClass}>दिशा-निर्देश</NavLink>
            <NavLink to="/results" className={navClass}>परिणाम</NavLink>
            {user && <NavLink to="/my-participations" className={navClass}>मेरी प्रविष्टियाँ</NavLink>}
            <NavLink to="/photo-gallery" className={navClass}>गैलरी</NavLink>
            <NavLink to="/e-patrika" className={navClass}>ई-पत्रिका</NavLink>
            <NavLink to="/guests" className={navClass}>अतिथि परिचय</NavLink>
            {user?.role === "admin" && (
              <>
                <NavLink to="/admin" className={navClass}>एडमिन</NavLink>
                <NavLink to="/admin/gallery" className={navClass}>गैलरी प्रबंधन</NavLink>
              </>
            )}
            {user ? (
              <>
                <span className="nav-user">{user.name}</span>
                <button className="btn btn-ghost" onClick={handleLogout}>
                  लॉग-आउट
                </button>
              </>
            ) : (
              <>
                <NavLink to="/login" className={navClass}>लॉगिन</NavLink>
                <Link to="/register" className="btn btn-primary btn-sm">
                  रजिस्टर करें
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>
    </div>
  );
}
