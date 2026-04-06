import React, { useState, useEffect, useRef } from "react";
import {
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import TopNav from "./components/Sidebar";
import Hero from "./components/Hero";
import LiveView from "./views/LiveView";
import MediaDetailPage from "./views/MediaDetailPage";
import Providers from "./components/Providers";
import TopRatedShelf from "./components/TopRatedShelf";
import GenreBrowse from "./components/GenreBrowse";
import Footer from "./components/Footer";

const TMDB_API_KEY = "15d2ea6d0dc1d476efbca3eba2b9bbfb";
const TMDB_BASE_URL = "https://api.themoviedb.org/3";

export const slugify = (text) => {
  return text
    ? text
        .toString()
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^\w\-]+/g, "")
        .replace(/\-\-+/g, "-")
        .replace(/^-+/, "")
        .replace(/-+$/, "")
    : "media";
};

/* ─────────────────────────────────────────
   Reusable Poster Card
───────────────────────────────────────── */
function PosterCard({ item, type, onPlay }) {
  if (!item.poster_path) return null;
  const itemType = item.media_type || type;
  const itemTitle = item.title || item.name || "";
  const year = (item.release_date || item.first_air_date || "").substring(0, 4);
  const rating = item.vote_average ? item.vote_average.toFixed(1) : null;
  return (
    <div
      className="shelf-card"
      onClick={() => onPlay(item.id, itemType, null, itemTitle, item)}
    >
      <div className="shelf-card-img-wrap">
        <img
          src={`https://image.tmdb.org/t/p/w342${item.poster_path}`}
          alt={itemTitle}
          loading="lazy"
        />
        <div className="shelf-card-overlay">
          <i className="fa-solid fa-play shelf-play-icon"></i>
        </div>
        {rating && (
          <span className="shelf-card-rating">
            <i className="fa-solid fa-star"></i> {rating}
          </span>
        )}
      </div>
      <div className="shelf-card-meta">
        <span className="shelf-card-type">
          {itemType === "tv" ? "TV" : "MOVIE"}
        </span>
        {year && <span className="shelf-card-year">{year}</span>}
      </div>
      <p className="shelf-card-title">{itemTitle}</p>
    </div>
  );
}

/* ─────────────────────────────────────────
   Premium Backdrop Card (16:9)
───────────────────────────────────────── */
export function BackdropCard({ item, type, index, onPlay }) {
  if (!item.backdrop_path && !item.poster_path) return null;
  const itemType = item.media_type || type;
  const itemTitle = item.title || item.name || "";
  const rating = item.vote_average ? item.vote_average.toFixed(1) : null;
  const imgPath = item.backdrop_path
    ? `https://image.tmdb.org/t/p/w780${item.backdrop_path}`
    : `https://image.tmdb.org/t/p/w342${item.poster_path}`;

  return (
    <div className="backdrop-card-wrapper">
      <div
        className="backdrop-card"
        onClick={() => onPlay(item.id, itemType, null, itemTitle, item)}
      >
        <img
          src={imgPath}
          alt={itemTitle}
          className="backdrop-card-img"
          loading="lazy"
        />
        <div className="backdrop-card-gradient"></div>

        {/* Number Overlay - REMOVED PER USER REQUEST */}

        {/* Rating Pill */}
        {rating && (
          <div className="backdrop-card-rating">
            <i
              className="fa-solid fa-star"
              style={{ color: "#fbbf24", fontSize: "0.75rem" }}
            ></i>
            <span>{rating}</span>
          </div>
        )}
      </div>
      {/* NEW: Movie Name below the card */}
      <div className="backdrop-card-title">{itemTitle}</div>
    </div>
  );
}

/* ─────────────────────────────────────────
   Horizontal Shelf
───────────────────────────────────────── */
function Shelf({
  title,
  subtitle,
  iconClass,
  items,
  type,
  onPlay,
  isNumbered = false,
}) {
  const rowRef = useRef(null);
  const scroll = (dir) =>
    rowRef.current?.scrollBy({ left: dir * 700, behavior: "smooth" });
  if (!items || items.length === 0) return null;
  return (
    <section className="shelf-section">
      <div className="shelf-header-premium">
        <div className="shelf-header-left">
          {iconClass && (
            <div className="shelf-icon-box">
              <i className={iconClass}></i>
            </div>
          )}
          <div className="shelf-title-group">
            <h2 className="shelf-title-main">{title}</h2>
            {subtitle && <span className="shelf-subtitle">{subtitle}</span>}
          </div>
        </div>
        <div className="shelf-header-right">
          <span className="shelf-see-all">See all &rarr;</span>
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
          {items.map((item, idx) =>
            isNumbered ? (
              <BackdropCard
                key={item.id}
                item={item}
                type={type}
                index={idx}
                onPlay={onPlay}
              />
            ) : (
              <BackdropCard
                key={item.id}
                item={item}
                type={type}
                onPlay={onPlay}
              />
            ),
          )}
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

/* ─────────────────────────────────────────
   Poster Grid (for search results / section pages)
───────────────────────────────────────── */
function PosterGrid({ items, type, onPlay }) {
  if (!items || items.length === 0)
    return <div className="pg-empty">No results found.</div>;
  return (
    <div className="poster-grid">
      {items.map((item) => (
        <PosterCard key={item.id} item={item} type={type} onPlay={onPlay} />
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────
   Section Search Bar
───────────────────────────────────────── */
function SectionSearchBar({ placeholder, onSearch }) {
  const [val, setVal] = useState("");
  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(val);
  };
  return (
    <form className="section-search-bar" onSubmit={handleSubmit}>
      <i className="fa-solid fa-magnifying-glass"></i>
      <input
        type="text"
        placeholder={placeholder}
        value={val}
        onChange={(e) => {
          setVal(e.target.value);
          if (!e.target.value) onSearch("");
        }}
      />
    </form>
  );
}

/* ─────────────────────────────────────────
   Search Page
───────────────────────────────────────── */
function SearchPage({ trendingMovies, trendingShows, onPlay, fetchTMDB }) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [results, setResults] = useState([]);
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const q = searchParams.get("q") || "";
    setQuery(q);
    if (q) {
      fetchTMDB(`/search/multi?query=${encodeURIComponent(q)}&page=1`).then(
        (data) => {
          setResults(
            (data.results || []).filter(
              (i) => i.media_type === "movie" || i.media_type === "tv",
            ),
          );
        },
      );
    } else {
      setResults([]);
    }
  }, [searchParams]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) navigate(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  const trending = [
    ...trendingMovies.slice(0, 10),
    ...trendingShows.slice(0, 10),
  ];

  return (
    <div className="search-page">
      <h1 className="search-page-title">Search All Content</h1>
      <form className="search-page-bar" onSubmit={handleSearch}>
        <i className="fa-solid fa-magnifying-glass"></i>
        <input
          ref={inputRef}
          type="text"
          placeholder="Search all content..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </form>

      {results.length > 0 ? (
        <div>
          <h2 className="shelf-title" style={{ marginBottom: "1.2rem" }}>
            Results for "{searchParams.get("q")}"
          </h2>
          <PosterGrid items={results} onPlay={onPlay} />
        </div>
      ) : (
        <div>
          <h2 className="shelf-title" style={{ marginBottom: "1.2rem" }}>
            Trending Now
          </h2>
          <PosterGrid items={trending} onPlay={onPlay} />
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────
   Section Page (Movies / Series / Anime)
───────────────────────────────────────── */
function SectionPage({
  title,
  searchPlaceholder,
  shelves,
  allItems,
  type,
  onPlay,
  fetchTMDB,
}) {
  const [filtered, setFiltered] = useState(null);

  const handleSearch = async (q) => {
    if (!q) {
      setFiltered(null);
      return;
    }
    const data = await fetchTMDB(
      `/search/${type === "movie" ? "movie" : "tv"}?query=${encodeURIComponent(q)}&page=1`,
    );
    setFiltered(data.results || []);
  };

  return (
    <div className="section-page">
      <div className="section-page-header">
        <h1 className="section-page-title">{title}</h1>
        <SectionSearchBar
          placeholder={searchPlaceholder}
          onSearch={handleSearch}
        />
      </div>

      {filtered !== null ? (
        <PosterGrid items={filtered} type={type} onPlay={onPlay} />
      ) : (
        <div className="home-shelves" style={{ padding: "0 0 4rem 0" }}>
          {shelves.map((s) => (
            <Shelf
              key={s.title}
              title={s.title}
              items={s.items}
              type={s.type || type}
              onPlay={onPlay}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────
   App Root
───────────────────────────────────────── */
function App() {
  const location = useLocation();
  const navigate = useNavigate();

  // Home data
  const [trendingMovies, setTrendingMovies] = useState([]);
  const [trendingShows, setTrendingShows] = useState([]);
  const [topRatedMovies, setTopRatedMovies] = useState([]);
  const [topRatedShows, setTopRatedShows] = useState([]);
  const [popularAnime, setPopularAnime] = useState([]);
  const [heroItem, setHeroItem] = useState(null);

  // Section data
  const [movieShelves, setMovieShelves] = useState({
    popular: [],
    topRated: [],
    upcoming: [],
  });
  const [seriesShelves, setSeriesShelves] = useState({
    trending: [],
    popular: [],
    topRated: [],
  });
  const [animeShelves, setAnimeShelves] = useState({
    trending: [],
    popular: [],
  });

  // Mobile sidebar
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    const handler = () => setMobileNavOpen(true);
    document.addEventListener("toggle-mobile-nav", handler);
    return () => document.removeEventListener("toggle-mobile-nav", handler);
  }, []);

  const isDetailPage = /^\/(movies|series|live)\/([^/]+)$/.test(
    location.pathname,
  );

  const fetchTMDB = async (endpoint) => {
    try {
      const sep = endpoint.includes("?") ? "&" : "?";
      const res = await fetch(
        `${TMDB_BASE_URL}${endpoint}${sep}api_key=${TMDB_API_KEY}`,
      );
      if (!res.ok) throw new Error();
      return await res.json();
    } catch {
      return { results: [] };
    }
  };

  // Home shelves
  useEffect(() => {
    const load = async () => {
      const [movies, shows, topMovies, topShows, anime] = await Promise.all([
        fetchTMDB("/trending/movie/day?page=1"),
        fetchTMDB("/trending/tv/day?page=1"),
        fetchTMDB("/movie/top_rated?page=1"),
        fetchTMDB("/tv/top_rated?page=1"),
        fetchTMDB("/discover/tv?with_genres=16&with_original_language=ja&sort_by=popularity.desc&page=1"),
      ]);
      const moviesRes = movies.results || [];
      setTrendingMovies(moviesRes.slice(0, 20));
      setTrendingShows((shows.results || []).slice(0, 20));
      setTopRatedMovies((topMovies.results || []).slice(0, 20));
      setTopRatedShows((topShows.results || []).slice(0, 20));
      setPopularAnime((anime.results || []).slice(0, 20));
      if (moviesRes[0]) setHeroItem(moviesRes[0]);
    };
    load();
  }, []);

  // Section shelves loaded lazily on first visit
  useEffect(() => {
    setHeroItem(null); // Clear hero immediately to avoid "white to black" transition jumps
    if (location.pathname === "/movies") {
      Promise.all([
        fetchTMDB("/movie/now_playing?page=1"),
        fetchTMDB("/movie/popular?page=1"),
        fetchTMDB("/movie/top_rated?page=1"),
        fetchTMDB("/movie/upcoming?page=1"),
      ]).then(([now, pop, top, up]) => {
        setMovieShelves({
          popular: pop.results || [],
          topRated: top.results || [],
          upcoming: up.results || [],
        });
        const bestHero =
          (now.results || []).find((i) => i.backdrop_path) || now.results?.[0];
        if (bestHero) setHeroItem(bestHero);
      });
    }
    if (location.pathname === "/series") {
      Promise.all([
        fetchTMDB("/tv/on_the_air?page=1"),
        fetchTMDB("/trending/tv/day?page=1"),
        fetchTMDB("/tv/popular?page=1"),
        fetchTMDB("/tv/top_rated?page=1"),
      ]).then(([air, tr, pop, top]) => {
        setSeriesShelves({
          trending: tr.results || [],
          popular: pop.results || [],
          topRated: top.results || [],
        });
        const bestHero =
          (air.results || []).find((i) => i.backdrop_path) || air.results?.[0];
        if (bestHero) setHeroItem(bestHero);
      });
    }
    if (location.pathname === "/anime") {
      Promise.all([
        fetchTMDB(
          "/discover/tv?with_genres=16&with_original_language=ja&sort_by=first_air_date.desc&page=1",
        ),
        fetchTMDB("/discover/tv?with_genres=16&with_original_language=ja&sort_by=popularity.desc&page=1"),
        fetchTMDB("/discover/tv?with_genres=16&sort_by=popularity.desc&page=1"),
      ]).then(([latest, trendingAnime, pop]) => {
        const animeTrending = trendingAnime.results || [];
        const animePopular = pop.results || [];
        setAnimeShelves({ trending: animeTrending, popular: animePopular });
        const bestHero =
          (latest.results || []).find((i) => i.backdrop_path) ||
          animeTrending.find((i) => i.backdrop_path) ||
          latest.results?.[0];
        if (bestHero) setHeroItem(bestHero);
      });
    }
    setMobileNavOpen(false);
  }, [location.pathname]);

  const handlePlay = (id, type, liveSrc = null, title = "", item = null) => {
    const canShowHero = ["/home", "/movies", "/series", "/anime"].includes(
      location.pathname,
    );
    if (item && canShowHero) {
      setHeroItem(item);
    }

    const safeSlug = slugify(title);
    let url = "/home";
    let navState = { mediaItem: item };

    if (type === "movie") url = `/movies/${id}-${safeSlug}`;
    if (type === "tv") url = `/series/${id}-${safeSlug}`;
    if (type === "live") {
      const matchId = liveSrc?.matchId || id || "0";
      url = `/live/${matchId}`;
      navState = { matchData: liveSrc, title, mediaItem: item };
    }
    navigate(url, { state: navState });
  };

  const [searchParams, setSearchParams] = useSearchParams();
  const isPlayerView = searchParams.get("view") === "player";
  const isLivePage = location.pathname.startsWith("/live");
  const isTheaterMode = isPlayerView || isLivePage;

  const handleClosePlayer = () => {
    setSearchParams({ view: "details" }, { replace: true });
  };

  const showHero =
    !isDetailPage &&
    ["/home", "/movies", "/series", "/anime"].includes(location.pathname);

  return (
    <div
      className={`app-shell app-shell--topnav ${isTheaterMode ? "theater-mode-active" : ""}`}
    >
      <TopNav isOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />

      <div className="app-content">
        {showHero && (
          <Hero
            media={heroItem}
            allHeroItems={trendingMovies
              .slice(0, 8)
              .filter((m) => m.backdrop_path)}
            onPlay={(id, type) =>
              handlePlay(id, type, null, heroItem?.title || heroItem?.name)
            }
          />
        )}

        <main className="main-content">
          <Routes>
            <Route path="/" element={<Navigate to="/home" replace />} />

            <Route
              path="/home"
              element={
                <div className="home-shelves">
                  <Shelf
                    title="Trending Movies"
                    subtitle="Top 10 this week"
                    iconClass="fa-solid fa-arrow-trend-up"
                    items={trendingMovies.slice(0, 10)}
                    type="movie"
                    onPlay={handlePlay}
                    isNumbered={true}
                  />

                  <Shelf
                    title="Trending Shows"
                    subtitle="Top 10 this week"
                    iconClass="fa-solid fa-tv"
                    items={trendingShows.slice(0, 10)}
                    type="tv"
                    onPlay={handlePlay}
                    isNumbered={true}
                  />

                  <Shelf
                    title="Popular Anime"
                    subtitle="Top Japanese animation"
                    iconClass="fa-solid fa-wand-magic-sparkles"
                    items={popularAnime.slice(0, 10)}
                    type="tv"
                    onPlay={handlePlay}
                    isNumbered={false}
                  />

                  <Providers />

                  <TopRatedShelf
                    movies={topRatedMovies}
                    shows={topRatedShows}
                    onPlay={handlePlay}
                  />

                  <GenreBrowse fetchTMDB={fetchTMDB} onPlay={handlePlay} />
                </div>
              }
            />

            <Route
              path="/search"
              element={
                <SearchPage
                  trendingMovies={trendingMovies}
                  trendingShows={trendingShows}
                  onPlay={handlePlay}
                  fetchTMDB={fetchTMDB}
                />
              }
            />

            <Route
              path="/movies"
              element={
                <SectionPage
                  title="Movies"
                  searchPlaceholder="Search movies..."
                  type="movie"
                  onPlay={handlePlay}
                  fetchTMDB={fetchTMDB}
                  shelves={[
                    { title: "Popular Movies", items: movieShelves.popular },
                    { title: "Top Rated", items: movieShelves.topRated },
                    { title: "Upcoming", items: movieShelves.upcoming },
                  ]}
                />
              }
            />

            <Route
              path="/series"
              element={
                <SectionPage
                  title="TV Shows"
                  searchPlaceholder="Search TV shows..."
                  type="tv"
                  onPlay={handlePlay}
                  fetchTMDB={fetchTMDB}
                  shelves={[
                    {
                      title: "Trending TV Shows",
                      items: seriesShelves.trending,
                    },
                    { title: "Popular TV Shows", items: seriesShelves.popular },
                    {
                      title: "Top Rated TV Shows",
                      items: seriesShelves.topRated,
                    },
                  ]}
                />
              }
            />

            <Route
              path="/anime"
              element={
                <SectionPage
                  title="Anime"
                  searchPlaceholder="Search anime..."
                  type="tv"
                  onPlay={handlePlay}
                  fetchTMDB={fetchTMDB}
                  shelves={[
                    { title: "Trending Anime", items: animeShelves.trending },
                    { title: "Popular Anime", items: animeShelves.popular },
                  ]}
                />
              }
            />

            <Route
              path="/live"
              element={
                <LiveView
                  onPlay={(id, type, url, title) =>
                    handlePlay(id, type, url, title || "live-event")
                  }
                />
              }
            />

            <Route path="/:type/:slug" element={<MediaDetailPage />} />
          </Routes>
        </main>
        {!isTheaterMode && <Footer />}
      </div>
    </div>
  );
}

export default App;
