// StreamNest SP Architecture & Live TV
const TMDB_API_KEY = '15d2ea6d0dc1d476efbca3eba2b9bbfb'; // Proxy key
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';
const IMAGE_HERO_URL = 'https://image.tmdb.org/t/p/original';

// Live TV source now dynamically fetches from StreamEx APIs

// DOM Elements
const heroBg = document.getElementById('hero-bg');
const heroTitle = document.getElementById('hero-title');
const heroOverview = document.getElementById('hero-overview');
const heroPlayBtn = document.getElementById('hero-play-btn');
const heroBadge = document.getElementById('hero-badge');

const searchSection = document.getElementById('search-section');
const searchGrid = document.getElementById('search-grid');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');

const modal = document.getElementById('player-modal');
const closeModal = document.getElementById('close-modal');
const videoContainer = document.getElementById('video-container');

// State Management
let currentMoviePage = 1;
let currentTvPage = 1;

let currentSportsFilters = { time: 'all', category: 'all' };

let sportsDbCache = {};
try {
    sportsDbCache = JSON.parse(localStorage.getItem('sn_logos')) || {};
} catch(e) {}

const saveLogoCache = () => {
    try {
        localStorage.setItem('sn_logos', JSON.stringify(sportsDbCache));
    } catch(e) {}
};

function applyLiveFilters() {
    const timeFilter = currentSportsFilters.time; 
    const catFilter = currentSportsFilters.category; 
    
    const now = Date.now();
    const todayStart = new Date().setHours(0,0,0,0);
    const todayEnd = new Date().setHours(23,59,59,999);
    
    document.querySelectorAll('.live-category-section').forEach(sec => {
        let visibleCount = 0;
        const sectionCat = sec.dataset.category;
        
        if (catFilter !== 'all' && sectionCat !== catFilter) {
            sec.style.display = 'none';
            return;
        }
        
        sec.querySelectorAll('.live-card-v2').forEach(card => {
            const isLive = card.dataset.islive === 'true';
            const timestamp = parseInt(card.dataset.timestamp, 10);
            
            let cardVisible = true;
            if (timeFilter === 'live') {
                // Heuristic: Explicitly live, or recent/upcoming within bounds
                cardVisible = isLive || (timestamp > 0 && timestamp <= now + 3600000 && timestamp > now - 14400000); 
            } else if (timeFilter === 'today') {
                cardVisible = (timestamp >= todayStart && timestamp <= todayEnd) || isLive;
            }
            
            card.style.display = cardVisible ? 'flex' : 'none';
            if (cardVisible) visibleCount++;
        });
        
        sec.style.display = visibleCount > 0 ? 'block' : 'none';
    });
}

// Fetch utility
async function fetchTMDB(endpoint) {
    try {
        const response = await fetch(`${TMDB_BASE_URL}${endpoint}&api_key=${TMDB_API_KEY}`);
        if (!response.ok) throw new Error('Network response was not ok');
        return await response.json();
    } catch (error) {
        console.error('Error fetching TMDB:', error);
        return { results: [] };
    }
}

// Generate Media Card (Movie / TV / Live)
function createMediaCard(media, type) {
    const card = document.createElement('div');
    card.className = type === 'live' ? 'live-card-v2' : 'movie-card';
    
    // Live TV logic
    if (type === 'live') {
        const title = media.title || 'Live Event';
        const category = media.category || 'Live Sports';
        
        card.onclick = () => openPlayer(media.id, 'live', media.sources && media.sources.length > 0 ? media.sources[0] : null);
        
        let timeStr = '';
        let isLive = false;
        if (media.date && media.date > 0) {
            const date = new Date(media.date);
            timeStr = date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        } else {
            timeStr = 'LIVE';
            isLive = true;
        }
        
        card.dataset.islive = isLive;
        card.dataset.timestamp = media.date || 0;

        if (media.teams && media.teams.home && media.teams.away) {
            const home = media.teams.home;
            const away = media.teams.away;
            
            const parseBadge = (badgeUrl) => {
                if (!badgeUrl) return '';
                if (badgeUrl.startsWith('http')) return `https://wsrv.nl/?url=${encodeURIComponent(badgeUrl)}`;
                if (badgeUrl.startsWith('/')) return `https://wsrv.nl/?url=${encodeURIComponent('https://streamex.sh' + badgeUrl)}`;
                return ''; // StreamEx encrypted hashes are blocked by CF, skip directly to fallback
            };
            
            const homeBadge = parseBadge(home.badge);
            const awayBadge = parseBadge(away.badge);
            
            const homeBadgeHtml = homeBadge ? `<img src="${homeBadge}" alt="${home.name}" class="lc-team-logo" onerror="this.outerHTML='<div class=\\'fallback-logo\\'>X</div>'" loading="lazy">` : `<div class="fallback-logo lazy-badge" data-team="${home.name}">X</div>`;
            const awayBadgeHtml = awayBadge ? `<img src="${awayBadge}" alt="${away.name}" class="lc-team-logo" onerror="this.outerHTML='<div class=\\'fallback-logo\\'>X</div>'" loading="lazy">` : `<div class="fallback-logo lazy-badge" data-team="${away.name}">X</div>`;
            
            card.innerHTML = `
                <div class="lc-header">
                    <span class="lc-category">${category.replace('-', ' ')}</span>
                    ${isLive ? '<span class="lc-badge-live"><i class="fa-solid fa-circle"></i> LIVE</span>' : ''}
                </div>
                <div class="lc-teams">
                    <div class="lc-team">
                        ${homeBadgeHtml}
                        <div class="lc-team-name">${home.name}</div>
                    </div>
                    <div class="lc-vs-box">
                        <span class="lc-vs">VS</span>
                        <span class="lc-time">${timeStr}</span>
                    </div>
                    <div class="lc-team">
                        ${awayBadgeHtml}
                        <div class="lc-team-name">${away.name}</div>
                    </div>
                </div>
                <div class="lc-footer">${title}</div>
            `;
            
            // Asynchronously resolve and swap missing team logos
            card.querySelectorAll('.lazy-badge').forEach(badgeDiv => {
                const teamName = badgeDiv.dataset.team;
                if (!teamName) return;
                
                const injectLogo = (url) => {
                    const img = document.createElement('img');
                    img.src = url;
                    img.className = 'lc-team-logo';
                    img.alt = teamName;
                    img.loading = 'lazy';
                    img.style.animation = 'fadeIn 0.3s ease';
                    badgeDiv.replaceWith(img);
                };
                
                if (sportsDbCache[teamName]) {
                    if (sportsDbCache[teamName] !== 'NONE') injectLogo(sportsDbCache[teamName]);
                    return;
                }
                
                sportsDbCache[teamName] = 'NONE'; // Prevent duplicate concurrent fetch
                
                const resolveLogo = async () => {
                    let logoUrl = null;
                    
                    try {
                        const r = await fetch(`https://www.thesportsdb.com/api/v1/json/3/searchteams.php?t=${encodeURIComponent(teamName)}`);
                        if (r.ok) {
                            const d = await r.json();
                            if (d && d.teams && d.teams[0] && d.teams[0].strBadge) logoUrl = d.teams[0].strBadge;
                        }
                    } catch(e) {}
                    
                    if (!logoUrl) {
                        try {
                            const wr = await fetch(`https://en.wikipedia.org/w/api.php?action=query&prop=pageimages&titles=${encodeURIComponent(teamName)}&pithumbsize=100&format=json&origin=*`);
                            if (wr.ok) {
                                const wd = await wr.json();
                                const pages = wd.query && wd.query.pages;
                                if (pages) {
                                    const page = Object.values(pages)[0];
                                    if (page && page.thumbnail && page.thumbnail.source) logoUrl = page.thumbnail.source;
                                }
                            }
                        } catch(e) {}
                    }
                    
                    if (logoUrl) {
                        sportsDbCache[teamName] = logoUrl;
                        saveLogoCache();
                        injectLogo(logoUrl);
                    }
                };
                
                resolveLogo();
            });
        } else {
            const parsePoster = (posterUrl) => {
                if (!posterUrl) return '';
                if (posterUrl.startsWith('http')) return `https://wsrv.nl/?url=${encodeURIComponent(posterUrl)}`;
                if (posterUrl.startsWith('/')) return `https://wsrv.nl/?url=${encodeURIComponent('https://streamex.sh' + posterUrl)}`;
                return '';
            };
            const imgUrl = parsePoster(media.poster);
            const imgHtml = imgUrl ? `<img src="${imgUrl}" alt="${title}" onerror="this.outerHTML='<div class=\\'fallback-poster\\'>X</div>'" loading="lazy">` : `<div class="fallback-poster">X</div>`;
            card.innerHTML = `
                <div class="lc-header">
                    <span class="lc-category">${category.replace('-', ' ')}</span>
                    ${isLive ? '<span class="lc-badge-live"><i class="fa-solid fa-circle"></i> LIVE</span>' : ''}
                </div>
                <div class="lc-image-cont">
                    ${imgHtml}
                </div>
                <div class="lc-footer" style="border-top: none;">${title}</div>
            `;
        }
        return card;
    }

    // TMDB Movie/TV Logic
    const title = media.title || media.name;
    const mediaType = type || media.media_type || (media.first_air_date ? 'tv' : 'movie');

    card.onclick = () => openPlayer(media.id, mediaType);

    const imageUrl = media.poster_path ? `${IMAGE_BASE_URL}${media.poster_path}` : 'https://via.placeholder.com/500x750?text=No+Image';
    const year = (media.release_date || media.first_air_date || 'N/A').substring(0, 4);
    const rating = media.vote_average ? media.vote_average.toFixed(1) : 'NR';

    card.innerHTML = `
        <img src="${imageUrl}" alt="${title}" loading="lazy" onerror="this.src='https://via.placeholder.com/500x750?text=No+Image'">
        <div class="play-icon"><i class="fa-solid fa-play"></i></div>
        <div class="card-overlay">
            <h3 class="card-title">${title}</h3>
            <div class="card-info">
                <span>${year}</span>
                <span style="text-transform: uppercase;">${mediaType}</span>
                <span class="rating"><i class="fa-solid fa-star"></i> ${rating}</span>
            </div>
        </div>
    `;
    return card;
}

// Populate Grid
function populateGrid(gridElement, items, type) {
    gridElement.innerHTML = '';
    if (items.length === 0) {
        gridElement.innerHTML = '<p style="color:var(--text-secondary)">No items found.</p>';
        return;
    }
    items.forEach(item => gridElement.appendChild(createMediaCard(item, type)));
}

// Setup Hero Section dynamically
function updateHero(media, type) {
    if (!media) return;
    const mediaType = type || media.media_type || (media.first_air_date ? 'tv' : 'movie');
    heroBg.src = `${IMAGE_HERO_URL}${media.backdrop_path}`;
    heroTitle.textContent = media.title || media.name;
    heroOverview.textContent = media.overview;
    heroBadge.innerHTML = mediaType === 'tv' ? '<i class="fa-solid fa-tv"></i> Trending Series' : '<i class="fa-solid fa-film"></i> Trending Movie';
    heroPlayBtn.onclick = () => openPlayer(media.id, mediaType);
}

// Open Player Modal
function openPlayer(id, mediaType, liveUrl = null) {
    videoContainer.innerHTML = ''; // Clear previous
    
    if (mediaType === 'live' && liveUrl) {
        // StreamEx native streaming
        videoContainer.innerHTML = '<div style="color:white; display:flex; align-items:center; justify-content:center; height:100%; font-family:var(--font-primary);">Loading Stream...</div>';
        modal.classList.add('active');
        document.body.style.overflow = 'hidden'; 
        
        fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent('https://streamex.sh/api/live/stream/' + liveUrl.source + '/' + liveUrl.id)}`)
            .then(res => res.json())
            .then(streams => {
                if (streams && streams.length > 0) {
                    const embedUrl = streams[0].embedUrl;
                    videoContainer.innerHTML = `<iframe src="${embedUrl}" allowfullscreen allow="autoplay; fullscreen"></iframe>`;
                } else {
                    videoContainer.innerHTML = '<div style="color:var(--accent-primary); display:flex; align-items:center; justify-content:center; height:100%; font-family:var(--font-primary);">Stream not available yet.</div>';
                }
            })
            .catch(err => {
                console.error('Stream load error', err);
                videoContainer.innerHTML = '<div style="color:var(--accent-primary); display:flex; align-items:center; justify-content:center; height:100%; font-family:var(--font-primary);">Error loading stream.</div>';
            });
        return; // Modal opened inside promise flow
    } else {
        // Videasy embeds
        let embedUrl = mediaType === 'tv' 
            ? `https://player.videasy.net/tv/${id}/1/1?episodeSelector=true`
            : `https://player.videasy.net/movie/${id}`;
            
        videoContainer.innerHTML = `<iframe src="${embedUrl}" allowfullscreen allow="autoplay; fullscreen"></iframe>`;
    }
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden'; 
}

// Close Modal cleanup
closeModal.addEventListener('click', () => {
    modal.classList.remove('active');
    setTimeout(() => {
        if (window.currentHls) {
            window.currentHls.destroy();
            window.currentHls = null;
        }
        videoContainer.innerHTML = ''; 
    }, 400);
    document.body.style.overflow = 'auto'; 
});

modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal.click();
});

// Search
async function handleSearch() {
    const query = searchInput.value.trim();
    if (!query) {
        searchSection.classList.add('hidden');
        return;
    }
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active')); // Hide active tabs naturally
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active')); // Turn off active buttons
    
    const data = await fetchTMDB(`/search/multi?query=${encodeURIComponent(query)}&page=1`);
    const filteredResults = data.results.filter(item => item.media_type === 'movie' || item.media_type === 'tv');
    
    searchSection.classList.remove('hidden');
    populateGrid(searchGrid, filteredResults);
    searchSection.scrollIntoView({ behavior: 'smooth' });
}

searchBtn.addEventListener('click', handleSearch);
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSearch();
});

/* --- SPA Navigation & Pagination Logic --- */

// Render specific views
async function renderMovies(page) {
    const data = await fetchTMDB(`/discover/movie?sort_by=popularity.desc&page=${page}`);
    populateGrid(document.getElementById('all-movies-grid'), data.results, 'movie');
    document.getElementById('movie-page-indicator').textContent = `Page ${page}`;
    
    // Auto update hero to the most popular item when browsing Movies Tab
    if (page === 1 && data.results.length > 0) updateHero(data.results[0], 'movie');
}

async function renderSeries(page) {
    const data = await fetchTMDB(`/discover/tv?sort_by=popularity.desc&page=${page}`);
    populateGrid(document.getElementById('all-tv-grid'), data.results, 'tv');
    document.getElementById('tv-page-indicator').textContent = `Page ${page}`;
    
    if (page === 1 && data.results.length > 0) updateHero(data.results[0], 'tv');
}

async function fetchStreamExMatches() {
    const fetchApi = async (url) => {
        const r = await fetch(url);
        if (!r.ok) throw new Error('Not OK');
        const text = await r.text();
        const data = JSON.parse(text);
        if (!Array.isArray(data)) throw new Error('Not Array');
        return data;
    };

    try {
        return await Promise.any([
            fetchApi(`https://api.allorigins.win/raw?url=${encodeURIComponent('https://streamex.sh/api/live/matches/all')}`),
            fetchApi(`https://api.codetabs.com/v1/proxy/?quest=https://streamex.sh/api/live/matches/all`)
        ]);
    } catch(e) {
        throw new Error('Invalid data format or proxies blocked');
    }
}

async function renderLive() {
    const container = document.getElementById('live-categories-container');
    if (!container) return;
    container.innerHTML = '<p style="color:var(--text-secondary)">Loading live sports...</p>';
    
    try {
        const data = await fetchStreamExMatches();
        
        if (!Array.isArray(data)) throw new Error('Invalid data format');
        
        container.innerHTML = '';
        
        // Group by category
        const categories = {};
        data.forEach(match => {
            const cat = match.category ? match.category.replace('-', ' ') : 'Other';
            if (!categories[cat]) categories[cat] = [];
            categories[cat].push(match);
        });
        
        // Populate custom select filter and buttons
        const selectTrigger = document.getElementById('cs-trigger');
        const selectDropdown = document.getElementById('cs-dropdown-list');
        const currentValDisplay = document.getElementById('cs-current-val');
        
        if (selectDropdown && selectDropdown.children.length === 0) {
            const allOpt = document.createElement('div');
            allOpt.className = 'cs-option selected';
            allOpt.dataset.value = 'all';
            allOpt.innerHTML = '<i class="fa-solid fa-check"></i> Categories';
            selectDropdown.appendChild(allOpt);
            
            Object.keys(categories).sort().forEach(cat => {
                const opt = document.createElement('div');
                opt.className = 'cs-option';
                opt.dataset.value = cat;
                opt.innerHTML = `<i class="fa-solid fa-check"></i> ${cat}`;
                selectDropdown.appendChild(opt);
            });
            
            selectTrigger.onclick = (e) => {
                e.stopPropagation();
                selectDropdown.classList.toggle('active');
            };
            
            document.addEventListener('click', () => {
                selectDropdown.classList.remove('active');
            });
            
            selectDropdown.querySelectorAll('.cs-option').forEach(opt => {
                opt.onclick = (e) => {
                    e.stopPropagation();
                    selectDropdown.querySelectorAll('.cs-option').forEach(o => o.classList.remove('selected'));
                    opt.classList.add('selected');
                    currentValDisplay.textContent = opt.textContent.trim();
                    currentSportsFilters.category = opt.dataset.value;
                    selectDropdown.classList.remove('active');
                    applyLiveFilters();
                };
            });
            
            // Wire up top buttons
            const btnLive = document.getElementById('filter-live');
            const btnToday = document.getElementById('filter-today');
            const btnAll = document.getElementById('filter-all');
            
            const timeBtns = [btnLive, btnToday, btnAll];
            
            const setTimeFilter = (btn, filterName) => {
                timeBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentSportsFilters.time = filterName;
                applyLiveFilters();
            };
            
            btnLive.onclick = () => setTimeFilter(btnLive, 'live');
            btnToday.onclick = () => setTimeFilter(btnToday, 'today');
            btnAll.onclick = () => setTimeFilter(btnAll, 'all');
        }
        
        // Render each category section
        for (const [categoryName, matches] of Object.entries(categories)) {
            if (matches.length === 0) continue;
            
            const section = document.createElement('div');
            section.className = 'live-category-section';
            section.dataset.category = categoryName;
            section.style.marginBottom = '3rem';
            
            const title = document.createElement('h3');
            title.style.color = '#fff';
            title.style.marginBottom = '1.5rem';
            title.style.textTransform = 'capitalize';
            title.innerHTML = `<i class="fa-solid fa-circle" style="color:var(--accent-primary); font-size:0.6rem; margin-right:8px; position:relative; top:-2px;"></i> ${categoryName}`;
            section.appendChild(title);
            
            const grid = document.createElement('div');
            grid.className = 'movie-grid live-grid';
            
            // Sort matches so popular ones are first
            const sortedMatches = matches.sort((a,b) => (b.popular === true) - (a.popular === true));
            populateGrid(grid, sortedMatches, 'live');
            
            section.appendChild(grid);
            container.appendChild(section);
        }
    } catch (e) {
        console.error('Failed to load Live Sports', e);
        container.innerHTML = '<p style="color:var(--accent-primary)">Failed to load live sports or stream APIs changed.</p>';
    }
}

async function renderHome() {
    const moviesData = await fetchTMDB('/trending/movie/day?page=1');
    const tvData = await fetchTMDB('/trending/tv/day?page=1');
    populateGrid(document.getElementById('home-trending-movies'), moviesData.results.slice(0, 12), 'movie');
    populateGrid(document.getElementById('home-trending-tv'), tvData.results.slice(0, 12), 'tv');
    if (moviesData.results.length > 0) updateHero(moviesData.results[0], 'movie');
}

// Tab Switching Listener
document.querySelectorAll('.tab-btn').forEach(button => {
    button.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Reset Search
        searchInput.value = '';
        searchSection.classList.add('hidden');
        
        // Remove active class
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));
        
        // Set new active
        const targetId = button.getAttribute('data-target');
        button.classList.add('active');
        document.getElementById(targetId).classList.add('active');

        // Load data on demand
        if (targetId === 'movies-view' && document.getElementById('all-movies-grid').innerHTML === '') renderMovies(currentMoviePage);
        if (targetId === 'series-view' && document.getElementById('all-tv-grid').innerHTML === '') renderSeries(currentTvPage);
        if (targetId === 'live-view' && document.getElementById('live-categories-container').innerHTML === '') renderLive();
        if (targetId === 'home-view') renderHome(); // Refresh home logic
    });
});

// Pagination Listeners
document.getElementById('movie-prev').addEventListener('click', () => {
    if (currentMoviePage > 1) {
        currentMoviePage--;
        renderMovies(currentMoviePage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
});
document.getElementById('movie-next').addEventListener('click', () => {
    currentMoviePage++;
    renderMovies(currentMoviePage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

document.getElementById('tv-prev').addEventListener('click', () => {
    if (currentTvPage > 1) {
        currentTvPage--;
        renderSeries(currentTvPage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
});
document.getElementById('tv-next').addEventListener('click', () => {
    currentTvPage++;
    renderSeries(currentTvPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

// App Initiation
document.addEventListener('DOMContentLoaded', () => {
    renderHome(); // Initialize default view
});

// Nav Style on scroll
window.addEventListener('scroll', () => {
    const nav = document.querySelector('.glass-nav');
    if (window.scrollY > 50) {
        nav.style.background = 'rgba(5, 5, 5, 0.9)';
        nav.style.borderBottom = '1px solid rgba(229, 9, 20, 0.3)';
    } else {
        nav.style.background = 'var(--glass-bg)';
        nav.style.borderBottom = '1px solid var(--glass-border)';
    }
});
