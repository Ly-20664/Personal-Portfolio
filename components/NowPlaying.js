class NowPlaying {
    constructor(track, progress) {
        this.track = track;
        this.progress = progress;
        this.container = document.querySelector('.now-playing-card');
    }

    formatDuration(ms) {
        const minutes = Math.floor(ms / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    render() {
        if (!this.container) return;

        this.container.innerHTML = `
            <img src="${this.track.album.images[0].url}" alt="${this.track.name}">
            <div class="track-info">
                <h3>${this.track.name}</h3>
                <p>${this.track.artists.map(artist => artist.name).join(', ')}</p>
                <div class="track-progress">
                    <div class="progress-bar" style="width: ${(this.progress / this.track.duration_ms) * 100}%"></div>
                </div>
                <div class="track-controls">
                    <span>${this.formatDuration(this.track.duration_ms)}</span>
                    <button class="action-button">
                        <img src="https://open.spotifycdn.com/cdn/images/spotify_logo_white.png" alt="Spotify" class="spotify-icon">
                    </button>
                </div>
            </div>
        `;

        this.setupProgressBar();
    }

    setupProgressBar() {
        const progressBar = this.container.querySelector('.progress-bar');
        let currentProgress = (this.progress / this.track.duration_ms) * 100;

        // Update progress bar every second
        this.progressInterval = setInterval(() => {
            currentProgress += (100 / (this.track.duration_ms / 1000));
            if (currentProgress >= 100) {
                clearInterval(this.progressInterval);
                currentProgress = 100;
            }
            progressBar.style.width = `${currentProgress}%`;
        }, 1000);
    }

    destroy() {
        if (this.progressInterval) {
            clearInterval(this.progressInterval);
        }
    }
}

export default NowPlaying; 