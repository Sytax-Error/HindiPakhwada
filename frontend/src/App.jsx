import { Routes, Route } from "react-router-dom";
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
import RajbhashaSamiti from "./pages/RajbhashaSamiti";
import Attendance from "./pages/Attendance";
import Directions from "./pages/Directions";
import PhotoGallery from "./pages/PhotoGallery";
import EPatrika from "./pages/EPatrika";
import Guests from "./pages/Guests";

export default function App() {
  return (
    <>
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
        </Routes>
      </main>
      <Footer />
    </>
  );
}
