import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';

const TMDB_API_KEY = '15d2ea6d0dc1d476efbca3eba2b9bbfb';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_HERO_URL = 'https://image.tmdb.org/t/p/original';
const IMAGE_POSTER_URL = 'https://image.tmdb.org/t/p/w500';

const MOVIE_SERVERS = [
    { id: 'vidsrccc', name: 'VidSrc CC (Clean)', getUrl: (id) => `https://vidsrc.cc/v2/embed/movie/${id}?autoPlay=false` },
    { id: 'vidsrcpro', name: 'VidSrc PRO', getUrl: (id) => `https://vidsrc.pro/embed/movie/${id}` },
    { id: 'vidsrcrip', name: 'VidSrc RIP', getUrl: (id) => `https://vidsrc.rip/embed/movie/${id}` },
    { id: 'autoembed', name: 'AutoEmbed', getUrl: (id) => `https://player.autoembed.cc/embed/movie/${id}` },
    { id: 'embedsu', name: 'EmbedSU', getUrl: (id) => `https://embed.su/embed/movie/${id}` },
    { id: 'vidsrc', name: 'VidSrc', getUrl: (id) => `https://vidsrc.me/embed/movie?tmdb=${id}` }
];

const TV_SERVERS = [
    { id: 'vidsrccc', name: 'VidSrc CC (Clean)', getUrl: (id, s, e) => `https://vidsrc.cc/v2/embed/tv/${id}/${s}/${e}?autoPlay=false` },
    { id: 'vidsrcpro', name: 'VidSrc PRO', getUrl: (id, s, e) => `https://vidsrc.pro/embed/tv/${id}/${s}/${e}` },
    { id: 'vidsrcrip', name: 'VidSrc RIP', getUrl: (id, s, e) => `https://vidsrc.rip/embed/tv/${id}/${s}/${e}` },
    { id: 'autoembed', name: 'AutoEmbed', getUrl: (id, s, e) => `https://player.autoembed.cc/embed/tv/${id}/${s}/${e}` },
    { id: 'embedsu', name: 'EmbedSU', getUrl: (id, s, e) => `https://embed.su/embed/tv/${id}/${s}/${e}` },
    { id: 'vidsrc', name: 'VidSrc', getUrl: (id, s, e) => `https://vidsrc.me/embed/tv?tmdb=${id}&season=${s}&episode=${e}` }
];

const MediaDetailPage = () => {
    const { type, slug } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    const [media, setMedia] = useState(null);
    const [loading, setLoading] = useState(true);
    const [embedUrl, setEmbedUrl] = useState('');
    const [streamStatus, setStreamStatus] = useState('loading');

    // Live-specific states
    const [currentMatch, setCurrentMatch] = useState(null);
    const [availableStreams, setAvailableStreams] = useState([]);
    const [activeStreamIndex, setActiveStreamIndex] = useState(0);
    const [streamsLoading, setStreamsLoading] = useState(false);

    // VOD specific states (Movies & Series)
    const [activeServerIndex, setActiveServerIndex] = useState(0);

    // Series-specific states
    const [selectedSeason, setSelectedSeason] = useState(1);
    const [selectedEpisode, setSelectedEpisode] = useState(1);
    const [episodesList, setEpisodesList] = useState([]);
    const [episodesLoading, setEpisodesLoading] = useState(false);
    const [episodeLayout, setEpisodeLayout] = useState('list');
    const [isSeasonDropdownOpen, setIsSeasonDropdownOpen] = useState(false);

    const playerRef = useRef(null);

    // Helper: Fetch Stream URL through Proxies
    const fetchStreamUrl = async (source, id) => {
        const streamApiUrl = `https://streamex.sh/api/live/stream/${source}/${id}`;
        const proxies = [
            `https://corsproxy.io/?url=${encodeURIComponent(streamApiUrl)}`,
            `https://api.allorigins.win/raw?url=${encodeURIComponent(streamApiUrl)}`
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
                console.warn('Proxy failed', proxy, e);
            }
        }
        return null;
    };

    // Initial Media Load
    useEffect(() => {
        const fetchDetails = async () => {
            setLoading(true);
            setMedia(null);
            setStreamStatus('loading');

            if (type === 'live') {
                const matchId = slug;
                const stateData = location.state?.matchData;

                let match = stateData;

                if (!match) {
                    try {
                        const res = await fetch(`https://corsproxy.io/?url=${encodeURIComponent('https://streamex.sh/api/live/matches/all')}`);
                        const allMatches = await res.json();
                        match = allMatches.find(m => m.id === matchId);
                    } catch (e) {
                        console.error('Failed to recover match data', e);
                    }
                }

                if (match) {
                    setCurrentMatch(match);

                    // Construct dynamic title from team names if available
                    let matchTitle = match.title || 'Live Match';
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
                        const firstUrl = await fetchStreamUrl(sources[0].source, sources[0].id);
                        if (firstUrl) {
                            setEmbedUrl(firstUrl);
                            setStreamStatus('ready');
                        } else {
                            setStreamStatus('not_available');
                        }
                        setStreamsLoading(false);
                    } else {
                        setStreamStatus('not_available');
                    }
                } else {
                    setStreamStatus('not_available');
                    setLoading(false);
                }
                return;
            }

            const idMatch = slug.match(/^(\d+)-/);
            const id = idMatch ? idMatch[1] : null;

            if (!id && type !== 'live') {
                navigate('/home');
                return;
            }

            try {
                const tmdbType = type === 'movies' ? 'movie' : 'tv';
                const res = await fetch(`${TMDB_BASE_URL}/${tmdbType}/${id}?api_key=${TMDB_API_KEY}`);
                const data = await res.json();

                if (data.id) {
                    setMedia(data);
                    if (tmdbType === 'tv' && data.seasons && data.seasons.length > 0) {
                        const firstRealSeason = data.seasons.find(s => s.season_number > 0) || data.seasons[0];
                        setSelectedSeason(firstRealSeason.season_number);
                        setSelectedEpisode(1);
                        setEmbedUrl(TV_SERVERS[0].getUrl(id, firstRealSeason.season_number, 1));
                    } else if (tmdbType === 'movie') {
                        setEmbedUrl(MOVIE_SERVERS[0].getUrl(id));
                    }
                    setStreamStatus('ready');
                } else throw new Error('Not found');
            } catch (err) {
                console.error('Error loading media details', err);
                setStreamStatus('error');
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
        setStreamStatus('loading');

        const source = availableStreams[index];
        const url = await fetchStreamUrl(source.source, source.id);

        if (url) {
            setEmbedUrl(url);
            setStreamStatus('ready');
        } else {
            setStreamStatus('error');
        }
        setStreamsLoading(false);
    };

    // Series Episode Select
    const handleEpisodeSelect = (ep) => {
        setSelectedEpisode(ep.episode_number);
        setEmbedUrl(TV_SERVERS[activeServerIndex].getUrl(media.id, selectedSeason, ep.episode_number));
        setStreamStatus('ready');
        if (playerRef.current) {
            playerRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    };

    // Handle VOD Server Select
    const handleServerSelect = (index) => {
        setActiveServerIndex(index);
        const tmdbType = type === 'movies' ? 'movie' : 'tv';
        if (tmdbType === 'tv') {
            setEmbedUrl(TV_SERVERS[index].getUrl(media.id, selectedSeason, selectedEpisode));
        } else {
            setEmbedUrl(MOVIE_SERVERS[index].getUrl(media.id));
        }
    };

    // Secondary fetch for Episodes (TV Series)
    useEffect(() => {
        if (type !== 'series' || !media || !media.id) return;

        const fetchEpisodes = async () => {
            setEpisodesLoading(true);
            try {
                const res = await fetch(`${TMDB_BASE_URL}/tv/${media.id}/season/${selectedSeason}?api_key=${TMDB_API_KEY}`);
                const data = await res.json();
                if (data.episodes) setEpisodesList(data.episodes);
            } catch (e) {
                console.error('Error fetching episodes', e);
            }
            setEpisodesLoading(false);
        };
        fetchEpisodes();
    }, [selectedSeason, media, type]);

    // We no longer block the whole UI with a full-page loading state.
    // Instead, we render the layout immediately and show skeletons where needed.

    // Fallback title while loading
    const displayTitle = media ? (media.title || media.name) : 'Loading Content...';
    const year = media ? (media.release_date || media.first_air_date || '').split('-')[0] : '....';
    const seasons = media ? (media.seasons || []) : [];

    const formatBadgeUrl = (badgeUrl) => {
        if (!badgeUrl) return '';
        if (badgeUrl.startsWith('http')) return `https://wsrv.nl/?url=${encodeURIComponent(badgeUrl)}`;
        return `https://wsrv.nl/?url=${encodeURIComponent('https://streamex.sh' + badgeUrl)}`;
    };

    return (
        <div className={`media-detail-page ${loading ? 'is-loading' : ''}`}>
            <div className="watch-container">
                <div className="sx-top-bar">
                    <button onClick={() => navigate(-1)} className="sx-back-btn">
                        <i className="fa-solid fa-arrow-left"></i>
                        <span>Back</span>
                    </button>
                </div>

                <div className="sx-content-grid">
                    <div className="sx-main">
                        {/* Scoreboard / Header */}
                        {type === 'live' && currentMatch && (
                            <div className="sx-live-header">
                                <div className="sx-live-teams">
                                    <div className="sx-team-box">
                                        <span className="sx-team-name-small">{currentMatch.teams?.home?.name || 'Home'}</span>
                                    </div>
                                    <span className="sx-vs-mini">VS</span>
                                    <div className="sx-team-box">
                                        <span className="sx-team-name-small">{currentMatch.teams?.away?.name || 'Away'}</span>
                                    </div>
                                </div>
                                <div className="sx-live-indicator-tag">
                                    <i className="fa-solid fa-circle" style={{ fontSize: '6px', animation: 'pulse 1.5s infinite' }}></i>
                                    LIVE
                                </div>
                            </div>
                        )}

                        <div className={`sx-player-wrapper ${loading ? 'skeleton-glow' : ''}`} ref={playerRef}>
                            {loading ? (
                                <div className="sx-video-status">
                                    <div className="sx-spinner"></div>
                                    Initializing StreamNest Player...
                                </div>
                            ) : (
                                <>
                                    {(streamStatus === 'loading' || streamsLoading) && (
                                        <div className="sx-video-status">
                                            <div className="sx-spinner"></div>
                                            Connecting to stream...
                                        </div>
                                    )}
                                    {streamStatus === 'not_available' && !streamsLoading && (
                                        <div className="sx-video-status unavailable">
                                            <div style={{ textAlign: 'center' }}>
                                                <i className="fa-solid fa-satellite-dish" style={{ fontSize: '2rem', marginBottom: '0.8rem', display: 'block', opacity: 0.5 }}></i>
                                                Stream not available right now.
                                                <br /><span style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.3rem', display: 'block' }}>The event may have ended or the stream is offline.</span>
                                            </div>
                                        </div>
                                    )}
                                    {streamStatus === 'error' && !streamsLoading && (
                                        <div className="sx-video-status error">
                                            <div style={{ textAlign: 'center' }}>
                                                <i className="fa-solid fa-triangle-exclamation" style={{ fontSize: '2rem', marginBottom: '0.8rem', display: 'block', opacity: 0.5 }}></i>
                                                Failed to load stream.
                                                <br /><span style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.3rem', display: 'block' }}>Please try another stream or try again later.</span>
                                            </div>
                                        </div>
                                    )}
                                    {streamStatus === 'ready' && !streamsLoading && (
                                        <iframe
                                            src={embedUrl}
                                            allowFullScreen
                                            allow="autoplay; fullscreen; encrypted-media"
                                            referrerPolicy="no-referrer"
                                            title="Player"
                                        ></iframe>
                                    )}
                                </>
                            )}
                        </div>

                        <div className={`sx-now-playing-strip ${loading ? 'skeleton-glow' : ''}`}>
                            <div className="sx-np-top">
                                <span className="sx-season-badge">
                                    {type === 'live' ? (
                                        <><i className="fa-solid fa-circle" style={{ color: '#e50914', fontSize: '0.5rem', marginRight: '6px', animation: 'pulse 1.5s infinite' }}></i> Live Match</>
                                    ) : type === 'series' ? `Season ${selectedSeason} • Episode ${selectedEpisode || '-'}` : year}
                                </span>
                            </div>
                            <div className="sx-np-title-block">
                                <div className="sx-np-label">{type === 'live' ? 'Now Watching' : 'Now Playing'}</div>
                                <h1 className="sx-np-title">
                                    {type === 'series'
                                        ? (episodesList.find(e => e.episode_number === selectedEpisode)?.name || 'Select an episode')
                                        : displayTitle}
                                </h1>
                            </div>
                        </div>
                    </div>

                    <div className="sx-sidebar">
                        {loading ? (
                            <div className="sx-sidebar-skeleton skeleton-glow"></div>
                        ) : (
                            <>
                                {/* Live Sports Stream Sidebar */}
                                {type === 'live' && (
                                    <div className="sx-streams-panel">
                                        <h3 className="sx-streams-header">
                                            <i className="fa-solid fa-list-ul"></i>
                                            AVAILABLE STREAMS
                                        </h3>
                                        <div className="sx-stream-list">
                                            {availableStreams.length > 0 ? availableStreams.map((src, i) => (
                                                <button
                                                    key={i}
                                                    className={`sx-stream-btn ${activeStreamIndex === i ? 'active' : ''}`}
                                                    onClick={() => handleSourceSwitch(i)}
                                                >
                                                    <div className="s-info">
                                                        <span className="s-name">
                                                            Source {i + 1}
                                                            <span className="sx-hd-badge">HD</span>
                                                        </span>
                                                        <span className="s-label">{src.source.toUpperCase()} SERVER</span>
                                                    </div>
                                                    <div className="s-check">
                                                        <i className="fa-solid fa-check"></i>
                                                    </div>
                                                </button>
                                            )) : (
                                                <p style={{ color: '#666', fontSize: '0.9rem' }}>No additional sources found.</p>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* VOD Server Select Sidebar */}
                                {type !== 'live' && media && (
                                    <div className="sx-streams-panel" style={{ marginBottom: '1.5rem' }}>
                                        <h3 className="sx-streams-header">
                                            <i className="fa-solid fa-server"></i>
                                            SERVERS
                                        </h3>
                                        <div className="sx-stream-list" style={{ maxHeight: '240px', overflowY: 'auto', paddingRight: '5px' }}>
                                            {(type === 'series' || type === 'tv' ? TV_SERVERS : MOVIE_SERVERS).map((srv, i) => (
                                                <button
                                                    key={srv.id}
                                                    className={`sx-stream-btn ${activeServerIndex === i ? 'active' : ''}`}
                                                    onClick={() => handleServerSelect(i)}
                                                    style={{ border: activeServerIndex === i ? '1px solid #e50914' : '' }}
                                                >
                                                    <div className="s-info">
                                                        <span className="s-name" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            {srv.name}
                                                            {i === 0 && <span className="sx-hd-badge" style={{ background: '#e50914', color: '#fff', border: 'none', padding: '2px 6px', fontSize: '0.55rem', borderRadius: '4px' }}>AD-FREE</span>}
                                                            {i === 1 && <span className="sx-hd-badge" style={{ background: '#1a73e8', color: '#fff', border: 'none', padding: '2px 6px', fontSize: '0.55rem', borderRadius: '4px' }}>FAST</span>}
                                                        </span>
                                                        <span className="s-label">SERVER {i + 1}</span>
                                                    </div>
                                                    <div className="s-check">
                                                        <i className="fa-solid fa-check"></i>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Movies Meta Sidebar */}
                                {(type === 'movies' || type === 'movie') && media && (
                                    <div className="sx-sidebar-meta">
                                        {media.poster_path && (
                                            <img src={`${IMAGE_POSTER_URL}${media.poster_path}`} alt={displayTitle} className="sx-sidebar-poster" />
                                        )}
                                        <div className="sx-meta-info">
                                            <h3 className="sx-meta-main-title">{displayTitle}</h3>
                                            <div className="sx-meta-row">
                                                <span className="sx-meta-label">Status</span>
                                                <span className="sx-meta-val">{media.status || 'Released'}</span>
                                            </div>
                                            <div className="sx-meta-row">
                                                <span className="sx-meta-label">Aired</span>
                                                <span className="sx-meta-val">{media.release_date || 'N/A'}</span>
                                            </div>
                                            {media.overview && (
                                                <p className="sx-meta-overview">{media.overview}</p>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Series Episodes Sidebar */}
                                {(type === 'series' || type === 'tv') && seasons.length > 0 && (
                                    <div className="sx-episodes-panel">
                                        <div className="sx-ep-header">
                                            <div
                                                className="sx-custom-dropdown-container"
                                                onClick={() => setIsSeasonDropdownOpen(!isSeasonDropdownOpen)}
                                            >
                                                <span className="sx-current-label">Season {selectedSeason}</span>
                                                <i className={`fa-solid fa-chevron-down ${isSeasonDropdownOpen ? 'open' : ''}`}></i>
                                                {isSeasonDropdownOpen && (
                                                    <div className="sx-custom-dropdown">
                                                        {seasons.filter(s => s.season_number > 0).map(s => (
                                                            <div
                                                                key={s.id}
                                                                className={`sx-dropdown-item ${selectedSeason === s.season_number ? 'active' : ''}`}
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
                                            <div className="sx-layout-toggles">
                                                <button
                                                    className={`sx-toggle ${episodeLayout === 'list' ? 'active' : ''}`}
                                                    onClick={() => setEpisodeLayout('list')}
                                                >
                                                    <i className="fa-solid fa-list"></i>
                                                </button>
                                                <button
                                                    className={`sx-toggle ${episodeLayout === 'grid' ? 'active' : ''}`}
                                                    onClick={() => setEpisodeLayout('grid')}
                                                >
                                                    <i className="fa-solid fa-table-cells-large"></i>
                                                </button>
                                            </div>
                                        </div>

                                        <div className={`sx-episodes-list ${episodeLayout}`}>
                                            {episodesLoading ? (
                                                <div className="sx-loading">Loading episodes...</div>
                                            ) : (
                                                episodesList.map(ep => (
                                                    <button
                                                        key={ep.id}
                                                        className={`sx-ep-list-btn ${selectedEpisode === ep.episode_number ? 'active' : ''}`}
                                                        onClick={() => handleEpisodeSelect(ep)}
                                                        title={ep.name}
                                                    >
                                                        <span className="sx-ep-num">{episodeLayout === 'grid' ? ep.episode_number : `${ep.episode_number}.`}</span>
                                                        {episodeLayout === 'list' && <span className="sx-ep-name">{ep.name}</span>}
                                                        {episodeLayout === 'list' && selectedEpisode === ep.episode_number && <i className="fa-solid fa-play sx-play-icon"></i>}
                                                    </button>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MediaDetailPage;
