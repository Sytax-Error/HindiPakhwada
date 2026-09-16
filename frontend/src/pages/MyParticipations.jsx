import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import api from "../services/api";

const POSITION_LABELS = {
  first: "प्रथम पुरस्कार 🥇",
  second: "द्वितीय पुरस्कार 🥈",
  third: "तृतीय पुरस्कार 🥉",
  consolation: "सांत्वना पुरस्कार 🎖️",
};

export default function MyParticipations() {
  const [participations, setParticipations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => {
    api
      .get("/participations/mine")
      .then((res) => setParticipations(res.data.participations))
      .finally(() => setLoading(false));
  }, []);

  async function downloadCertificate(participationId) {
    setDownloadingId(participationId);
    try {
      const res = await api.get(`/certificates/${participationId}`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = `certificate-${participationId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert("प्रमाणपत्र डाउनलोड करने में त्रुटि हुई।");
    } finally {
      setDownloadingId(null);
    }
  }

  if (loading) return <div className="page-loading">लोड हो रहा है...</div>;

  return (
    <div className="page">
      <h1>मेरी प्रविष्टियाँ</h1>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>प्रतियोगिता</th>
              <th>दिनांक</th>
              <th>स्थिति</th>
              <th>प्रमाणपत्र</th>
            </tr>
          </thead>
          <tbody>
            {participations.map((p) => (
              <tr key={p._id}>
                <td>{p.competition?.name}</td>
                <td>{new Date(p.competition?.date).toLocaleDateString("en-IN")}</td>
                <td>
                  {p.position ? (
                    <span className="badge badge-success">{POSITION_LABELS[p.position]}</span>
                  ) : p.competition?.resultsDeclared ? (
                    <span className="badge badge-muted">पुरस्कार नहीं मिला</span>
                  ) : (
                    <span className="badge badge-pending">परिणाम प्रतीक्षित</span>
                  )}
                </td>
                <td>
                  {p.position ? (
                    <button
                      className="btn btn-primary btn-sm"
                      disabled={downloadingId === p._id}
                      onClick={() => downloadCertificate(p._id)}
                    >
                      {downloadingId === p._id ? "..." : <><Download className="download-icon" aria-hidden="true" /> डाउनलोड करें</>}
                    </button>
                  ) : (
                    "-"
                  )}
                </td>
              </tr>
            ))}
            {participations.length === 0 && (
              <tr>
                <td colSpan={4}>आपने अभी तक किसी प्रतियोगिता में भाग नहीं लिया है।</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
