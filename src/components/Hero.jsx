import React from 'react';

const TMDB_IMAGE_HERO_URL = 'https://image.tmdb.org/t/p/original';

const Hero = ({ media, type, onPlay }) => {
    const mediaType = media ? (type || media.media_type || (media.first_air_date ? 'tv' : 'movie')) : null;
    const heroBgSrc = media ? `${TMDB_IMAGE_HERO_URL}${media.backdrop_path}` : null;
    const badgeText = mediaType === 'tv' ? 'Trending Series' : 'Trending Movie';
    const badgeIcon = mediaType === 'tv' ? 'fa-tv' : 'fa-film';

    return (
        <header className="hero" id="hero-section" style={{ backgroundColor: '#000' }}>
            {media && (
                <>
                    <div className="hero-overlay"></div>
                    <img id="hero-bg" src={heroBgSrc} alt="Hero Background" />
                    <div className="hero-content">
                        <div className="hero-text">
                            <span className="badge" id="hero-badge"><i className={`fa-solid ${badgeIcon}`}></i> {badgeText}</span>
                            <h1 id="hero-title">{media.title || media.name}</h1>
                            <p id="hero-overview">{media.overview}</p>
                            <div className="hero-actions">
                                <button className="btn btn-primary" id="hero-play-btn" onClick={() => onPlay(media.id, mediaType)}>
                                    <i className="fa-solid fa-play"></i> Watch Now
                                </button>
                                <button className="btn btn-secondary"><i className="fa-solid fa-info-circle"></i> Details</button>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </header>
    );
};

export default Hero;
