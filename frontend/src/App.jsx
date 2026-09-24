import { Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";
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

export default function App() {
  const location = useLocation();
  const isFixedLayout = location.pathname === '/admin/declare-winners';

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
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
