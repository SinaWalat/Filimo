import React from 'react';

const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

const MovieCard = ({ media, type, onClick }) => {
    const title = media.title || media.name;
    const mediaType = type || media.media_type || (media.first_air_date ? 'tv' : 'movie');
    const imageUrl = media.poster_path ? `${TMDB_IMAGE_BASE_URL}${media.poster_path}` : 'https://via.placeholder.com/500x750?text=No+Image';
    const year = (media.release_date || media.first_air_date || 'N/A').substring(0, 4);
    const rating = media.vote_average ? media.vote_average.toFixed(1) : 'NR';

    return (
        <div className="movie-card" onClick={() => onClick(media.id, mediaType, null, title)}>
            <img src={imageUrl} alt={title} loading="lazy" onError={(e) => {e.target.src='https://via.placeholder.com/500x750?text=No+Image'}} />
            <div className="play-icon"><i className="fa-solid fa-play"></i></div>
            <div className="card-overlay">
                <h3 className="card-title">{title}</h3>
                <div className="card-info">
                    <span>{year}</span>
                    <span style={{ textTransform: 'uppercase' }}>{mediaType}</span>
                    <span className="rating"><i className="fa-solid fa-star"></i> {rating}</span>
                </div>
            </div>
        </div>
    );
};

export default MovieCard;
