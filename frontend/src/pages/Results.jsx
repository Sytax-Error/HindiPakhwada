import { useEffect, useState } from "react";
import api from "../services/api";

const POSITION_ORDER = ["first", "second", "third", "consolation"];
const POSITION_LABELS = {
  first: "प्रथम पुरस्कार के विजेता",
  second: "द्वितीय पुरस्कार के विजेता",
  third: "तृतीय पुरस्कार के विजेता",
  consolation: "सांत्वना पुरस्कार के विजेता",
};

export default function Results() {
  const [competitions, setCompetitions] = useState([]);
  const [selected, setSelected] = useState("");
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get("/competitions").then((res) => {
      setCompetitions(res.data.competitions);
      if (res.data.competitions.length) setSelected(res.data.competitions[0]._id);
    });
  }, []);

  useEffect(() => {
    if (!selected) return;
    setLoading(true);
    api
      .get(`/participations/results/${selected}`)
      .then((res) => setParticipants(res.data.participations))
      .finally(() => setLoading(false));
  }, [selected]);

  const grouped = POSITION_ORDER.map((pos) => ({
    position: pos,
    label: POSITION_LABELS[pos],
    winners: participants.filter((p) => p.position === pos),
  })).filter((g) => g.winners.length > 0);

  return (
    <div className="page">
      <h1>प्रतियोगिताओं का परिणाम</h1>
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

      {loading ? (
        <div className="page-loading">लोड हो रहा है...</div>
      ) : grouped.length === 0 ? (
        <p className="muted">इस प्रतियोगिता का परिणाम अभी घोषित नहीं हुआ है।</p>
      ) : (
        grouped.map((g) => (
          <div key={g.position} className="result-block">
            <h3>{g.label}</h3>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>प्रतियोगी का नाम</th>
                    <th>कर्मचारी कोड</th>
                    <th>पदनाम</th>
                    <th>कार्यालय</th>
                  </tr>
                </thead>
                <tbody>
                  {g.winners.map((w) => (
                    <tr key={w._id}>
                      <td>{w.user?.name}</td>
                      <td>{w.user?.employeeCode}</td>
                      <td>{w.user?.designation}</td>
                      <td>{w.user?.office}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
