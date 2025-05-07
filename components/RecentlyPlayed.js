import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './RecentlyPlayed.css';

class RecentlyPlayed {
    constructor(tracks) {
        this.tracks = tracks;
        this.container = document.querySelector('.recently-played');
    }

    formatDuration(ms) {
        const minutes = Math.floor(ms / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    render() {
        if (!this.container) return;

        this.container.innerHTML = '';

        this.tracks.forEach(item => {
            const track = item.track;
            const trackCard = document.createElement('div');
            trackCard.className = 'track-card';
            
            trackCard.innerHTML = `
                <img src="${track.album.images[0].url}" alt="${track.name}">
                <div class="track-card-info">
                    <h4>${track.name}</h4>
                    <p>${track.artists.map(artist => artist.name).join(', ')}</p>
                </div>
                <div class="track-actions">
                    <span class="track-duration">${this.formatDuration(track.duration_ms)}</span>
                    <button class="action-button">...</button>
                    <button class="action-button play-button">▶</button>
                </div>
            `;

            this.setupTrackCardEvents(trackCard, track);
            this.container.appendChild(trackCard);
        });
    }

    setupTrackCardEvents(card, track) {
        const playButton = card.querySelector('.play-button');
        
        // Hover effects
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'scale(1.02)';
            card.style.transition = 'transform 0.2s ease';
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = 'scale(1)';
        });

        // Play button click
        playButton.addEventListener('click', () => {
            const event = new CustomEvent('trackSelected', {
                detail: {
                    track: track
                }
            });
            document.dispatchEvent(event);
        });
    }
}

const RecentlyPlayed = () => {
  const [recentTracks, setRecentTracks] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
        console.error('No access token found');
        return;
    }

    axios.get('https://api.spotify.com/v1/me/player/recently-played', {
        headers: { Authorization: `Bearer ${token}` },
    }).then(response => {
        console.log('Recently Played Tracks:', response.data);
        setRecentTracks(response.data.items);
    }).catch(error => {
        console.error('Error fetching recently played tracks', error);
    });
}, []);


  return (
    <div>
      <h2>Recently Played Tracks</h2>
      <div className="recently-played-container">
        {recentTracks.map(item => (
          <div key={item.played_at} className="recently-played-item">
            <img src={item.track.album.images[0].url} alt={item.track.name} style={{ width: 100, height: 100 }} />
            <p>{item.track.name}</p>
            <audio controls src={item.track.preview_url}>
              Your browser does not support the audio element.
            </audio>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentlyPlayed;
