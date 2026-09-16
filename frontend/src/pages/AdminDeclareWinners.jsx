import { useEffect, useState } from "react";
import api from "../services/api";

const POSITIONS = [
  { value: "", label: "-- कोई पुरस्कार नहीं --" },
  { value: "first", label: "प्रथम पुरस्कार" },
  { value: "second", label: "द्वितीय पुरस्कार" },
  { value: "third", label: "तृतीय पुरस्कार" },
  { value: "consolation", label: "सांत्वना पुरस्कार" },
];

const POSITION_TITLES = { first: "प्रथम", second: "द्वितीय", third: "तृतीय" };

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
    });
  }, [selected]);

  function updateAssignment(participationId, field, value) {
    setAssignments((prev) => ({
      ...prev,
      [participationId]: { ...prev[participationId], [field]: value },
    }));
  }

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
    <div className="page">
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
            {participants.map((p) => (
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
          </tbody>
        </table>
      </div>

      {participants.length > 0 && (
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? "सुरक्षित हो रहा है..." : "परिणाम सुरक्षित करें"}
        </button>
      )}
    </div>
  );
}
