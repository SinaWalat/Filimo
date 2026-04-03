import React from 'react';
import MovieCard from './MovieCard';
import LiveCard from './LiveCard';

const MovieGrid = ({ items, type, onPlay }) => {
    if (!items || items.length === 0) {
        return <p style={{ color: 'var(--text-secondary)' }}>No items found.</p>;
    }

    return (
        <div className={`movie-grid ${type === 'live' ? 'live-grid' : ''}`}>
            {items.map((item, index) => (
                type === 'live' 
                    ? <LiveCard key={item.id || index} media={item} onClick={onPlay} />
                    : <MovieCard key={item.id || index} media={item} type={type} onClick={onPlay} />
            ))}
        </div>
    );
};

export default MovieGrid;
