import { useEffect, useState, useMemo } from "react";
import api from "../services/api";

const POSITIONS = [
  { value: "", label: "-- कोई पुरस्कार नहीं --" },
  { value: "first", label: "प्रथम पुरस्कार" },
  { value: "second", label: "द्वितीय पुरस्कार" },
  { value: "third", label: "तृतीय पुरस्कार" },
  { value: "consolation", label: "सांत्वना पुरस्कार" },
];

const POSITION_TITLES = { first: "प्रथम", second: "द्वितीय", third: "तृतीय" };
const PARTICIPANTS_PER_PAGE = 10;

function validateAssignments(assignments) {
  const seen = {};
  for (const val of Object.values(assignments)) {
    const pos = val.position;
    if (pos && POSITION_TITLES[pos]) {
      if (seen[pos]) {
        return `एक प्रतियोगिता में केवल एक ही प्रतिभागी को ${POSITION_TITLES[pos]} पुरस्कार दिया जा सकता है।`;
      }
      seen[pos] = true;
    }
  }
  return "";
}

export default function AdminDeclareWinners() {
  const [competitions, setCompetitions] = useState([]);
  const [selected, setSelected] = useState("");
  const [participants, setParticipants] = useState([]);
  const [assignments, setAssignments] = useState({}); // participationId -> { position, remarks }
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    api.get("/competitions").then((res) => {
      setCompetitions(res.data.competitions);
      if (res.data.competitions.length) setSelected(res.data.competitions[0]._id);
    });
  }, []);

  useEffect(() => {
    if (!selected) return;
    api.get(`/participations/competition/${selected}`).then((res) => {
      setParticipants(res.data.participations);
      const initial = {};
      res.data.participations.forEach((p) => {
        initial[p._id] = { position: p.position || "", remarks: p.remarks || "" };
      });
      setAssignments(initial);
      setCurrentPage(1); // Reset to first page when competition changes
    });
  }, [selected]);

  // Reset page when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  function updateAssignment(participationId, field, value) {
    setAssignments((prev) => ({
      ...prev,
      [participationId]: { ...prev[participationId], [field]: value },
    }));
  }

  // Filter participants based on search term
  const filteredParticipants = useMemo(() => {
    if (!searchTerm.trim()) return participants;
    const term = searchTerm.toLowerCase().trim();
    return participants.filter((p) => 
      p.user?.name?.toLowerCase().includes(term) ||
      p.user?.employeeCode?.toLowerCase().includes(term) ||
      p.user?.designation?.toLowerCase().includes(term)
    );
  }, [participants, searchTerm]);

  // Pagination
  const totalPages = Math.ceil(filteredParticipants.length / PARTICIPANTS_PER_PAGE);
  const startIndex = (currentPage - 1) * PARTICIPANTS_PER_PAGE;
  const paginatedParticipants = filteredParticipants.slice(startIndex, startIndex + PARTICIPANTS_PER_PAGE);

  async function handleSave() {
    setMessage("");
    const validationMessage = validateAssignments(assignments);
    if (validationMessage) {
      setMessage(validationMessage);
      setMessageType("error");
      return;
    }

    setSaving(true);
    try {
      const results = Object.entries(assignments).map(([participationId, val]) => ({
        participationId,
        position: val.position || null,
        remarks: val.remarks,
      }));
      await api.post("/admin/declare-winners", { competitionId: selected, results });
      setMessage("विजेता सफलतापूर्वक घोषित किए गए।");
      setMessageType("info");
    } catch (err) {
      setMessage(err.response?.data?.message || "त्रुटि हुई");
      setMessageType("error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page admin-declare-winners-page">
      <div className="admin-winners-header">
        <h1>विजेता घोषित करें</h1>

        <label className="select-label">
          प्रतियोगिता चुनें:
          <select value={selected} onChange={(e) => setSelected(e.target.value)}>
            {competitions.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name} ({new Date(c.date).toLocaleDateString("en-IN")})
              </option>
            ))}
          </select>
        </label>

        {message && <div className={`alert alert-${messageType === "error" ? "error" : "info"}`}>{message}</div>}
      </div>

      {/* Search Box - Above Table */}
      <div className="admin-winners-search">
        <div className="search-box">
          <input
            type="text"
            placeholder="नाम, कर्मचारी कोड या पदनाम से खोजें..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        {filteredParticipants.length > 0 && (
          <span className="results-count">
            {filteredParticipants.length} प्रतिभागी मिले
          </span>
        )}
      </div>

      {/* Scrollable Table Area */}
      <div className="admin-winners-table-container">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>प्रतियोगी</th>
                <th>कर्मचारी कोड</th>
                <th>पदनाम</th>
                <th>पुरस्कार</th>
                <th>टिप्पणी</th>
              </tr>
            </thead>
            <tbody>
              {paginatedParticipants.map((p) => (
                <tr key={p._id}>
                  <td>{p.user?.name}</td>
                  <td>{p.user?.employeeCode}</td>
                  <td>{p.user?.designation}</td>
                  <td>
                    <select
                      value={assignments[p._id]?.position || ""}
                      onChange={(e) => updateAssignment(p._id, "position", e.target.value)}
                    >
                      {POSITIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input
                      className="admin-winners-table-input"
                      value={assignments[p._id]?.remarks || ""}
                      onChange={(e) => updateAssignment(p._id, "remarks", e.target.value)}
                    />
                  </td>
                </tr>
              ))}
              {participants.length === 0 && (
                <tr>
                  <td colSpan={5}>इस प्रतियोगिता में अभी तक कोई प्रतिभागी नहीं है।</td>
                </tr>
              )}
              {participants.length > 0 && filteredParticipants.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '24px' }}>
                    "{searchTerm}" से मेल खाने वाला कोई प्रतिभागी नहीं मिला।
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* Pagination - Below Table (outside scroll area) */}
      {totalPages > 1 && (
        <div className="admin-winners-pagination">
          <span className="pagination-info">
            {filteredParticipants.length} प्रतिभागियों में से {startIndex + 1}–{Math.min(startIndex + PARTICIPANTS_PER_PAGE, filteredParticipants.length)} दिखा रहे हैं
          </span>
          <div className="gallery-pagination">
            <button
              type="button"
              className="gallery-page-button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              ‹
            </button>
            {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
              <button
                key={page}
                type="button"
                className={`gallery-page-button${page === currentPage ? " is-active" : ""}`}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </button>
            ))}
            <button
              type="button"
              className="gallery-page-button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              ›
            </button>
          </div>
        </div>
      )}

      {/* Fixed Save Button at Bottom */}
      {participants.length > 0 && (
        <div className="admin-winners-footer">
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? "सुरक्षित हो रहा है..." : "परिणाम सुरक्षित करें"}
          </button>
        </div>
      )}
    </div>
  );
}
