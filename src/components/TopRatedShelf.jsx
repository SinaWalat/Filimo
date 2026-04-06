import React, { useState, useRef } from "react";
import { BackdropCard } from "../App";

export default function TopRatedShelf({ movies, shows, onPlay }) {
  const [activeTab, setActiveTab] = useState("movie");
  const rowRef = useRef(null);

  const scroll = (dir) =>
    rowRef.current?.scrollBy({ left: dir * 700, behavior: "smooth" });

  const items = activeTab === "movie" ? movies : shows;

  if (!items || items.length === 0) return null;

  return (
    <section className="shelf-section">
      <div className="shelf-header-premium">
        <div className="shelf-header-left">
          <div className="shelf-icon-box">
            <i className="fa-solid fa-star"></i>
          </div>
          <div className="shelf-title-group">
            <h2 className="shelf-title-main">Top Rated</h2>
            <span className="shelf-subtitle">Highest rated of all time</span>
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
              onPlay={onPlay}
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
}
