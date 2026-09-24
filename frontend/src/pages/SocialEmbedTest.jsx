import { useEffect, useRef, useState } from "react";
import { FacebookEmbed } from "react-social-media-embed";

const facebookPosts = [
  "https://www.facebook.com/MeitY.NICSI/posts/pfbid0uhsLcUC1caK8Wyk2znUu3eKdZ2hzuVYBRrBtidZGpnfrLzpmDP57BTCeLMEyj459l",
  "https://www.facebook.com/MeitY.NICSI/posts/pfbid0dUhKbstGvUULymSxrEVWnpHLoMFxuaFyzE9uMSz67sK2yLkorzX3NbuzYGYh7Gt4l",
  "https://www.facebook.com/MeitY.NICSI/posts/pfbid027FDZpcxhb9ZjSUWvKRb3kHWVhKFEMUwmK1av98GvQ1FP7DNLpvmykoT4bP28TcRYl",
];

const INITIAL_POST_COUNT = 2;
const FACEBOOK_DESKTOP_WIDTH = 560;

export default function SocialEmbedTest() {
  const [visibleCount, setVisibleCount] = useState(INITIAL_POST_COUNT);
  const [embedWidth, setEmbedWidth] = useState(FACEBOOK_DESKTOP_WIDTH);
  const loadMoreRef = useRef(null);
  const feedRef = useRef(null);

  useEffect(() => {
    const feed = feedRef.current;
    if (!feed) return;

    const updateEmbedWidth = () => {
      const body = feed.querySelector(".social-feed-body");
      if (body) {
        setEmbedWidth(Math.max(280, Math.min(FACEBOOK_DESKTOP_WIDTH, body.clientWidth)));
      }
    };

    updateEmbedWidth();
    const observer = new ResizeObserver(updateEmbedWidth);
    observer.observe(feed);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const node = loadMoreRef.current;
    if (!node || visibleCount >= facebookPosts.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setVisibleCount((current) => Math.min(current + 1, facebookPosts.length));
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [visibleCount]);

  return (
    <div className="page social-test-page">
      <div className="social-page-shell">
        <header className="social-page-header">
          <div className="social-page-badge-row">
            <span className="social-page-badge">Facebook</span>
            <span className="social-page-pill">NICSI Updates</span>
          </div>
          <h1>Facebook Feed</h1>
          <p>Latest public posts from MeitY NICSI.</p>
        </header>

        <div className="social-feed" ref={feedRef}>
          {facebookPosts.slice(0, visibleCount).map((url, index) => (
            <article className="social-feed-post" key={`${url}-${index}`}>
              <div className="social-feed-header">
                <div className="social-feed-author">
                  <div className="social-feed-avatar">N</div>
                  <div>
                    <h3>MeitY NICSI</h3>
                    <span>Facebook post {index + 1}</span>
                  </div>
                </div>
              </div>

              <div className="social-feed-body">
                <div className="social-embed-wrap">
                  <FacebookEmbed
                    url={url}
                    width={embedWidth}
                    style={{ width: embedWidth, maxWidth: "100%" }}
                  />
                </div>
              </div>
            </article>
          ))}

          {visibleCount < facebookPosts.length && (
            <div ref={loadMoreRef} className="social-load-more">
              Loading more posts...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
