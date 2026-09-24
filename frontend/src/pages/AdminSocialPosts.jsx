import { useEffect, useMemo, useState } from "react";
import api from "../services/api";

const DEFAULT_FORM = {
  url: "",
  title: "",
  status: "published",
  sortOrder: 0,
  isActive: true,
};

function isValidFacebookUrl(value) {
  if (!value) return false;
  try {
    const parsed = new URL(value);
    const host = parsed.hostname.toLowerCase();
    const pathname = parsed.pathname.toLowerCase();
    return host.includes("facebook.com") && (pathname.includes("/posts/") || pathname.includes("/photo") || pathname.includes("/photos/"));
  } catch {
    return false;
  }
}

export default function AdminSocialPosts() {
  const [posts, setPosts] = useState([]);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);

  const totalPublished = useMemo(
    () => posts.filter((post) => post.status === "published" && post.isActive).length,
    [posts]
  );

  async function loadPosts() {
    try {
      const { data } = await api.get("/admin/social-posts");
      setPosts(data.posts || []);
    } catch (err) {
      setError(err.response?.data?.message || "फेसबुक पोस्ट लोड नहीं हो सके।");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPosts();
  }, []);

  function resetForm() {
    setForm(DEFAULT_FORM);
    setEditingId(null);
    setError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!isValidFacebookUrl(form.url)) {
      setError("कृपया मान्य सार्वजनिक फेसबुक पोस्ट URL दर्ज करें।");
      return;
    }

    try {
      if (editingId) {
        await api.put(`/admin/social-posts/${editingId}`, form);
        setSuccess("फेसबुक पोस्ट सफलतापूर्वक अपडेट हो गई।");
      } else {
        await api.post("/admin/social-posts", form);
        setSuccess("फेसबुक पोस्ट सफलतापूर्वक जोड़ दी गई।");
      }
      resetForm();
      await loadPosts();
    } catch (err) {
      setError(err.response?.data?.message || "फेसबुक पोस्ट सेव नहीं हो सका।");
    }
  }

  async function handleEdit(post) {
    setEditingId(post._id);
    setForm({
      url: post.url,
      title: post.title || "",
      status: post.status,
      sortOrder: post.sortOrder || 0,
      isActive: post.isActive,
    });
    setError("");
    setSuccess("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDelete(id) {
    if (!window.confirm("क्या आप यह फेसबुक पोस्ट हटाना चाहते हैं?")) return;
    try {
      await api.delete(`/admin/social-posts/${id}`);
      setSuccess("फेसबुक पोस्ट सफलतापूर्वक हटा दी गई।");
      if (editingId === id) resetForm();
      await loadPosts();
    } catch (err) {
      setError(err.response?.data?.message || "फेसबुक पोस्ट हटाई नहीं जा सकी।");
    }
  }

  const statusLabelMap = {
    draft: "ड्राफ्ट",
    published: "प्रकाशित",
    archived: "अभिलेखित",
  };

  return (
    <div className="page admin-social-posts-page">
      <div className="page-header-block">
        <h1>फेसबुक पोस्ट</h1>
        <p>सामाजिक फीड में दिखने वाले सार्वजनिक फेसबुक पोस्ट प्रबंधित करें।</p>
      </div>

      <div className="stats-grid single-stat-row">
        <div className="card stat-card">
          <div className="stat-icon icon-green">📣</div>
          <div className="stat-value">{posts.length}</div>
          <div className="stat-label">कुल पोस्ट</div>
        </div>
        <div className="card stat-card">
          <div className="stat-icon icon-amber">✅</div>
          <div className="stat-value">{totalPublished}</div>
          <div className="stat-label">प्रकाशित</div>
        </div>
      </div>

      <form className="card form-card" onSubmit={handleSubmit} noValidate>
        <h3>{editingId ? "फेसबुक पोस्ट संपादित करें" : "फेसबुक पोस्ट जोड़ें"}</h3>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-info">{success}</div>}

        <label>
          फेसबुक पोस्ट URL
          <input
            value={form.url}
            onChange={(e) => setForm((current) => ({ ...current, url: e.target.value }))}
            placeholder="https://www.facebook.com/MeitY.NICSI/posts/..."
          />
        </label>

        <label>
          शीर्षक (वैकल्पिक)
          <input
            value={form.title}
            onChange={(e) => setForm((current) => ({ ...current, title: e.target.value }))}
            placeholder="NICSI अपडेट"
          />
        </label>

        <div className="inline-fields">
          <label>
            स्थिति
            <select
              value={form.status}
              onChange={(e) => setForm((current) => ({ ...current, status: e.target.value }))}
            >
              <option value="published">प्रकाशित</option>
              <option value="draft">ड्राफ्ट</option>
              <option value="archived">अभिलेखित</option>
            </select>
          </label>

          <label>
            क्रम
            <input
              type="number"
              min="0"
              value={form.sortOrder}
              onChange={(e) => setForm((current) => ({ ...current, sortOrder: Number(e.target.value) || 0 }))}
            />
          </label>
        </div>

        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => setForm((current) => ({ ...current, isActive: e.target.checked }))}
          />
          सक्रिय / सार्वजनिक फीड में दिखाई दे
        </label>

        <div className="form-actions compact-actions">
          <button type="submit" className="btn btn-primary">
            {editingId ? "पोस्ट अपडेट करें" : "पोस्ट जोड़ें"}
          </button>
          {editingId && (
            <button type="button" className="btn btn-ghost" onClick={resetForm}>
              रद्द करें
            </button>
          )}
        </div>
      </form>

      <div className="card list-card">
        <h3>वर्तमान पोस्ट</h3>

        {loading ? (
          <p className="empty-state">पोस्ट लोड हो रही हैं...</p>
        ) : posts.length === 0 ? (
          <p className="empty-state">अभी कोई फेसबुक पोस्ट नहीं जोड़ा गया है।</p>
        ) : (
          <div className="admin-list">
            {posts.map((post) => (
              <div className="admin-list-item" key={post._id}>
                <div className="admin-list-main">
                  <div className="admin-list-badges">
                    <span className="tag tag-facebook">Facebook</span>
                    <span className={`tag tag-status ${post.status}`}>{statusLabelMap[post.status] || post.status}</span>
                    {!post.isActive && <span className="tag tag-muted">छुपा हुआ</span>}
                  </div>
                  <strong>{post.title || "शीर्षक रहित पोस्ट"}</strong>
                  <div className="admin-list-url">{post.url}</div>
                </div>

                <div className="admin-list-actions">
                  <button type="button" className="btn btn-ghost" onClick={() => handleEdit(post)}>
                    संपादित करें
                  </button>
                  <button type="button" className="btn btn-primary danger" onClick={() => handleDelete(post._id)}>
                    हटाएँ
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
