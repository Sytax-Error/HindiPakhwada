import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Download } from "lucide-react";
import api from "../services/api";
import { hasErrors } from "../utils/validators";

const emptyForm = {
  name: "",
  description: "",
  date: "",
  time: "2:30 PM",
  duration: "",
  registrationDeadline: "",
  minParticipants: 9,
};

export default function AdminCompetitions() {
  const [competitions, setCompetitions] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [attendance, setAttendance] = useState(null);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editErrors, setEditErrors] = useState({});

  async function load() {
    try {
      const { data } = await api.get("/competitions");
      setCompetitions(data.competitions);
    } catch (err) {
      setMessage(err.response?.data?.message || "प्रतियोगिताएँ लोड नहीं हो सकीं।");
    }
  }

  useEffect(() => {
    load();
  }, []);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: "" }));
  }

  function validate() {
    const e = {};
    if (!form.name.trim()) e.name = "नाम आवश्यक है।";
    else if (form.name.trim().length < 3) e.name = "नाम कम से कम 3 अक्षर का होना चाहिए।";

    if (!form.date) e.date = "दिनांक आवश्यक है।";
    if (!form.time.trim()) e.time = "समय आवश्यक है।";
    if (!form.registrationDeadline) e.registrationDeadline = "नामांकन अंतिम तिथि आवश्यक है।";

    if (form.date && form.registrationDeadline) {
      const compDateEnd = new Date(form.date);
      compDateEnd.setHours(23, 59, 59, 999);
      const deadline = new Date(form.registrationDeadline);
      if (deadline > compDateEnd) {
        e.registrationDeadline = "नामांकन अंतिम तिथि प्रतियोगिता की तारीख के बाद नहीं हो सकती।";
      }
    }

    if (form.minParticipants === "" || form.minParticipants === null || Number(form.minParticipants) < 1) {
      e.minParticipants = "न्यूनतम प्रतियोगी संख्या 1 या अधिक होनी चाहिए।";
    }

    return e;
  }

  async function handleSubmit(ev) {
    ev.preventDefault();
    setMessage("");
    const fieldErrors = validate();
    setErrors(fieldErrors);
    if (hasErrors(fieldErrors)) return;

    try {
      await api.post("/competitions", form);
      setMessage("प्रतियोगिता सफलतापूर्वक बनाई गई।");
      setForm(emptyForm);
      await load();
    } catch (err) {
      setMessage(err.response?.data?.message || "त्रुटि हुई");
    }
  }

  async function handleDeactivate(id) {
    if (!confirm("क्या आप इस प्रतियोगिता को निष्क्रिय करना चाहते हैं?")) return;
    try {
      await api.delete(`/competitions/${id}`);
      await load();
    } catch (err) {
      setMessage(err.response?.data?.message || "प्रतियोगिता निष्क्रिय नहीं हो सकी।");
    }
  }

  function startEdit(competition) {
    setEditingId(competition._id);
    // Format date and datetime-local for input fields
    const date = new Date(competition.date).toISOString().split('T')[0];
    const deadline = new Date(competition.registrationDeadline).toISOString().slice(0, 16);
    setEditForm({
      name: competition.name,
      description: competition.description || "",
      date: date,
      time: competition.time || "2:30 PM",
      duration: competition.duration || "",
      registrationDeadline: deadline,
      minParticipants: competition.minParticipants || 9,
    });
    setEditErrors({});
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm({});
    setEditErrors({});
  }

  function updateEditField(field, value) {
    setEditForm((f) => ({ ...f, [field]: value }));
    setEditErrors((e) => ({ ...e, [field]: "" }));
  }

  function validateEdit() {
    const e = {};
    if (!editForm.name.trim()) e.name = "नाम आवश्यक है।";
    else if (editForm.name.trim().length < 3) e.name = "नाम कम से कम 3 अक्षर का होना चाहिए।";

    if (!editForm.date) e.date = "दिनांक आवश्यक है।";
    if (!editForm.time.trim()) e.time = "समय आवश्यक है।";
    if (!editForm.registrationDeadline) e.registrationDeadline = "नामांकन अंतिम तिथि आवश्यक है।";

    if (editForm.date && editForm.registrationDeadline) {
      const compDateEnd = new Date(editForm.date);
      compDateEnd.setHours(23, 59, 59, 999);
      const deadline = new Date(editForm.registrationDeadline);
      if (deadline > compDateEnd) {
        e.registrationDeadline = "नामांकन अंतिम तिथि प्रतियोगिता की तारीख के बाद नहीं हो सकती।";
      }
    }

    if (editForm.minParticipants === "" || editForm.minParticipants === null || Number(editForm.minParticipants) < 1) {
      e.minParticipants = "न्यूनतम प्रतियोगी संख्या 1 या अधिक होनी चाहिए।";
    }

    return e;
  }

  async function handleEditSubmit(ev) {
    ev.preventDefault();
    setMessage("");
    const fieldErrors = validateEdit();
    setEditErrors(fieldErrors);
    if (Object.keys(fieldErrors).length > 0) return;

    try {
      await api.put(`/competitions/${editingId}`, editForm);
      setMessage("प्रतियोगिता सफलतापूर्वक अपडेट की गई।");
      cancelEdit();
      await load();
    } catch (err) {
      setMessage(err.response?.data?.message || "त्रुटि हुई");
    }
  }

  async function showAttendance(competition) {
    setAttendanceLoading(true);
    try {
      const [{ data }, qrDataUrl] = await Promise.all([
        api.get(`/participations/competition/${competition._id}`),
        QRCode.toDataURL(`${window.location.origin}/attendance/${competition._id}`, {
          width: 240,
          margin: 2,
          color: { dark: "#1e1b4b", light: "#ffffff" },
        }),
      ]);
      setAttendance({ competition, participants: data.participations, qrDataUrl });
    } catch (err) {
      setMessage(err.response?.data?.message || "उपस्थिति विवरण लोड नहीं हो सका।");
    } finally {
      setAttendanceLoading(false);
    }
  }

  function downloadQrCode() {
    if (!attendance) return;
    const link = document.createElement("a");
    link.href = attendance.qrDataUrl;
    link.download = `attendance-qr-${attendance.competition.name.replace(/\s+/g, "-")}.png`;
    link.click();
  }

  async function downloadPdf(endpoint, filename, errorMessage) {
    try {
      const { data } = await api.get(endpoint, { responseType: "blob" });
      const url = URL.createObjectURL(new Blob([data], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      setMessage(err.response?.data?.message || errorMessage);
    }
  }

  function downloadAttendanceList() {
    if (!attendance) return;
    downloadPdf(
      `/participations/competition/${attendance.competition._id}/attendance-pdf`,
      `attendees-${attendance.competition.name.replace(/\s+/g, "-")}.pdf`,
      "उपस्थित सूची PDF डाउनलोड नहीं हो सकी।"
    );
  }

  function downloadParticipantList() {
    if (!attendance) return;
    downloadPdf(
      `/participations/competition/${attendance.competition._id}/participants-pdf`,
      `participants-${attendance.competition.name.replace(/\s+/g, "-")}.pdf`,
      "सभी प्रतिभागियों की PDF डाउनलोड नहीं हो सकी।"
    );
  }

  return (
    <div className="page">
      <h1>प्रतियोगिताएँ प्रबंधित करें</h1>

      <form className="card form-card" onSubmit={handleSubmit} noValidate>
        <h3>नई प्रतियोगिता जोड़ें</h3>
        {message && <div className="alert alert-info">{message}</div>}
        <label>
          नाम<span className="required-mark">*</span>
          <input
            className={errors.name ? "input-error" : ""}
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
          />
          {errors.name && <span className="field-error">{errors.name}</span>}
        </label>
        <label>
          विवरण
          <textarea
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
          />
        </label>
        <div className="form-row">
          <label>
            दिनांक<span className="required-mark">*</span>
            <input
              type="date"
              className={errors.date ? "input-error" : ""}
              value={form.date}
              onChange={(e) => update("date", e.target.value)}
            />
            {errors.date && <span className="field-error">{errors.date}</span>}
          </label>
          <label>
            समय<span className="required-mark">*</span>
            <input
              className={errors.time ? "input-error" : ""}
              value={form.time}
              onChange={(e) => update("time", e.target.value)}
            />
            {errors.time && <span className="field-error">{errors.time}</span>}
          </label>
          <label>
            अवधि
            <input
              placeholder="जैसे 1 घंटा"
              value={form.duration}
              onChange={(e) => update("duration", e.target.value)}
            />
          </label>
        </div>
        <label>
          नामांकन अंतिम तिथि/समय<span className="required-mark">*</span>
          <input
            type="datetime-local"
            className={errors.registrationDeadline ? "input-error" : ""}
            value={form.registrationDeadline}
            onChange={(e) => update("registrationDeadline", e.target.value)}
          />
          {errors.registrationDeadline && (
            <span className="field-error">{errors.registrationDeadline}</span>
          )}
        </label>
        <label>
          न्यूनतम प्रतियोगी संख्या<span className="required-mark">*</span>
          <input
            type="number"
            min={1}
            className={errors.minParticipants ? "input-error" : ""}
            value={form.minParticipants}
            onChange={(e) => update("minParticipants", e.target.value === "" ? "" : Number(e.target.value))}
          />
          {errors.minParticipants && <span className="field-error">{errors.minParticipants}</span>}
        </label>
        <button className="btn btn-primary" type="submit">
          बनाएँ
        </button>
      </form>

      {/* Edit Form */}
      {editingId && (
        <form className="card form-card" onSubmit={handleEditSubmit} noValidate>
          <h3>प्रतियोगिता संपादित करें</h3>
          {message && <div className="alert alert-info">{message}</div>}
          <label>
            नाम<span className="required-mark">*</span>
            <input
              className={editErrors.name ? "input-error" : ""}
              value={editForm.name}
              onChange={(e) => updateEditField("name", e.target.value)}
            />
            {editErrors.name && <span className="field-error">{editErrors.name}</span>}
          </label>
          <label>
            विवरण
            <textarea
              value={editForm.description}
              onChange={(e) => updateEditField("description", e.target.value)}
            />
          </label>
          <div className="form-row">
            <label>
              दिनांक<span className="required-mark">*</span>
              <input
                type="date"
                className={editErrors.date ? "input-error" : ""}
                value={editForm.date}
                onChange={(e) => updateEditField("date", e.target.value)}
              />
              {editErrors.date && <span className="field-error">{editErrors.date}</span>}
            </label>
            <label>
              समय<span className="required-mark">*</span>
              <input
                className={editErrors.time ? "input-error" : ""}
                value={editForm.time}
                onChange={(e) => updateEditField("time", e.target.value)}
              />
              {editErrors.time && <span className="field-error">{editErrors.time}</span>}
            </label>
            <label>
              अवधि
              <input
                placeholder="जैसे 1 घंटा"
                value={editForm.duration}
                onChange={(e) => updateEditField("duration", e.target.value)}
              />
            </label>
          </div>
          <label>
            नामांकन अंतिम तिथि/समय<span className="required-mark">*</span>
            <input
              type="datetime-local"
              className={editErrors.registrationDeadline ? "input-error" : ""}
              value={editForm.registrationDeadline}
              onChange={(e) => updateEditField("registrationDeadline", e.target.value)}
            />
            {editErrors.registrationDeadline && (
              <span className="field-error">{editErrors.registrationDeadline}</span>
            )}
          </label>
          <label>
            न्यूनतम प्रतियोगी संख्या<span className="required-mark">*</span>
            <input
              type="number"
              min={1}
              className={editErrors.minParticipants ? "input-error" : ""}
              value={editForm.minParticipants}
              onChange={(e) => updateEditField("minParticipants", e.target.value === "" ? "" : Number(e.target.value))}
            />
            {editErrors.minParticipants && <span className="field-error">{editErrors.minParticipants}</span>}
          </label>
          <div className="form-actions">
            <button className="btn btn-primary" type="submit">
              अपडेट करें
            </button>
            <button className="btn btn-ghost" type="button" onClick={cancelEdit}>
              रद्द करें
            </button>
          </div>
        </form>
      )}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>नाम</th>
              <th>दिनांक</th>
              <th>नामांकन अंतिम तिथि</th>
              <th>परिणाम घोषित?</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {competitions.map((c) => (
              <tr key={c._id}>
                <td>{c.name}</td>
                <td>{new Date(c.date).toLocaleDateString("en-IN")}</td>
                <td>{new Date(c.registrationDeadline).toLocaleString("en-IN")}</td>
                <td>{c.resultsDeclared ? "हाँ" : "नहीं"}</td>
                <td>
                  <button className="btn btn-ghost btn-sm" onClick={() => showAttendance(c)}>
                    QR / उपस्थिति
                  </button>{" "}
                  <button className="btn btn-ghost btn-sm" onClick={() => startEdit(c)}>
                    संपादित करें
                  </button>{" "}
                  <button className="btn btn-ghost btn-sm" onClick={() => handleDeactivate(c._id)}>
                    निष्क्रिय करें
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {attendance && (
        <section className="card attendance-panel">
          <div className="attendance-header">
            <div>
              <h3>{attendance.competition.name}</h3>
              <p className="muted">QR स्कैन करके पंजीकृत प्रतिभागी अपनी उपस्थिति दर्ज कर सकते हैं।</p>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => setAttendance(null)}>
              बंद करें
            </button>
          </div>
          <div className="attendance-content">
            <div className="qr-card">
              <img src={attendance.qrDataUrl} alt={`${attendance.competition.name} उपस्थिति QR कोड`} />
              <strong>उपस्थिति QR कोड</strong>
              <button className="btn btn-download btn-sm" type="button" onClick={downloadQrCode}>
                <Download className="download-icon" aria-hidden="true" />
                QR डाउनलोड करें
              </button>
            </div>
            <div className="table-wrap attendance-table-wrap">
              <div className="attendance-actions">
                <button className="btn btn-download btn-sm" type="button" onClick={downloadAttendanceList}>
                  <Download className="download-icon" aria-hidden="true" />
                  उपस्थित सूची PDF डाउनलोड करें
                </button>
                <button className="btn btn-download btn-sm" type="button" onClick={downloadParticipantList}>
                  <Download className="download-icon" aria-hidden="true" />
                  सभी प्रतिभागी PDF डाउनलोड करें
                </button>
              </div>
              <table>
                <thead>
                  <tr><th>नाम</th><th>इम्प्लोयी कोड</th><th>ई-मेल</th><th>स्थिति</th><th>समय</th></tr>
                </thead>
                <tbody>
                  {attendance.participants.map((participant) => (
                    <tr key={participant._id}>
                      <td>{participant.user?.name}</td>
                      <td>{participant.user?.employeeCode || "-"}</td>
                      <td>{participant.user?.email || "-"}</td>
                      <td>{participant.attendedAt ? "उपस्थित" : "अनुपस्थित"}</td>
                      <td>{participant.attendedAt ? new Date(participant.attendedAt).toLocaleString("en-IN") : "-"}</td>
                    </tr>
                  ))}
                  {attendance.participants.length === 0 && <tr><td colSpan={5}>कोई पंजीकृत प्रतिभागी नहीं है।</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}
      {attendanceLoading && <div className="page-loading">उपस्थिति लोड हो रही है...</div>}
    </div>
  );
}
