import React, { useState, useRef, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";

const TopNav = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchVal, setSearchVal] = useState("");
  const [activeTab, setActiveTab] = useState("recent");
  const searchRef = useRef(null);
  const inputRef = useRef(null);

  // Close search modal on outside click
  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Auto-focus input when search opens
  useEffect(() => {
    if (searchOpen) inputRef.current?.focus();
  }, [searchOpen]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchVal.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchVal.trim())}`);
      setSearchOpen(false);
      setSearchVal("");
      if (onClose) onClose();
    }
  };

  const tabs = [
    { key: "all", label: "Movies & TV", icon: "fa-solid fa-clapperboard" },
    { key: "movie", label: "Movie", icon: "fa-solid fa-film" },
    { key: "tv", label: "TV", icon: "fa-solid fa-tv" },
    { key: "anime", label: "Anime", icon: "fa-solid fa-wand-magic-sparkles" },
    { key: "manga", label: "Manga", icon: "fa-solid fa-book" },
    { key: "recent", label: "Recent", icon: "fa-solid fa-clock-rotate-left" },
  ];

  return (
    <>
      <nav className="topnav">
        <div className="topnav-inner">
          <div className="topnav-left">
            <div className="topnav-logo-icon" onClick={() => navigate("/home")}>
              <i className="fa-solid fa-clapperboard"></i>
            </div>
          </div>

          <div className="topnav-links">
            <NavLink
              to="/home"
              className={({ isActive }) =>
                `topnav-link ${isActive ? "active" : ""}`
              }
            >
              <i className="fa-solid fa-house"></i> Home
            </NavLink>
            <NavLink
              to="/movies"
              className={({ isActive }) =>
                `topnav-link ${isActive ? "active" : ""}`
              }
            >
              <i className="fa-solid fa-film"></i> Movies
            </NavLink>
            <NavLink
              to="/series"
              className={({ isActive }) =>
                `topnav-link ${isActive ? "active" : ""}`
              }
            >
              <i className="fa-solid fa-tv"></i> TV Shows
            </NavLink>
            <NavLink
              to="/anime"
              className={({ isActive }) =>
                `topnav-link ${isActive ? "active" : ""}`
              }
            >
              <i className="fa-solid fa-wand-magic-sparkles"></i> Anime
            </NavLink>
          </div>

          <div className="topnav-right">
            <button
              className="topnav-icon-btn"
              onClick={() => setSearchOpen(!searchOpen)}
              aria-label="Search"
            >
              <i className="fa-solid fa-magnifying-glass"></i>
            </button>
            <div className="topnav-user">
              <div className="user-avatar">
                <i
                  className="fa-regular fa-circle-user"
                  style={{ fontSize: "1.2rem", color: "var(--text-secondary)" }}
                ></i>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Sticky Mobile Bottom Navigation */}
      <nav className="mobile-bottom-nav">
        <div className="mobile-bottom-nav-inner">
          <NavLink
            to="/home"
            className={({ isActive }) =>
              `bottom-nav-item ${isActive ? "active" : ""}`
            }
          >
            <i className="fa-solid fa-house"></i>
            <span>Home</span>
          </NavLink>
          <NavLink
            to="/movies"
            className={({ isActive }) =>
              `bottom-nav-item ${isActive ? "active" : ""}`
            }
          >
            <i className="fa-solid fa-film"></i>
            <span>Movies</span>
          </NavLink>
          <NavLink
            to="/series"
            className={({ isActive }) =>
              `bottom-nav-item ${isActive ? "active" : ""}`
            }
          >
            <i className="fa-solid fa-tv"></i>
            <span>TV</span>
          </NavLink>
          <div className="bottom-nav-item" onClick={() => setSearchOpen(true)}>
            <i className="fa-solid fa-magnifying-glass"></i>
            <span>Search</span>
          </div>
          <div className="bottom-nav-item">
            <i className="fa-solid fa-table-cells-large"></i>
            <span>Menu</span>
          </div>
        </div>
      </nav>

      {/* Search Modal Dropdown */}
      {searchOpen && (
        <div className="search-modal-overlay">
          <div className="search-modal" ref={searchRef}>
            <form className="search-modal-bar" onSubmit={handleSearch}>
              <i className="fa-solid fa-magnifying-glass search-modal-icon"></i>
              <input
                ref={inputRef}
                type="text"
                placeholder="Recent searches..."
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
              />
              <button type="button" className="search-modal-filter-btn">
                <i className="fa-solid fa-sliders"></i>
              </button>
            </form>

            <div className="search-modal-tabs">
              {tabs.map((t) => (
                <button
                  key={t.key}
                  className={`search-tab ${activeTab === t.key ? "active" : ""}`}
                  onClick={() => setActiveTab(t.key)}
                >
                  <i className={t.icon}></i> {t.label}
                </button>
              ))}
            </div>

            <div className="search-modal-body">
              <p className="search-modal-empty">No recent searches</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TopNav;
