import React from "react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="custom-footer">
      <div className="footer-top-banner">
        <h2>All Your Favorite Platforms In One Place</h2>
        <div className="footer-banner-links">
          <Link to="/">Home</Link>
          <Link to="/movies">Movies</Link>
          <Link to="/series">TV</Link>
          <Link to="/search">Search</Link>
        </div>
      </div>

      <div className="footer-container">
        <div className="footer-left">
          <h2 className="footer-logo">FilmoKurd</h2>
          <p className="footer-tagline">Your entertainment hub</p>
          <div className="footer-links-col">
            <Link to="/">Trending</Link>
            <Link to="/movies">Movies</Link>
            <Link to="/series">TV Shows</Link>
            <Link to="/search">Search</Link>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="footer-disclaimer">
          <h4>Important Disclaimer</h4>
          <p>
            FilmoKurd operates as a content aggregator and does not host any
            media files on our servers. All content is sourced from third-party
            providers and embedded services. For any copyright concerns or DMCA
            takedown requests, please contact the respective content providers
            directly.
          </p>
        </div>
        <p className="footer-love">
          Built with ❤️ for entertainment enthusiasts worldwide
        </p>
      </div>
    </footer>
  );
};

export default Footer;
