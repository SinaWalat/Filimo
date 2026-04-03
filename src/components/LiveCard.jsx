import React, { useState, useEffect } from 'react';

const getSportsDbCache = () => {
    try {
        return JSON.parse(localStorage.getItem('sn_logos')) || {};
    } catch(e) {
        return {};
    }
};

const saveLogoCache = (cache) => {
    try {
        localStorage.setItem('sn_logos', JSON.stringify(cache));
    } catch(e) {}
};

let sportsDbCache = getSportsDbCache();

const LiveCard = ({ media, onClick }) => {
    const title = media.title || 'Live Event';
    const category = media.category || 'Live Sports';
    
    let timeStr = '';
    let isLive = false;
    if (media.date && media.date > 0) {
        const date = new Date(media.date);
        timeStr = date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    } else {
        timeStr = 'LIVE';
        isLive = true;
    }

    const [homeLogo, setHomeLogo] = useState(null);
    const [awayLogo, setAwayLogo] = useState(null);

    useEffect(() => {
        if (!media.teams) return;
        const resolveTeamLogo = async (teamName, setter) => {
            if (sportsDbCache[teamName] && sportsDbCache[teamName] !== 'NONE') {
                setter(sportsDbCache[teamName]);
                return;
            }
            if (sportsDbCache[teamName] === 'NONE') return;

            let logoUrl = null;
            try {
                const r = await fetch(`https://www.thesportsdb.com/api/v1/json/3/searchteams.php?t=${encodeURIComponent(teamName)}`);
                if (r.ok) {
                    const d = await r.json();
                    if (d?.teams?.[0]?.strBadge) logoUrl = d.teams[0].strBadge;
                }
            } catch(e) {}
            
            if (!logoUrl) {
                try {
                    const wr = await fetch(`https://en.wikipedia.org/w/api.php?action=query&prop=pageimages&titles=${encodeURIComponent(teamName)}&pithumbsize=100&format=json&origin=*`);
                    if (wr.ok) {
                        const wd = await wr.json();
                        const page = Object.values(wd.query?.pages || {})[0];
                        if (page?.thumbnail?.source) logoUrl = page.thumbnail.source;
                    }
                } catch(e) {}
            }
            
            sportsDbCache[teamName] = logoUrl || 'NONE';
            saveLogoCache(sportsDbCache);
            if (logoUrl) setter(logoUrl);
        };

        if (media.teams.home?.name) resolveTeamLogo(media.teams.home.name, setHomeLogo);
        if (media.teams.away?.name) resolveTeamLogo(media.teams.away.name, setAwayLogo);
    }, [media]);

    const handleClick = () => {
        // Pass the full media object so teams/badges are available in the detail page
        onClick(media.id, 'live', { matchId: media.id, sources: media.sources || [], teams: media.teams, title: title }, title);
    };

    if (media.teams && media.teams.home && media.teams.away) {
        const home = media.teams.home;
        const away = media.teams.away;
        
        const parseBadge = (badgeUrl) => {
            if (!badgeUrl) return '';
            if (badgeUrl.startsWith('http')) return `https://wsrv.nl/?url=${encodeURIComponent(badgeUrl)}`;
            if (badgeUrl.startsWith('/')) return `https://wsrv.nl/?url=${encodeURIComponent('https://streamex.sh' + badgeUrl)}`;
            return ''; 
        };
        
        const initialHomeBadge = parseBadge(home.badge);
        const initialAwayBadge = parseBadge(away.badge);

        return (
            <div className="live-card-v2" onClick={handleClick}>
                <div className="lc-header">
                    <span className="lc-category">{category.replace('-', ' ')}</span>
                    {isLive && <span className="lc-badge-live"><i className="fa-solid fa-circle"></i> LIVE</span>}
                </div>
                <div className="lc-teams">
                    <div className="lc-team">
                        {homeLogo || initialHomeBadge ? (
                            <img src={homeLogo || initialHomeBadge} alt={home.name} className="lc-team-logo" loading="lazy" onError={(e) => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }} />
                        ) : null}
                        <div className="fallback-logo" style={{ display: (homeLogo || initialHomeBadge) ? 'none' : 'flex' }}>X</div>
                        <div className="lc-team-name">{home.name}</div>
                    </div>
                    <div className="lc-vs-box">
                        <span className="lc-vs">VS</span>
                        <span className="lc-time">{timeStr}</span>
                    </div>
                    <div className="lc-team">
                        {awayLogo || initialAwayBadge ? (
                            <img src={awayLogo || initialAwayBadge} alt={away.name} className="lc-team-logo" loading="lazy" onError={(e) => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }} />
                        ) : null}
                        <div className="fallback-logo" style={{ display: (awayLogo || initialAwayBadge) ? 'none' : 'flex' }}>X</div>
                        <div className="lc-team-name">{away.name}</div>
                    </div>
                </div>
                <div className="lc-footer">{title}</div>
            </div>
        );
    }

    const parsePoster = (posterUrl) => {
        if (!posterUrl) return '';
        if (posterUrl.startsWith('http')) return `https://wsrv.nl/?url=${encodeURIComponent(posterUrl)}`;
        if (posterUrl.startsWith('/')) return `https://wsrv.nl/?url=${encodeURIComponent('https://streamex.sh' + posterUrl)}`;
        return '';
    };

    const imgUrl = parsePoster(media.poster);

    return (
        <div className="live-card-v2" onClick={handleClick}>
            <div className="lc-header">
                <span className="lc-category">{category.replace('-', ' ')}</span>
                {isLive && <span className="lc-badge-live"><i className="fa-solid fa-circle"></i> LIVE</span>}
            </div>
            <div className="lc-image-cont">
                {imgUrl ? (
                    <img src={imgUrl} alt={title} loading="lazy" onError={(e) => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }} />
                ) : null}
                <div className="fallback-poster" style={{ display: imgUrl ? 'none' : 'flex' }}>X</div>
            </div>
            <div className="lc-footer" style={{ borderTop: 'none' }}>{title}</div>
        </div>
    );
};

export default LiveCard;
