import React, { useState, useEffect, useRef } from "react";
import {
  useParams,
  useNavigate,
  useLocation,
  useSearchParams,
} from "react-router-dom";

const TMDB_API_KEY = "15d2ea6d0dc1d476efbca3eba2b9bbfb";
const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const IMAGE_HERO_URL = "https://image.tmdb.org/t/p/original";
const IMAGE_POSTER_URL = "https://image.tmdb.org/t/p/w500";
const OMDB_API_KEY = "f276f3e9";
const TVMAZE_API_KEY = "WsUNbq0HtsLXW2o1l6_hFqaUKFpz8hJN";

const MOVIE_SERVERS = [
  {
    id: "vidsrccc",
    name: "VidSrc CC (Ad-Free)",
    getUrl: (id) => `https://vidsrc.cc/v2/embed/movie/${id}?autoPlay=false`,
  },
];

const TV_SERVERS = [
  {
    id: "vidsrccc",
    name: "VidSrc CC (Ad-Free)",
    getUrl: (id, s, e) =>
      `https://vidsrc.cc/v2/embed/tv/${id}/${s}/${e}?autoPlay=false`,
  },
];

const MediaDetailPage = () => {
  const { type, slug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  // Fix: read initial media from navigation state so we don't have a blank blink
  const initialMedia = location.state?.mediaItem || null;
  const [media, setMedia] = useState(initialMedia);
  const [loading, setLoading] = useState(!initialMedia);
  const activeView = searchParams.get("view") || "details";

  const setView = (v) => setSearchParams({ view: v });

  const [embedUrl, setEmbedUrl] = useState("");
  const [streamStatus, setStreamStatus] = useState("loading");

  // Live-specific states
  const [currentMatch, setCurrentMatch] = useState(null);
  const [availableStreams, setAvailableStreams] = useState([]);
  const [activeStreamIndex, setActiveStreamIndex] = useState(0);
  const [streamsLoading, setStreamsLoading] = useState(false);

  // OMDb & TVMaze enrichment
  const [omdbData, setOmdbData] = useState(null);
  const [tvmazeData, setTvmazeData] = useState(null);

  // Series-specific states
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [selectedEpisode, setSelectedEpisode] = useState(1);
  const [episodesList, setEpisodesList] = useState([]);
  const [episodesLoading, setEpisodesLoading] = useState(false);
  const [episodeLayout, setEpisodeLayout] = useState("list");
  const [isSeasonDropdownOpen, setIsSeasonDropdownOpen] = useState(false);
  const [isEpisodeDropdownOpen, setIsEpisodeDropdownOpen] = useState(false);

  const playerRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsSeasonDropdownOpen(false);
        setIsEpisodeDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Helper: Fetch Stream URL through Proxies
  const fetchStreamUrl = async (source, id) => {
    const streamApiUrl = `https://streamex.sh/api/live/stream/${source}/${id}`;
    const proxies = [
      `https://corsproxy.io/?url=${encodeURIComponent(streamApiUrl)}`,
      `https://api.allorigins.win/raw?url=${encodeURIComponent(streamApiUrl)}`,
    ];

    for (const proxy of proxies) {
      try {
        const res = await fetch(proxy);
        const data = await res.json();
        if (data && data.length > 0) {
          const url = data[0].embedUrl || data[0].url || data[0].stream;
          if (url) return url;
        }
      } catch (e) {
        console.warn("Proxy failed", proxy, e);
      }
    }
    return null;
  };

  // Initial Media Load
  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);
      setMedia(null);
      setStreamStatus("loading");

      if (type === "live") {
        const matchId = slug;
        const stateData = location.state?.matchData;

        let match = stateData;

        if (!match) {
          try {
            const res = await fetch(
              `https://corsproxy.io/?url=${encodeURIComponent("https://streamex.sh/api/live/matches/all")}`,
            );
            const allMatches = await res.json();
            match = allMatches.find((m) => m.id === matchId);
          } catch (e) {
            console.error("Failed to recover match data", e);
          }
        }

        if (match) {
          setCurrentMatch(match);

          // Construct dynamic title from team names if available
          let matchTitle = match.title || "Live Match";
          if (match.teams?.home?.name && match.teams?.away?.name) {
            matchTitle = `${match.teams.home.name} vs ${match.teams.away.name}`;
          }

          setMedia({ title: matchTitle, isLive: true });
          const sources = match.sources || [];
          setAvailableStreams(sources);

          // STOP blocking the whole UI here!
          setLoading(false);

          if (sources.length > 0) {
            setStreamsLoading(true);
            const firstUrl = await fetchStreamUrl(
              sources[0].source,
              sources[0].id,
            );
            if (firstUrl) {
              setEmbedUrl(firstUrl);
              setStreamStatus("ready");
            } else {
              setStreamStatus("not_available");
            }
            setStreamsLoading(false);
          } else {
            setStreamStatus("not_available");
          }
        } else {
          setStreamStatus("not_available");
          setLoading(false);
        }
        return;
      }

      const idMatch = slug.match(/^(\d+)-/);
      const id = idMatch ? idMatch[1] : null;

      if (!id && type !== "live") {
        navigate("/home");
        return;
      }

      try {
        const tmdbType = type === "movies" ? "movie" : "tv";
        const res = await fetch(
          `${TMDB_BASE_URL}/${tmdbType}/${id}?api_key=${TMDB_API_KEY}&append_to_response=external_ids`,
        );
        const data = await res.json();

        if (data.id) {
          setMedia(data);
          if (tmdbType === "tv" && data.seasons && data.seasons.length > 0) {
            const firstRealSeason =
              data.seasons.find((s) => s.season_number > 0) || data.seasons[0];
            setSelectedSeason(firstRealSeason.season_number);
            setSelectedEpisode(1);
            setEmbedUrl(
              TV_SERVERS[0].getUrl(id, firstRealSeason.season_number, 1),
            );
          } else if (tmdbType === "movie") {
            setEmbedUrl(MOVIE_SERVERS[0].getUrl(id));
          }
          setStreamStatus("ready");

          // Fetch OMDb data for enriched ratings
          let imdbId = data.imdb_id || null;
          if (!imdbId && tmdbType === "tv") {
            try {
              const extRes = await fetch(
                `${TMDB_BASE_URL}/tv/${id}/external_ids?api_key=${TMDB_API_KEY}`,
              );
              const extData = await extRes.json();
              imdbId = extData.imdb_id || null;
            } catch (e) {
              console.warn("Failed to fetch external IDs", e);
            }
          }
          if (imdbId) {
            try {
              const omdbRes = await fetch(
                `https://www.omdbapi.com/?i=${imdbId}&apikey=${OMDB_API_KEY}&plot=full`,
              );
              const omdb = await omdbRes.json();
              if (omdb.Response === "True") setOmdbData(omdb);
            } catch (e) {
              console.warn("OMDb fetch failed", e);
            }

            // Fetch TVMaze data for TV shows
            if (tmdbType === "tv") {
              try {
                const mazeRes = await fetch(
                  `https://api.tvmaze.com/lookup/shows?imdb=${imdbId}`,
                );
                const mazeShow = await mazeRes.json();
                if (mazeShow && mazeShow.id) setTvmazeData(mazeShow);
              } catch (e) {
                console.warn("TVMaze fetch failed", e);
              }
            }
          }
        } else throw new Error("Not found");
      } catch (err) {
        console.error("Error loading media details", err);
        setStreamStatus("error");
      }
      setLoading(false);
    };

    fetchDetails();
    window.scrollTo(0, 0);
  }, [type, slug, navigate]);

  // Handle Stream Source Switch
  const handleSourceSwitch = async (index) => {
    if (index === activeStreamIndex) return;
    setActiveStreamIndex(index);
    setStreamsLoading(true);
    setStreamStatus("loading");

    const source = availableStreams[index];
    const url = await fetchStreamUrl(source.source, source.id);

    if (url) {
      setEmbedUrl(url);
      setStreamStatus("ready");
    } else {
      setStreamStatus("error");
    }
    setStreamsLoading(false);
  };

  // Series Episode Select
  const handleEpisodeSelect = (ep) => {
    setSelectedEpisode(ep.episode_number);
    setEmbedUrl(
      TV_SERVERS[0].getUrl(media.id, selectedSeason, ep.episode_number),
    );
    setStreamStatus("ready");
    if (playerRef.current) {
      playerRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  // Unified TV Logic Check
  const isTV = type === "series" || type === "tv" || type === "anime";

  // 1. Sync Episode List when Season/Media changes
  useEffect(() => {
    if (!isTV || !media || !media.id) return;

    const fetchEpisodes = async () => {
      setEpisodesLoading(true);
      try {
        const res = await fetch(
          `${TMDB_BASE_URL}/tv/${media.id}/season/${selectedSeason}?api_key=${TMDB_API_KEY}`,
        );
        const data = await res.json();
        if (data.episodes) setEpisodesList(data.episodes);
      } catch (e) {
        console.error("Error fetching episodes", e);
      }
      setEpisodesLoading(false);
    };
    fetchEpisodes();
  }, [selectedSeason, media?.id, type, isTV]);

  // 2. Reactively sync Player URL when selection changes
  useEffect(() => {
    if (!isTV || !media || !media.id) return;
    setEmbedUrl(
      TV_SERVERS[0].getUrl(media.id, selectedSeason, selectedEpisode),
    );
    setStreamStatus("ready");
  }, [media?.id, selectedSeason, selectedEpisode, isTV]);

  // 3. Reset episode to 1 when season changes
  useEffect(() => {
    if (!isTV) return;
    setSelectedEpisode(1);
  }, [selectedSeason, isTV]);

  // We no longer block the whole UI with a full-page loading state.
  // Instead, we render the layout immediately and show skeletons where needed.

  // Fallback title while loading
  const displayTitle = media ? media.title || media.name : "Loading Content...";
  const year = media
    ? (media.release_date || media.first_air_date || "").split("-")[0]
    : "....";
  const seasons = media ? media.seasons || [] : [];

  const formatBadgeUrl = (badgeUrl) => {
    if (!badgeUrl) return "";
    if (badgeUrl.startsWith("http"))
      return `https://wsrv.nl/?url=${encodeURIComponent(badgeUrl)}`;
    return `https://wsrv.nl/?url=${encodeURIComponent("https://streamex.sh" + badgeUrl)}`;
  };

  return (
    <div
      className={`media-detail-page reveal ${loading && !media ? "is-loading" : ""}`}
    >
      {/* Cinematic Hero (Details View) */}
      {activeView === "details" &&
        (!loading || media) &&
        type !== "live" &&
        media && (
          <div
            className="detail-hero-section"
            style={{
              backgroundImage: `url(${IMAGE_HERO_URL}${media.backdrop_path || media.poster_path})`,
            }}
          >
            <div className="detail-hero-gradient"></div>

            {/* HERO BACK BUTTON REMOVED FOR CLEANER LOOK */}

            <div className="detail-hero-content">
              <div className="detail-left-col">
                {media.poster_path && (
                  <img
                    src={`${IMAGE_POSTER_URL}${media.poster_path}`}
                    alt={displayTitle}
                    className="detail-main-poster"
                  />
                )}
                <div className="detail-actions">
                  {isTV ? (
                    <div className="tv-controls-stack">
                      <div className="tv-dropdown-row">
                        <div
                          className="tv-glass-picker"
                          onClick={() =>
                            setIsSeasonDropdownOpen(!isSeasonDropdownOpen)
                          }
                        >
                          <span>Season {selectedSeason}</span>
                          <i className="fa-solid fa-angles-up-down"></i>
                          {isSeasonDropdownOpen && (
                            <div className="tv-picker-dropdown">
                              {media.seasons
                                ?.filter((s) => s.season_number > 0)
                                .map((s) => (
                                  <div
                                    key={s.id}
                                    className={`tv-picker-item ${selectedSeason === s.season_number ? "active" : ""}`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedSeason(s.season_number);
                                      setIsSeasonDropdownOpen(false);
                                    }}
                                  >
                                    Season {s.season_number}
                                  </div>
                                ))}
                            </div>
                          )}
                        </div>
                        <div
                          className="tv-glass-picker"
                          onClick={() =>
                            setIsEpisodeDropdownOpen(!isEpisodeDropdownOpen)
                          }
                        >
                          <span>Episode {selectedEpisode}</span>
                          <i className="fa-solid fa-angles-up-down"></i>
                          {isEpisodeDropdownOpen && (
                            <div className="tv-picker-dropdown">
                              {episodesList.map((ep) => (
                                <div
                                  key={ep.id}
                                  className={`tv-picker-item ${selectedEpisode === ep.episode_number ? "active" : ""}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedEpisode(ep.episode_number);
                                    setIsEpisodeDropdownOpen(false);
                                  }}
                                >
                                  Episode {ep.episode_number}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <button
                        className="btn-tv-trailer-glass"
                        onClick={() =>
                          window.open(
                            `https://www.youtube.com/results?search_query=${displayTitle} trailer`,
                            "_blank",
                          )
                        }
                      >
                        <i className="fa-solid fa-video"></i> Watch Trailer
                      </button>

                      <button
                        className="btn-tv-watch-primary"
                        onClick={() => setView("player")}
                      >
                        <i className="fa-solid fa-tv"></i> Watch S
                        {selectedSeason}E{selectedEpisode}
                      </button>

                      <div className="tv-utility-row">
                        <button className="btn-tv-utility">
                          <i className="fa-regular fa-bookmark"></i> Watch Later
                        </button>
                        <button className="btn-tv-utility">
                          <i className="fa-solid fa-share-nodes"></i> Share
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <button
                        className="btn-cinematic-trailer"
                        onClick={() =>
                          window.open(
                            `https://www.youtube.com/results?search_query=${displayTitle} trailer`,
                            "_blank",
                          )
                        }
                      >
                        <i className="fa-regular fa-circle-play"></i> Watch
                        Trailer
                      </button>
                      <button
                        className="btn-cinematic-watch"
                        onClick={() => setView("player")}
                      >
                        <i className="fa-solid fa-play"></i> Watch{" "}
                        {type === "movies" ? "Movie" : "Show"}
                      </button>
                      <div className="detail-secondary-actions">
                        <button className="btn-glass-small">
                          <i className="fa-solid fa-plus"></i> Share Later
                        </button>
                        <button className="btn-glass-small">
                          <i className="fa-solid fa-share-nodes"></i> Share
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="detail-right-col">
                <h1 className="detail-main-title">{displayTitle}</h1>
                {media.tagline && (
                  <p className="detail-tagline">"{media.tagline}"</p>
                )}

                <div className="detail-meta-row">
                  <span className="meta-item">
                    <i className="fa-regular fa-calendar"></i> {year}
                  </span>
                  {media.runtime ||
                  (media.episode_run_time && media.episode_run_time[0]) ? (
                    <span className="meta-item">
                      <i className="fa-regular fa-clock"></i>{" "}
                      {media.runtime || media.episode_run_time[0]} min
                    </span>
                  ) : null}
                  {media.vote_average ? (
                    <span className="meta-rating-pill">
                      <i className="fa-solid fa-star"></i>{" "}
                      {media.vote_average.toFixed(1)}{" "}
                      <span className="meta-votes">({media.vote_count})</span>
                    </span>
                  ) : null}
                </div>

                {media.genres && (
                  <div className="detail-genres-row">
                    {media.genres.map((g) => (
                      <span key={g.id} className="genre-pill">
                        {g.name}
                      </span>
                    ))}
                  </div>
                )}

                {media.overview && (
                  <div className="detail-overview-box premium-glass">
                    <h3>Overview</h3>
                    <p>{media.overview}</p>
                  </div>
                )}

                <div className="detail-extras-grid">
                  {media.external_ids &&
                    (Object.keys(media.external_ids).some(
                      (k) =>
                        media.external_ids[k] &&
                        [
                          "imdb_id",
                          "facebook_id",
                          "twitter_id",
                          "instagram_id",
                        ].includes(k),
                    ) ||
                      media.homepage) && (
                      <div className="detail-extra-box">
                        <h4>
                          <i className="fa-solid fa-link"></i> Links & Resources
                        </h4>
                        <div className="social-links-row">
                          {media.homepage && (
                            <a
                              href={media.homepage}
                              target="_blank"
                              rel="noreferrer"
                              className="btn-glass-icon"
                            >
                              <i className="fa-solid fa-globe"></i> Website
                            </a>
                          )}
                          {media.external_ids?.imdb_id && (
                            <a
                              href={`https://www.imdb.com/title/${media.external_ids.imdb_id}`}
                              target="_blank"
                              rel="noreferrer"
                              className="btn-glass-icon"
                            >
                              <i className="fa-brands fa-imdb"></i> IMDb
                            </a>
                          )}
                          {media.external_ids?.facebook_id && (
                            <a
                              href={`https://facebook.com/${media.external_ids.facebook_id}`}
                              target="_blank"
                              rel="noreferrer"
                              className="btn-glass-icon"
                            >
                              <i className="fa-brands fa-facebook"></i>
                            </a>
                          )}
                          {media.external_ids?.instagram_id && (
                            <a
                              href={`https://instagram.com/${media.external_ids.instagram_id}`}
                              target="_blank"
                              rel="noreferrer"
                              className="btn-glass-icon"
                            >
                              <i className="fa-brands fa-instagram"></i>
                            </a>
                          )}
                          {media.external_ids?.twitter_id && (
                            <a
                              href={`https://twitter.com/${media.external_ids.twitter_id}`}
                              target="_blank"
                              rel="noreferrer"
                              className="btn-glass-icon"
                            >
                              <i className="fa-brands fa-twitter"></i>
                            </a>
                          )}
                        </div>
                      </div>
                    )}

                  {media.production_companies &&
                    media.production_companies.length > 0 && (
                      <div className="detail-extra-box">
                        <h4>
                          <i className="fa-solid fa-building"></i> Production
                          Companies
                        </h4>
                        <div className="production-logos-row">
                          {media.production_companies
                            .filter((pc) => pc.logo_path)
                            .slice(0, 4)
                            .map((pc) => (
                              <div
                                key={pc.id}
                                className="prod-logo-box"
                                title={pc.name}
                              >
                                <img
                                  src={`https://image.tmdb.org/t/p/w200${pc.logo_path}`}
                                  alt={pc.name}
                                />
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                </div>
              </div>
            </div>
          </div>
        )}

      {/* Fullscreen Player View */}
      {(activeView === "player" || type === "live") && (
        <div className="cinemaos-player-fullscreen theater-mode">
          {/* Background Backdrop for the Player overlay frame */}
          {media && (media.backdrop_path || media.poster_path) && (
            <div
              className="player-backdrop"
              style={{
                backgroundImage: `url(${IMAGE_HERO_URL}${media.backdrop_path || media.poster_path})`,
              }}
            ></div>
          )}
          <div className="player-backdrop-gradient"></div>

          <div className="player-content-layer">
            {/* TOP NAVIGATION OVERLAY */}
            <div className="cinemaos-player-header">
              <div className="player-header-left">
              </div>
              <div className="player-header-right">
                {/* Season selector moved to episodes overlay inside tabs */}
                {/* Removed search and close icons per user request */}
              </div>
            </div>

            <div className="player-layout-main" style={!isTV ? { paddingTop: 0 } : { paddingTop: "80px" }}>
              <div
                className={`sx-player-wrapper fullscreen ${!isTV ? 'is-movie' : ''} ${loading ? "skeleton-glow" : ""}`}
              >
                {loading ? (
                  <div className="sx-video-status">
                    <div className="sx-spinner"></div>
                    <div className="sx-status-text">SCANNING SOURCES...</div>
                  </div>
                ) : (
                  <>
                    {(streamStatus === "loading" || streamsLoading) && (
                      <div className="sx-video-status">
                        <div className="sx-spinner"></div>
                        <div className="sx-status-text">
                          PREPARING STREAM...
                        </div>
                      </div>
                    )}
                    {streamStatus === "ready" && !streamsLoading && (
                      <iframe
                        src={embedUrl}
                        allowFullScreen
                        allow="autoplay; fullscreen; encrypted-media"
                        referrerPolicy="no-referrer"
                        title="Player"
                        sandbox="allow-same-origin allow-scripts allow-presentation"
                      ></iframe>
                    )}
                    {/* BOTTOM LEFT INFO OVERLAY REMOVED AS IT WAS COVERING THE VIDEO */}
                  </>
                )}
              </div>

              {isTV && (
                <div className="series-episodes-overlay right-sidebar">
                  <div className="sx-dropdown-row" ref={dropdownRef}>
                    <div className="sx-custom-dropdown-container sx-full-dropdown" onClick={() => { setIsSeasonDropdownOpen(!isSeasonDropdownOpen); setIsEpisodeDropdownOpen(false); }}>
                      <div className="sx-dropdown-btn">
                        <span>Season {selectedSeason}</span>
                        <i className={`fa-solid fa-chevron-down ${isSeasonDropdownOpen ? 'open' : ''}`}></i>
                      </div>
                      {isSeasonDropdownOpen && (
                        <div className="sx-dropdown-menu">
                          {seasons.filter((s) => s.season_number > 0).map((s) => (
                            <div
                              key={s.id}
                              className={`sx-dropdown-item ${selectedSeason === s.season_number ? 'active' : ''}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedSeason(s.season_number);
                                setIsSeasonDropdownOpen(false);
                              }}
                            >
                              <span className="sx-dropdown-check">
                                {selectedSeason === s.season_number && <i className="fa-solid fa-check"></i>}
                              </span>
                              <span>Season {s.season_number}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="sx-custom-dropdown-container sx-full-dropdown" onClick={() => { setIsEpisodeDropdownOpen(!isEpisodeDropdownOpen); setIsSeasonDropdownOpen(false); }}>
                      <div className="sx-dropdown-btn">
                        <span>Episode {selectedEpisode}</span>
                        <i className={`fa-solid fa-chevron-down ${isEpisodeDropdownOpen ? 'open' : ''}`}></i>
                      </div>
                      {isEpisodeDropdownOpen && (
                        <div className="sx-dropdown-menu">
                          {episodesLoading ? (
                            <div className="sx-dropdown-item">Loading...</div>
                          ) : (
                            episodesList.map((ep) => (
                              <div
                                key={ep.id}
                                className={`sx-dropdown-item ${selectedEpisode === ep.episode_number ? 'active' : ''}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEpisodeSelect(ep);
                                  setIsEpisodeDropdownOpen(false);
                                }}
                              >
                                <span className="sx-dropdown-check">
                                  {selectedEpisode === ep.episode_number && <i className="fa-solid fa-check"></i>}
                                </span>
                                <span>Episode {ep.episode_number}</span>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="sx-episodes-list rich-cards">
                    {episodesLoading ? (
                      <div className="sx-loading">Loading episodes...</div>
                    ) : (
                      episodesList.map((ep) => (
                        <div
                          key={ep.id}
                          className={`sx-ep-card ${selectedEpisode === ep.episode_number ? "active" : ""}`}
                          onClick={() => handleEpisodeSelect(ep)}
                        >
                          <div className="ep-card-thumb">
                            <img
                              src={
                                ep.still_path
                                  ? `https://image.tmdb.org/t/p/w300${ep.still_path}`
                                  : `${IMAGE_HERO_URL}${media.backdrop_path}`
                              }
                              alt={ep.name}
                            />
                            {selectedEpisode === ep.episode_number && (
                              <div className="now-playing-badge">PLAYING</div>
                            )}
                            <div className="ep-card-meta-top">
                              <span className="ep-rating">
                                <i className="fa-solid fa-star"></i>{" "}
                                {ep.vote_average?.toFixed(1) || "0.0"}
                              </span>
                              <span className="ep-duration">
                                {ep.runtime || "24"}m
                              </span>
                            </div>
                          </div>
                          <div className="ep-card-info">
                            <span className="ep-label">
                              E{ep.episode_number}
                            </span>
                            <h3 className="ep-title">{ep.name}</h3>
                            {selectedEpisode === ep.episode_number && (
                              <div className="ep-progress-bar">
                                <div className="progress-fill"></div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MediaDetailPage;
