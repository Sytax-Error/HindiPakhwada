import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../services/api";

export default function Attendance() {
  const { competitionId } = useParams();
  const [competition, setCompetition] = useState(null);
  const [employeeCode, setEmployeeCode] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get(`/competitions/${competitionId}`)
      .then(({ data }) => setCompetition(data.competition))
      .catch(() => setError("प्रतियोगिता नहीं मिली।"))
      .finally(() => setLoading(false));
  }, [competitionId]);

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    setError("");
    setSubmitting(true);
    try {
      const { data } = await api.post(`/participations/attendance/${competitionId}`, { employeeCode });
      setMessage(`${data.message} प्रतिभागी: ${data.participant.name}`);
    } catch (err) {
      setError(err.response?.data?.message || "उपस्थिति दर्ज नहीं हो सकी।");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="page-loading">लोड हो रहा है...</div>;

  return (
    <div className="page attendance-page">
      <div className="card attendance-form-card">
        <h1>उपस्थिति दर्ज करें</h1>
        {competition && <p className="muted">प्रतियोगिता: {competition.name}</p>}
        <p>पंजीकरण में उपयोग किया गया इम्प्लोयी कोड दर्ज करें।</p>
        {message && <div className="alert alert-info">{message}</div>}
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit} noValidate>
          <label>
            पंजीकृत इम्प्लोयी कोड
            <input
              required
              inputMode="numeric"
              maxLength={6}
              pattern="[0-9]{6}"
              value={employeeCode}
              onChange={(event) => setEmployeeCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
            />
          </label>
          <button className="btn btn-primary" type="submit" disabled={submitting}>
            {submitting ? "दर्ज हो रहा है..." : "उपस्थिति दर्ज करें"}
          </button>
        </form>
      </div>
    </div>
  );
}