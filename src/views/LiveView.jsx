import React, { useState, useEffect } from 'react';
import MovieGrid from '../components/MovieGrid';

const STREAMEX_API = 'https://streamex.sh/api/live/matches/all';

const fetchStreamExMatches = async () => {
    const proxyUrls = [
        `https://corsproxy.io/?url=${encodeURIComponent(STREAMEX_API)}`,
        `https://api.allorigins.win/raw?url=${encodeURIComponent(STREAMEX_API)}`,
        `https://api.codetabs.com/v1/proxy/?quest=${encodeURIComponent(STREAMEX_API)}`,
        STREAMEX_API, // direct attempt as last resort (may work in some environments)
    ];

    for (const url of proxyUrls) {
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 8000);
            const r = await fetch(url, { signal: controller.signal });
            clearTimeout(timeout);
            if (!r.ok) continue;
            const text = await r.text();
            const data = JSON.parse(text);
            if (Array.isArray(data) && data.length > 0) return data;
        } catch (e) {
            console.warn('Proxy failed:', url, e.message);
            continue;
        }
    }
    throw new Error('All proxies failed to fetch live sports data');
};

const LiveView = ({ onPlay }) => {
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    const [timeFilter, setTimeFilter] = useState('all');
    const [catFilter, setCatFilter] = useState('all');
    const [isDropdownActive, setIsDropdownActive] = useState(false);

    const loadLive = async () => {
        setLoading(true);
        setError('');
        try {
            const data = await fetchStreamExMatches();
            if (!Array.isArray(data)) throw new Error('Invalid data format');
            setMatches(data);
        } catch (e) {
            console.error('Failed to load Live Sports', e);
            setError('Failed to load live sports or stream APIs changed.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadLive();
    }, []);

    const categories = React.useMemo(() => {
        const cats = {};
        matches.forEach(match => {
            const cat = match.category ? match.category.replace('-', ' ') : 'Other';
            if (!cats[cat]) cats[cat] = [];
            cats[cat].push(match);
        });
        return cats;
    }, [matches]);

    const getFilteredMatches = (catMatches) => {
        const now = Date.now();
        const todayStart = new Date().setHours(0,0,0,0);
        const todayEnd = new Date().setHours(23,59,59,999);
        
        return catMatches.filter(card => {
            const isLive = !card.date || card.date <= 0;
            const timestamp = parseInt(card.date, 10) || 0;
            
            if (timeFilter === 'live') {
                return isLive || (timestamp > 0 && timestamp <= now + 3600000 && timestamp > now - 14400000); 
            } else if (timeFilter === 'today') {
                return (timestamp >= todayStart && timestamp <= todayEnd) || isLive;
            }
            return true;
        }).sort((a,b) => (b.popular === true) - (a.popular === true));
    };

    return (
        <section className="movie-section" style={{ marginTop: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '0.5rem' }}>
                <i className="fa-solid fa-satellite-dish" style={{ color: 'var(--accent-primary)', fontSize: '1.5rem' }}></i>
                <h1 style={{ fontSize: '2rem' }}>Live Sports</h1>
            </div>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Watch live sports events from around the world</p>
            
            <div className="live-filters">
                <div className="lf-left">
                    <button className={`lf-btn ${timeFilter === 'live' ? 'active' : ''}`} onClick={() => setTimeFilter('live')}>
                        <i className="fa-solid fa-broadcast-tower"></i> Live Now
                    </button>
                    <button className={`lf-btn ${timeFilter === 'today' ? 'active' : ''}`} onClick={() => setTimeFilter('today')}>
                        <i className="fa-regular fa-calendar"></i> Today
                    </button>
                    <button className={`lf-btn ${timeFilter === 'all' ? 'active' : ''}`} onClick={() => setTimeFilter('all')}>
                        <i className="fa-solid fa-trophy"></i> All Matches
                    </button>
                    
                    <div className="custom-select" onClick={(e) => { e.stopPropagation(); setIsDropdownActive(!isDropdownActive); }}>
                        <div className="cs-trigger">
                            <span>{catFilter === 'all' ? 'Categories' : catFilter}</span> 
                            <i className="fa-solid fa-chevron-down" style={{ fontSize: '0.8rem', color: '#666' }}></i>
                        </div>
                        <div className={`cs-dropdown ${isDropdownActive ? 'active' : ''}`}>
                            <div className={`cs-option ${catFilter === 'all' ? 'selected' : ''}`} onClick={() => setCatFilter('all')}>
                                <i className="fa-solid fa-check"></i> Categories
                            </div>
                            {Object.keys(categories).sort().map(cat => (
                                <div key={cat} className={`cs-option ${catFilter === cat ? 'selected' : ''}`} onClick={() => setCatFilter(cat)}>
                                    <i className="fa-solid fa-check"></i> {cat}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <button className="lf-btn refresh-btn" style={{ border: '1px solid rgba(255,255,255,0.05)', background: '#111' }} onClick={loadLive}>
                    <i className="fa-solid fa-rotate-right"></i> Refresh
                </button>
            </div>

            <div id="live-categories-container">
                {loading && <p style={{ color: 'var(--text-secondary)' }}>Loading live sports...</p>}
                {error && <p style={{ color: 'var(--accent-primary)' }}>{error}</p>}
                {!loading && !error && Object.entries(categories).map(([catName, items]) => {
                    if (catFilter !== 'all' && catFilter !== catName) return null;
                    const filtered = getFilteredMatches(items);
                    if (filtered.length === 0) return null;
                    
                    return (
                        <div key={catName} className="live-category-section" style={{ marginBottom: '3rem' }}>
                            <h3 style={{ color: '#fff', marginBottom: '1.5rem', textTransform: 'capitalize' }}>
                                <i className="fa-solid fa-circle" style={{ color: 'var(--accent-primary)', fontSize: '0.6rem', marginRight: '8px', position: 'relative', top: '-2px' }}></i> 
                                {catName}
                            </h3>
                            <MovieGrid items={filtered} type="live" onPlay={onPlay} />
                        </div>
                    );
                })}
            </div>
        </section>
    );
};

export default LiveView;
