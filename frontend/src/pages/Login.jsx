import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { EMPLOYEE_CODE_PATTERN, hasErrors } from "../utils/validators";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ employeeCode: "", password: "" });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: "" }));
  }

  function validate() {
    const e = {};
    if (!form.employeeCode.trim()) e.employeeCode = "इम्प्लोयी कोड आवश्यक है।";
    else if (!EMPLOYEE_CODE_PATTERN.test(form.employeeCode.trim())) e.employeeCode = "इम्प्लोयी कोड 6 अंकों का होना चाहिए।";
    if (!form.password) e.password = "पासवर्ड आवश्यक है।";
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
      const user = await login(form.employeeCode.trim(), form.password);
      navigate(user.role === "admin" ? "/admin" : "/");
    } catch (err) {
      setError(err.response?.data?.message || "लॉगिन विफल रहा");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <form className="card auth-card" onSubmit={handleSubmit} noValidate>
        <h2>लॉगिन करें</h2>
        {error && <div className="alert alert-error">{error}</div>}
        <label>
          इम्प्लोयी कोड<span className="required-mark">*</span>
          <input
            inputMode="numeric"
            maxLength={6}
            required
            className={errors.employeeCode ? "input-error" : ""}
            value={form.employeeCode}
            onChange={(e) => update("employeeCode", e.target.value.replace(/\D/g, "").slice(0, 6))}
          />
          {errors.employeeCode && <span className="field-error">{errors.employeeCode}</span>}
        </label>
        <label>
          पासवर्ड<span className="required-mark">*</span>
          <input
            type="password"
            required
            className={errors.password ? "input-error" : ""}
            value={form.password}
            onChange={(e) => update("password", e.target.value)}
          />
          {errors.password && <span className="field-error">{errors.password}</span>}
        </label>
        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? "कृपया प्रतीक्षा करें..." : "लॉगिन करें"}
        </button>
        <p className="auth-switch">
          खाता नहीं है? <Link to="/register">रजिस्टर करें</Link>
        </p>
      </form>
    </div>
  );
}
