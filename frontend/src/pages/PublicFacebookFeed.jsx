import { useEffect, useRef, useState } from "react";
import { FacebookEmbed } from "react-social-media-embed";
import api from "../services/api";

const FACEBOOK_DESKTOP_WIDTH = 560;
const PAGE_SIZE = 1;

export default function PublicFacebookFeed() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [embedWidth, setEmbedWidth] = useState(FACEBOOK_DESKTOP_WIDTH);
  const isFetchingRef = useRef(false);
  const pageRef = useRef(1);
  const loadMoreRef = useRef(null);

  async function loadPosts(nextPage = 1, shouldReset = false) {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setLoadingMore(true);

    try {
      const { data } = await api.get("/social-posts", {
        params: { page: nextPage, limit: PAGE_SIZE },
      });

      const nextPosts = data.posts || [];

      if (shouldReset) {
        setPosts(nextPosts);
      } else {
        setPosts((current) => [...current, ...nextPosts]);
      }

      const nextPageNumber = Number(data.page || nextPage);
      pageRef.current = nextPageNumber;
      setPage(nextPageNumber);
      setHasMore(Boolean(data.hasMore));
    } catch (err) {
      console.error(err);
      if (shouldReset) {
        setPosts([]);
      }
    } finally {
      isFetchingRef.current = false;
      setLoadingMore(false);
    }
  }

  useEffect(() => {
    async function initialLoad() {
      setLoading(true);
      pageRef.current = 1;
      setPage(1);
      await loadPosts(1, true);
      setLoading(false);
    }

    initialLoad();
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

  useEffect(() => {
    const node = loadMoreRef.current;
    if (!node || loading || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (!entry || !entry.isIntersecting) return;
        if (isFetchingRef.current) return;
        loadPosts(pageRef.current + 1, false);
      },
      { rootMargin: "160px 0px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, loading, page]);

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
          ) : posts.length === 0 ? (
            <div className="social-empty-state">अभी कोई सार्वजनिक फेसबुक पोस्ट उपलब्ध नहीं है।</div>
          ) : (
            posts.filter((post) => post && post.url).map((post, index) => (
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

          {!loading && hasMore && (
            <div ref={loadMoreRef} className="social-load-more">
              {loadingMore ? "और पोस्ट लोड हो रहे हैं..." : "स्क्रॉल करके और पोस्ट देखें"}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
