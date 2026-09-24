import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { hasErrors } from "../utils/validators";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [settings, setSettings] = useState({
    pakhwadaDateRangeLabel: "",
    registrationDeadlineLabel: "",
  });
  const [settingsErrors, setSettingsErrors] = useState({});
  const [settingsMessage, setSettingsMessage] = useState("");

  useEffect(() => {
    api.get("/admin/stats").then((res) => setStats(res.data));
    api.get("/settings").then((res) => setSettings(res.data.settings));
  }, []);

  function updateSetting(field, value) {
    setSettings((current) => ({ ...current, [field]: value }));
    setSettingsErrors((e) => ({ ...e, [field]: "" }));
  }

  function validateSettings() {
    const e = {};
    if (!settings.pakhwadaDateRangeLabel.trim()) e.pakhwadaDateRangeLabel = "यह फ़ील्ड आवश्यक है।";
    if (!settings.registrationDeadlineLabel.trim()) e.registrationDeadlineLabel = "यह फ़ील्ड आवश्यक है।";
    return e;
  }

  async function saveSettings(e) {
    e.preventDefault();
    setSettingsMessage("");
    const fieldErrors = validateSettings();
    setSettingsErrors(fieldErrors);
    if (hasErrors(fieldErrors)) return;

    try {
      const { data } = await api.put("/settings", settings);
      setSettings(data.settings);
      setSettingsMessage(data.message);
    } catch (err) {
      setSettingsMessage(err.response?.data?.message || "दिनांक अपडेट नहीं हो सकी।");
    }
  }

  return (
    <div className="page">
      <h1>एडमिन डैशबोर्ड</h1>

      <div className="stats-grid">
        <div className="card stat-card">
          <div className="stat-icon">🏆</div>
          <div className="stat-value">{stats?.competitions ?? "-"}</div>
          <div className="stat-label">सक्रिय प्रतियोगिताएँ</div>
        </div>
        <div className="card stat-card">
          <div className="stat-icon icon-green">👥</div>
          <div className="stat-value">{stats?.users ?? "-"}</div>
          <div className="stat-label">पंजीकृत उपयोगकर्ता</div>
        </div>
        <div className="card stat-card">
          <div className="stat-icon icon-amber">📋</div>
          <div className="stat-value">{stats?.participations ?? "-"}</div>
          <div className="stat-label">कुल प्रविष्टियाँ</div>
        </div>
      </div>

      <div className="admin-actions">
        <Link className="btn btn-primary" to="/admin/competitions">
          प्रतियोगिताएँ प्रबंधित करें
        </Link>
        <Link className="btn btn-primary" to="/admin/declare-winners">
          विजेता घोषित करें
        </Link>
        <Link className="btn btn-primary" to="/admin/gallery">
          गैलरी प्रबंधित करें
        </Link>
        <Link className="btn btn-primary" to="/admin/social-posts">
          Facebook Posts प्रबंधित करें
        </Link>
      </div>

      <form className="card form-card site-settings-form" onSubmit={saveSettings} noValidate>
        <h3>वेबसाइट दिनांक सेटिंग्स</h3>
        {settingsMessage && <div className="alert alert-info">{settingsMessage}</div>}
        <label>
          हिंदी पखवाड़ा दिनांक सीमा<span className="required-mark">*</span>
          <input
            className={settingsErrors.pakhwadaDateRangeLabel ? "input-error" : ""}
            value={settings.pakhwadaDateRangeLabel}
            onChange={(e) => updateSetting("pakhwadaDateRangeLabel", e.target.value)}
            placeholder="जैसे 14 से 28 सितंबर, 2025"
          />
          {settingsErrors.pakhwadaDateRangeLabel && (
            <span className="field-error">{settingsErrors.pakhwadaDateRangeLabel}</span>
          )}
        </label>
        <label>
          नामांकन अंतिम तिथि<span className="required-mark">*</span>
          <input
            className={settingsErrors.registrationDeadlineLabel ? "input-error" : ""}
            value={settings.registrationDeadlineLabel}
            onChange={(e) => updateSetting("registrationDeadlineLabel", e.target.value)}
            placeholder="जैसे 18 सितम्बर 2025, 06:00 PM"
          />
          {settingsErrors.registrationDeadlineLabel && (
            <span className="field-error">{settingsErrors.registrationDeadlineLabel}</span>
          )}
        </label>
        <button className="btn btn-primary" type="submit">
          दिनांक अपडेट करें
        </button>
      </form>
    </div>
  );
}
