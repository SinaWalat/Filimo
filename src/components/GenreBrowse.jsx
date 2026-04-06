import React, { useState, useEffect, useRef } from "react";
import { BackdropCard } from "../App";

const TMDB_API_KEY = "15d2ea6d0dc1d476efbca3eba2b9bbfb";
const TMDB_BASE_URL = "https://api.themoviedb.org/3";

const genres = [
  { id: 28, name: "Action" },
  { id: 35, name: "Comedy" },
  { id: 27, name: "Horror" },
  { id: 18, name: "Drama" },
  { id: 10749, name: "Romance" },
  { id: 878, name: "Sci-Fi" },
  { id: 53, name: "Thriller" },
  { id: 16, name: "Animation" },
  { id: 12, name: "Adventure" },
  { id: 80, name: "Crime" },
];

export default function GenreBrowse({ fetchTMDB, onPlay }) {
  const [activeGenre, setActiveGenre] = useState(genres[0]);
  const [items, setItems] = useState([]);
  const rowRef = useRef(null);
  const tabsRef = useRef(null);

  const scroll = (dir) =>
    rowRef.current?.scrollBy({ left: dir * 700, behavior: "smooth" });

  useEffect(() => {
    fetch(
      `${TMDB_BASE_URL}/discover/movie?with_genres=${activeGenre.id}&sort_by=popularity.desc&page=1&api_key=${TMDB_API_KEY}`,
    )
      .then((r) => r.json())
      .then((data) => setItems((data.results || []).slice(0, 10)))
      .catch(() => setItems([]));
  }, [activeGenre]);

  return (
    <section className="shelf-section genre-browse-section">
      <div className="shelf-header-premium">
        <div className="shelf-header-left">
          <div className="shelf-icon-box">
            <i className="fa-solid fa-compass"></i>
          </div>
          <div className="shelf-title-group">
            <h2 className="shelf-title-main">Browse by Genre</h2>
            <span className="shelf-subtitle">Discover titles by category</span>
          </div>
        </div>
      </div>

      {/* Genre tabs */}
      <div className="genre-tabs-row" ref={tabsRef}>
        {genres.map((g) => (
          <button
            key={g.id}
            className={`genre-tab-btn ${activeGenre.id === g.id ? "active" : ""}`}
            onClick={() => setActiveGenre(g)}
          >
            {g.name}
          </button>
        ))}
      </div>

      {/* Genre movie row */}
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
              type="movie"
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
