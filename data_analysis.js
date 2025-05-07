import SpotifyPlayer from './components/SpotifyPlayer';
import './styles.css';

// Initialize Spotify Player with environment variable
const spotifyPlayer = new SpotifyPlayer(process.env.SPOTIFY_CLIENT_ID);

// Listen for track selection events
document.addEventListener('trackSelected', (e) => {
    const track = e.detail.track;
    spotifyPlayer.updateNowPlaying(track, 0);
});

// Spotify recent tracks functionality
async function loadRecentTracks() {
    const spotifyEmbedsContainer = document.getElementById('spotify-embeds');
    
    try {
        const response = await fetch('http://localhost:3000/recent-tracks');
        if (!response.ok) {
            throw new Error('Failed to fetch tracks');
        }

        const tracks = await response.json();
        
        // Clear existing content
        spotifyEmbedsContainer.innerHTML = '';

        // Create card container
        const cardContainer = document.createElement('div');
        cardContainer.className = 'track-card-container';
        
        // Create navigation buttons
        const navigation = document.createElement('div');
        navigation.className = 'track-navigation';
        navigation.innerHTML = `
            <button class="nav-button prev-button"><i class="fas fa-chevron-left"></i></button>
            <button class="nav-button next-button"><i class="fas fa-chevron-right"></i></button>
        `;

        let currentIndex = 1;
        const totalCards = tracks.length;

        function updateCards() {
            const cards = cardContainer.querySelectorAll('.track-card');
            cards.forEach((card, index) => {
                const position = (index - currentIndex + totalCards) % totalCards;
                card.className = 'track-card';
                
                // Enhanced transition handling
                if (position === 0) {
                    card.className = 'track-card active';
                    // Start playing the active track automatically
                    const iframe = card.querySelector('iframe');
                    if (iframe) {
                        const currentSrc = iframe.src;
                        iframe.src = currentSrc + '&autoplay=1';
                    }
                } else if (position === 1) {
                    card.className = 'track-card next';
                } else if (position === -1 || position === totalCards - 1) {
                    card.className = 'track-card previous';
                } else {
                    card.className = 'track-card hidden';
                }
            });

            // Add smooth transition class
            cardContainer.classList.add('transitioning');
            setTimeout(() => {
                cardContainer.classList.remove('transitioning');
            }, 600);
        }

        navigation.querySelector('.prev-button').addEventListener('click', () => {
            currentIndex = (currentIndex - 1 + totalCards) % totalCards;
            updateCards();
        });

        navigation.querySelector('.next-button').addEventListener('click', () => {
            currentIndex = (currentIndex + 1) % totalCards;
            updateCards();
        });

        // Add navigation before card container
        spotifyEmbedsContainer.appendChild(navigation);
        spotifyEmbedsContainer.appendChild(cardContainer);

        // Add tracks
        tracks.forEach((track, index) => {
            const card = document.createElement('div');
            card.className = `track-card ${index === 0 ? 'previous' : index === 1 ? 'active' : index === 2 ? 'next' : 'hidden'}`;
            
            const iframe = document.createElement('iframe');
            iframe.style.borderRadius = '12px';
            iframe.src = `https://open.spotify.com/embed/track/${track.id}?utm_source=generator&theme=0`;
            iframe.width = '100%';
            iframe.height = '100%';
            iframe.frameBorder = '0';
            iframe.allow = 'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture';
            iframe.loading = 'lazy';
            
            card.appendChild(iframe);
            cardContainer.appendChild(card);
        });

    } catch (error) {
        console.error('Error loading recent tracks:', error);
        spotifyEmbedsContainer.innerHTML = '<p class="error-message">Error loading recent tracks. Please try again later.</p>';
    }
}

// Load recent tracks when the page loads and refresh periodically
document.addEventListener('DOMContentLoaded', () => {
    loadRecentTracks();
    // Refresh tracks every 5 minutes
    setInterval(loadRecentTracks, 5 * 60 * 1000);
});

// Function to perform simple linear regression
function predictFutureSales(historicalData) {
    const n = historicalData.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    
    for (let i = 0; i < n; i++) {
        sumX += i;
        sumY += historicalData[i];
        sumXY += i * historicalData[i];
        sumXX += i * i;
    }
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Predict next value
    return slope * n + intercept;
}

// Spotify Player JavaScript
document.addEventListener('DOMContentLoaded', function() {
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const redirectUri = window.location.origin + window.location.pathname;
    let accessToken = null;

    // Check if we're coming back from Spotify auth
    const hash = window.location.hash
        .substring(1)
        .split('&')
        .reduce(function(initial, item) {
            if (item) {
                var parts = item.split('=');
                initial[parts[0]] = decodeURIComponent(parts[1]);
            }
            return initial;
        }, {});

    // Clear the hash
    window.location.hash = '';

    // If there's no token, redirect to Spotify auth
    if (!hash.access_token) {
        const authEndpoint = 'https://accounts.spotify.com/authorize';
        const scopes = [
            'user-read-playback-state',
            'user-read-currently-playing',
            'user-read-recently-played',
            'user-top-read'
        ];

        window.location = `${authEndpoint}?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&scope=${scopes.join('%20')}`;
    } else {
        // We have a token, initialize the player
        accessToken = hash.access_token;
        initializePlayer(accessToken);
    }

    function initializePlayer(token) {
        // Hide error message if it was showing
        document.getElementById('errorMessage').style.display = 'none';

        // Fetch recently played tracks
        fetch('https://api.spotify.com/v1/me/player/recently-played?limit=4', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.items) {
                displayRecentlyPlayed(data.items);
            }
        })
        .catch(error => {
            console.error('Error fetching recently played:', error);
            document.getElementById('errorMessage').style.display = 'block';
        });

        // Fetch currently playing track
        fetch('https://api.spotify.com/v1/me/player/currently-playing', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data && data.item) {
                displayNowPlaying(data.item, data.progress_ms);
            }
        })
        .catch(error => {
            console.error('Error fetching current track:', error);
        });
    }

    function displayRecentlyPlayed(items) {
        const container = document.querySelector('.recently-played');
        container.innerHTML = '';

        items.forEach(item => {
            const track = item.track;
            const html = `
                <div class="track-card">
                    <img src="${track.album.images[0].url}" alt="${track.name}">
                    <div class="track-card-info">
                        <h4>${track.name}</h4>
                        <p>${track.artists.map(artist => artist.name).join(', ')}</p>
                    </div>
                    <div class="track-actions">
                        <span class="track-duration">${formatDuration(track.duration_ms)}</span>
                        <button class="action-button">...</button>
                        <button class="action-button play-button">▶</button>
                    </div>
                </div>
            `;
            container.insertAdjacentHTML('beforeend', html);
        });

        // Add click handlers for play buttons
        document.querySelectorAll('.play-button').forEach(button => {
            button.addEventListener('click', function() {
                const card = this.closest('.track-card');
                const name = card.querySelector('h4').textContent;
                const artist = card.querySelector('p').textContent;
                const img = card.querySelector('img').src;
                updateNowPlaying(img, name, artist);
            });
        });
    }

    function displayNowPlaying(track, progress) {
        const container = document.querySelector('.now-playing-card');
        container.innerHTML = `
            <img src="${track.album.images[0].url}" alt="${track.name}">
            <div class="track-info">
                <h3>${track.name}</h3>
                <p>${track.artists.map(artist => artist.name).join(', ')}</p>
                <div class="track-progress">
                    <div class="progress-bar" style="width: ${(progress / track.duration_ms) * 100}%"></div>
                </div>
                <div class="track-controls">
                    <span>${formatDuration(track.duration_ms)}</span>
                    <button class="action-button">
                        <img src="https://open.spotifycdn.com/cdn/images/spotify_logo_white.png" alt="Spotify" class="spotify-icon">
                    </button>
                </div>
            </div>
        `;
    }

    function formatDuration(ms) {
        const minutes = Math.floor(ms / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    // Handle tab switching
    const tabs = document.querySelectorAll('.tab-button');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
        });
    });

    function updateNowPlaying(imgSrc, trackName, artistName) {
        const nowPlaying = document.querySelector('.now-playing-card');
        nowPlaying.querySelector('img').src = imgSrc;
        nowPlaying.querySelector('h3').textContent = trackName;
        nowPlaying.querySelector('p').textContent = artistName;
        
        // Reset and animate progress bar
        const progressBar = nowPlaying.querySelector('.progress-bar');
        progressBar.style.width = '0%';
        
        let progress = 0;
        const interval = setInterval(() => {
            progress += 0.1;
            progressBar.style.width = `${progress}%`;
            if (progress >= 100) {
                clearInterval(interval);
            }
        }, 100);
    }

    // Add hover effects for track cards
    document.addEventListener('mouseover', function(e) {
        if (e.target.closest('.track-card')) {
            const card = e.target.closest('.track-card');
            card.style.transform = 'scale(1.02)';
            card.style.transition = 'transform 0.2s ease';
        }
    });

    document.addEventListener('mouseout', function(e) {
        if (e.target.closest('.track-card')) {
            const card = e.target.closest('.track-card');
            card.style.transform = 'scale(1)';
        }
    });
});