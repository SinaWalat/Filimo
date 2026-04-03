import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

const Sidebar = ({ isOpen, onClose }) => {
    const navigate = useNavigate();
    const [searchVal, setSearchVal] = useState('');

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchVal.trim()) {
            navigate(`/search?q=${encodeURIComponent(searchVal.trim())}`);
            if (onClose) onClose();
        }
    };

    return (
        <aside className={`sidebar ${isOpen ? 'sidebar--open' : ''}`}>
            <div className="sidebar-logo" onClick={() => { navigate('/home'); if (onClose) onClose(); }}>
                <i className="fa-solid fa-play"></i>
                <span>StreamNest</span>
            </div>

            <nav className="sidebar-nav">
                <NavLink to="/home" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={onClose}>
                    <i className="fa-solid fa-house"></i>
                    <span>Home</span>
                </NavLink>

                <NavLink to="/search" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={onClose}>
                    <i className="fa-solid fa-magnifying-glass"></i>
                    <span>Search</span>
                </NavLink>
            </nav>

            <div className="sidebar-section">
                <span className="sidebar-label">MEDIA</span>
                <NavLink to="/movies" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={onClose}>
                    <i className="fa-solid fa-film"></i>
                    <span>Movies</span>
                </NavLink>
                <NavLink to="/series" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={onClose}>
                    <i className="fa-solid fa-tv"></i>
                    <span>TV Shows</span>
                </NavLink>
                <NavLink to="/anime" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={onClose}>
                    <i className="fa-solid fa-star"></i>
                    <span>Anime</span>
                </NavLink>
                <NavLink to="/live" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={onClose}>
                    <i className="fa-solid fa-signal"></i>
                    <span>Live Sports</span>
                    <span className="sidebar-live-dot"></span>
                </NavLink>
            </div>

            <div className="sidebar-section sidebar-section--bottom">
                <span className="sidebar-label">MORE</span>
                <a href="#" className="sidebar-link">
                    <i className="fa-solid fa-bookmark"></i>
                    <span>Watchlist</span>
                </a>
                <a href="#" className="sidebar-link">
                    <i className="fa-solid fa-clock-rotate-left"></i>
                    <span>History</span>
                </a>
                <a href="#" className="sidebar-link">
                    <i className="fa-solid fa-scale-balanced"></i>
                    <span>Legal/DMCA</span>
                </a>
            </div>
        </aside>
    );
};

export default Sidebar;
