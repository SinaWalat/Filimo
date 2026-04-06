import React, { useState, useEffect, useCallback } from "react";

const TMDB_IMAGE_HERO_URL = "https://image.tmdb.org/t/p/original";

const GENRE_MAP = {
  28: "Action",
  12: "Adventure",
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  99: "Documentary",
  18: "Drama",
  10751: "Family",
  14: "Fantasy",
  36: "History",
  27: "Horror",
  10402: "Music",
  9648: "Mystery",
  10749: "Romance",
  878: "Sci-Fi",
  10770: "TV Movie",
  53: "Thriller",
  10752: "War",
  37: "Western",
};

const Hero = ({ media, allHeroItems = [], type, onPlay }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const items = allHeroItems.length > 0 ? allHeroItems : media ? [media] : [];

  const current = items[currentIndex] || media;

  // Auto-rotate hero every 8 seconds
  useEffect(() => {
    if (items.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, 8000);
    return () => clearInterval(timer);
  }, [items.length]);

  if (!current) return null;

  const mediaType =
    type || current.media_type || (current.first_air_date ? "tv" : "movie");
  const heroBgSrc = `${TMDB_IMAGE_HERO_URL}${current.backdrop_path}`;
  const year = (current.release_date || current.first_air_date || "").substring(
    0,
    4,
  );
  const rating = current.vote_average ? current.vote_average.toFixed(1) : "NR";
  const genres = (current.genre_ids || [])
    .slice(0, 2)
    .map((id) => GENRE_MAP[id])
    .filter(Boolean);

  const truncate = (str, n) => {
    return str?.length > n ? str.substr(0, n - 1) + "..." : str;
  };

  return (
    <header className="hero" id="hero-section">
      <img id="hero-bg" src={heroBgSrc} alt={current.title || current.name} />
      <div className="hero-gradient-overlay"></div>
      <div className="hero-vignette"></div>

      <div className="hero-content">
        <div className="hero-text-container">
          <div className="hero-meta-top">
            <span className="hero-badge-brand">FILMOKURD</span>
            <span className="hero-badge-type">
              {mediaType === "tv" ? "SERIES" : "FILM"}
            </span>
          </div>

          <h1 id="hero-title">{current.title || current.name}</h1>

          <div className="hero-meta-row">
            <span className="meta-pill meta-rating">
              <i className="fa-solid fa-star" style={{ color: "#fbbf24" }}></i>{" "}
              {rating}/10
            </span>
            {year && (
              <span className="meta-pill meta-year">
                <i className="fa-regular fa-calendar"></i> {year}
              </span>
            )}
            {genres.map((g) => (
              <span key={g} className="meta-pill meta-genre">
                {g}
              </span>
            ))}
          </div>

          <p id="hero-overview">{truncate(current.overview, 200)}</p>

          <div className="hero-actions">
            <button
              className="btn btn-hero-primary"
              onClick={() => onPlay(current.id, mediaType)}
            >
              <i className="fa-solid fa-play"></i> Watch Now
            </button>
            <button className="btn btn-hero-secondary">
              <i className="fa-solid fa-circle-info"></i> More Info
            </button>
          </div>
        </div>

        {/* Pagination dots */}
        <div className="hero-pagination">
          {items.slice(0, 8).map((_, i) => (
            <div
              key={i}
              className={`hero-dot ${i === currentIndex ? "active" : ""}`}
              onClick={() => setCurrentIndex(i)}
            ></div>
          ))}
        </div>
      </div>
    </header>
  );
};

export default Hero;
