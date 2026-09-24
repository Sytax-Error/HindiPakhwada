import { useEffect, useMemo, useState } from "react";
import { FacebookEmbed } from "react-social-media-embed";
import api from "../services/api";

const FACEBOOK_DESKTOP_WIDTH = 560;

export default function PublicFacebookFeed() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [embedWidth, setEmbedWidth] = useState(FACEBOOK_DESKTOP_WIDTH);

  useEffect(() => {
    async function loadPosts() {
      try {
        const { data } = await api.get("/social-posts");
        setPosts(data.posts || []);
      } catch (err) {
        console.error(err);
        setPosts([]);
      } finally {
        setLoading(false);
      }
    }

    loadPosts();
  }, []);

  useEffect(() => {
    const updateWidth = () => {
      const maxWidth = window.innerWidth < 640 ? Math.max(280, window.innerWidth - 40) : FACEBOOK_DESKTOP_WIDTH;
      setEmbedWidth(Math.min(maxWidth, FACEBOOK_DESKTOP_WIDTH));
    };

    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  const feedRows = useMemo(() => posts.filter((post) => post && post.url), [posts]);

  return (
    <div className="page social-test-page">
      <div className="social-page-shell">
        <header className="social-page-header">
          <div className="social-page-badge-row">
            <span className="social-page-badge">सामाजिक पोस्ट</span>
            <span className="social-page-pill">आधिकारिक अपडेट</span>
          </div>
          <h1>सामाजिक पोस्ट</h1>
          <p>MeitY NICSI से नवीनतम सार्वजनिक अपडेट।</p>
        </header>

        <div className="social-feed">
          {loading ? (
            <div className="social-empty-state">पोस्ट लोड हो रही हैं...</div>
          ) : feedRows.length === 0 ? (
            <div className="social-empty-state">अभी कोई सार्वजनिक फेसबुक पोस्ट उपलब्ध नहीं है।</div>
          ) : (
            feedRows.map((post, index) => (
              <article className="social-feed-post" key={post._id || `${post.url}-${index}`}>
                <div className="social-feed-header">
                  <div className="social-feed-author">
                    <div className="social-feed-avatar">N</div>
                    <div>
                      <h3>{post.title || "MeitY NICSI"}</h3>
                      <span>सामाजिक पोस्ट {index + 1}</span>
                    </div>
                  </div>
                </div>

                <div className="social-feed-body">
                  <div className="social-embed-wrap">
                    <FacebookEmbed
                      url={post.url}
                      width={embedWidth}
                      style={{ width: embedWidth, maxWidth: "100%" }}
                    />
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
