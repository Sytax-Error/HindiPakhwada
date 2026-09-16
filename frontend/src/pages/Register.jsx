import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { EMAIL_PATTERN, MOBILE_PATTERN, EMPLOYEE_CODE_PATTERN, hasErrors } from "../utils/validators";

const initialForm = {
  name: "",
  employeeCode: "",
  designation: "",
  office: "NICSI",
  email: "",
  mobile: "",
  password: "",
};

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: "" }));
  }

  function validate() {
    const e = {};
    if (!form.name.trim()) e.name = "नाम आवश्यक है।";
    else if (form.name.trim().length < 2) e.name = "नाम कम से कम 2 अक्षर का होना चाहिए।";

    if (!form.employeeCode.trim()) e.employeeCode = "इम्प्लोयी कोड आवश्यक है।";
    else if (!EMPLOYEE_CODE_PATTERN.test(form.employeeCode.trim()))
      e.employeeCode = "इम्प्लोयी कोड 6 अंकों का होना चाहिए।";

    if (!form.office.trim()) e.office = "कार्यालय आवश्यक है।";

    if (!form.email.trim()) e.email = "ईमेल आवश्यक है।";
    else if (!EMAIL_PATTERN.test(form.email.trim())) e.email = "कृपया मान्य ईमेल दर्ज करें।";

    if (form.mobile.trim() && !MOBILE_PATTERN.test(form.mobile.trim()))
      e.mobile = "मान्य 10 अंकों का मोबाइल नंबर दर्ज करें (6-9 से शुरू)।";

    if (!form.password) e.password = "पासवर्ड आवश्यक है।";
    else if (form.password.length < 6) e.password = "पासवर्ड कम से कम 6 अक्षर का होना चाहिए।";

    return e;
  }

  async function handleSubmit(ev) {
    ev.preventDefault();
    setError("");
    const fieldErrors = validate();
    setErrors(fieldErrors);
    if (hasErrors(fieldErrors)) return;

    setLoading(true);
    try {
      await register({ ...form, name: form.name.trim(), employeeCode: form.employeeCode.trim(), email: form.email.trim() });
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "रजिस्ट्रेशन विफल रहा");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <form className="card auth-card" onSubmit={handleSubmit} noValidate>
        <h2>हिंदी प्रतियोगिता नामांकन प्रपत्र</h2>
        {error && <div className="alert alert-error">{error}</div>}

        <label>
          नाम<span className="required-mark">*</span>
          <input
            required
            minLength={2}
            maxLength={80}
            className={errors.name ? "input-error" : ""}
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
          />
          {errors.name && <span className="field-error">{errors.name}</span>}
        </label>
        <label>
          इम्प्लोयी कोड<span className="required-mark">*</span>
          <input
            required
            className={errors.employeeCode ? "input-error" : ""}
            value={form.employeeCode}
            onChange={(e) => update("employeeCode", e.target.value.replace(/\D/g, "").slice(0, 6))}
            inputMode="numeric"
            maxLength={6}
            placeholder="6 अंकों का कोड"
          />
          {errors.employeeCode && <span className="field-error">{errors.employeeCode}</span>}
        </label>
        <label>
          पदनाम
          <input
            maxLength={100}
            value={form.designation}
            onChange={(e) => update("designation", e.target.value)}
          />
        </label>
        <label>
          कार्यालय<span className="required-mark">*</span>
          <input
            required
            maxLength={100}
            className={errors.office ? "input-error" : ""}
            value={form.office}
            onChange={(e) => update("office", e.target.value)}
          />
          {errors.office && <span className="field-error">{errors.office}</span>}
        </label>
        <label>
          ईमेल<span className="required-mark">*</span>
          <input
            type="email"
            required
            className={errors.email ? "input-error" : ""}
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
          />
          {errors.email && <span className="field-error">{errors.email}</span>}
        </label>
        <label>
          मोबाइल नं.
          <input
            type="tel"
            inputMode="numeric"
            maxLength={10}
            className={errors.mobile ? "input-error" : ""}
            value={form.mobile}
            onChange={(e) => update("mobile", e.target.value.replace(/\D/g, "").slice(0, 10))}
            placeholder="10 अंकों का मोबाइल नंबर"
          />
          {errors.mobile && <span className="field-error">{errors.mobile}</span>}
        </label>
        <label>
          पासवर्ड<span className="required-mark">*</span>
          <input
            type="password"
            required
            minLength={6}
            maxLength={128}
            className={errors.password ? "input-error" : ""}
            value={form.password}
            onChange={(e) => update("password", e.target.value)}
          />
          {errors.password && <span className="field-error">{errors.password}</span>}
        </label>

        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? "सुरक्षित हो रहा है..." : "सुरक्षित करें"}
        </button>
        <p className="auth-switch">
          पहले से खाता है? <Link to="/login">लॉगिन करें</Link>
        </p>
      </form>
    </div>
  );
}
