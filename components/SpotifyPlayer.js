class SpotifyPlayer {
    constructor(clientId) {
        this.clientId = clientId;
        this.accessToken = null;
        this.init();
    }

    init() {
        document.addEventListener('DOMContentLoaded', () => {
            this.handleAuth();
            this.setupEventListeners();
        });
    }

    handleAuth() {
        const hash = window.location.hash
            .substring(1)
            .split('&')
            .reduce((initial, item) => {
                if (item) {
                    const parts = item.split('=');
                    initial[parts[0]] = decodeURIComponent(parts[1]);
                }
                return initial;
            }, {});

        window.location.hash = '';
        
        if (!hash.access_token) {
            this.redirectToSpotifyAuth();
        } else {
            this.accessToken = hash.access_token;
            this.initializePlayer();
        }
    }

    redirectToSpotifyAuth() {
        const authEndpoint = 'https://accounts.spotify.com/authorize';
        const redirectUri = window.location.origin + window.location.pathname;
        const scopes = [
            'user-read-playback-state',
            'user-read-currently-playing',
            'user-read-recently-played',
            'user-top-read'
        ];

        window.location = `${authEndpoint}?client_id=${this.clientId}&redirect_uri=${redirectUri}&scope=${scopes.join('%20')}&response_type=token&show_dialog=true`;
    }

    async initializePlayer() {
        try {
            await this.fetchCurrentlyPlaying();
            await this.fetchRecentlyPlayed();
        } catch (error) {
            console.error('Error initializing player:', error);
            document.getElementById('errorMessage').style.display = 'block';
        }
    }

    async fetchCurrentlyPlaying() {
        const response = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
            headers: { 'Authorization': `Bearer ${this.accessToken}` }
        });
        
        if (response.status === 200) {
            const data = await response.json();
            if (data && data.item) {
                this.updateNowPlaying(data.item, data.progress_ms);
            }
        }
    }

    async fetchRecentlyPlayed() {
        const response = await fetch('https://api.spotify.com/v1/me/player/recently-played?limit=4', {
            headers: { 'Authorization': `Bearer ${this.accessToken}` }
        });

        if (response.status === 200) {
            const data = await response.json();
            if (data.items) {
                this.updateRecentlyPlayed(data.items);
            }
        }
    }

    updateNowPlaying(track, progress) {
        const nowPlayingComponent = new NowPlaying(track, progress);
        nowPlayingComponent.render();
    }

    updateRecentlyPlayed(tracks) {
        const recentlyPlayedComponent = new RecentlyPlayed(tracks);
        recentlyPlayedComponent.render();
    }

    setupEventListeners() {
        // Tab switching
        const tabs = document.querySelectorAll('.tab-button');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
            });
        });
    }
}

// Export the class
export default SpotifyPlayer; 