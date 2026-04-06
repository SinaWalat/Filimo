import React from "react";
import { NavLink, useNavigate } from "react-router-dom";

const Navbar = ({ onSearch }) => {
  const navigate = useNavigate();

  const handleSearch = () => {
    const val = document.getElementById("search-input").value;
    if (val) {
      onSearch(val);
      navigate(`/search?q=${encodeURIComponent(val)}`);
    }
  };

  return (
    <nav className="glass-nav">
      <div className="nav-container">
        <div className="logo" onClick={() => navigate("/home")}>
          <i className="fa-solid fa-play"></i> StreamNest
        </div>

        <div className="nav-tabs">
          <NavLink
            to="/home"
            className={({ isActive }) => `tab-btn ${isActive ? "active" : ""}`}
          >
            Home
          </NavLink>
          <NavLink
            to="/movies"
            className={({ isActive }) => `tab-btn ${isActive ? "active" : ""}`}
          >
            Movies
          </NavLink>
          <NavLink
            to="/series"
            className={({ isActive }) => `tab-btn ${isActive ? "active" : ""}`}
          >
            Series
          </NavLink>
          <NavLink
            to="/live"
            className={({ isActive }) => `tab-btn ${isActive ? "active" : ""}`}
          >
            Live TV <span className="live-dot"></span>
          </NavLink>
        </div>

        <div className="search-container">
          <input
            type="text"
            id="search-input"
            placeholder="Search..."
            onKeyPress={(e) => e.key === "Enter" && handleSearch()}
          />
          <button id="search-btn" onClick={handleSearch}>
            <i className="fa-solid fa-search"></i>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
