import React, { useState, useEffect, useRef } from "react";
import { BackdropCard } from "../App";

const TMDB_API_KEY = "15d2ea6d0dc1d476efbca3eba2b9bbfb";
const TMDB_BASE_URL = "https://api.themoviedb.org/3";

const Providers = () => {
  const [activeTab, setActiveTab] = useState("movie");
  const [items, setItems] = useState([]);
  const rowRef = useRef(null);

  const scroll = (dir) =>
    rowRef.current?.scrollBy({ left: dir * 700, behavior: "smooth" });

  useEffect(() => {
    const type = activeTab === "movie" ? "movie" : "tv";
    // Netflix provider ID is 8
    fetch(
      `${TMDB_BASE_URL}/discover/${type}?with_watch_providers=8&watch_region=US&sort_by=popularity.desc&page=1&api_key=${TMDB_API_KEY}`,
    )
      .then((r) => r.json())
      .then((data) => setItems((data.results || []).slice(0, 10)))
      .catch(() => setItems([]));
  }, [activeTab]);

  const handlePlay = (id, type, src, title) => {
    // Navigate via window for simplicity since we don't have direct navigate access
    const slug = title
      ? title
          .toString()
          .toLowerCase()
          .replace(/\s+/g, "-")
          .replace(/[^\w-]+/g, "")
          .replace(/--+/g, "-")
      : "media";
    const url =
      type === "tv" ? `/series/${id}-${slug}` : `/movies/${id}-${slug}`;
    window.location.href = url;
  };

  return (
    <section className="shelf-section providers-section-v2">
      <div className="shelf-header-premium">
        <div className="shelf-header-left">
          <div className="shelf-icon-box">
            <i className="fa-solid fa-clapperboard"></i>
          </div>
          <div className="shelf-title-group">
            <h2 className="shelf-title-main">Streaming Providers</h2>
            <span className="shelf-subtitle">
              Browse from your favourite services
            </span>
          </div>
        </div>
        <div className="shelf-header-right">
          <div className="providers-toggle">
            <button
              className={`ptoggle-btn ${activeTab === "movie" ? "active" : ""}`}
              onClick={() => setActiveTab("movie")}
            >
              Movies
            </button>
            <button
              className={`ptoggle-btn ${activeTab === "tv" ? "active" : ""}`}
              onClick={() => setActiveTab("tv")}
            >
              TV Shows
            </button>
          </div>
        </div>
      </div>

      <h3 className="provider-subheading">Netflix</h3>

      <div className="shelf-row-wrapper">
        <button
          className="shelf-edge-arrow shelf-edge-left"
          onClick={() => scroll(-1)}
        >
          <i className="fa-solid fa-chevron-left"></i>
        </button>
        <div className="shelf-row-premium" ref={rowRef}>
          {items.map((item) => (
            <BackdropCard
              key={item.id}
              item={item}
              type={activeTab}
              onPlay={handlePlay}
            />
          ))}
        </div>
        <button
          className="shelf-edge-arrow shelf-edge-right"
          onClick={() => scroll(1)}
        >
          <i className="fa-solid fa-chevron-right"></i>
        </button>
      </div>
    </section>
  );
};

export default Providers;
