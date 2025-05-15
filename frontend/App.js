import React, { useEffect, useState } from 'react';
import './styles/App.css';

function App() {
    const [tracks, setTracks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentIndex, setCurrentIndex] = useState(1);
    const [isPlaying, setIsPlaying] = useState(false);
    const [activeTrackId, setActiveTrackId] = useState(null);
    const [transitioning, setTransitioning] = useState(false);

    useEffect(() => {
        fetchTracks();
        // Set up periodic refresh
        const refreshInterval = setInterval(fetchTracks, 5 * 60 * 1000); // Refresh every 5 minutes
        
        return () => {
            clearInterval(refreshInterval);
            // Cleanup iframes
            const iframes = document.querySelectorAll('.track-card iframe');
            iframes.forEach(iframe => {
                iframe.src = 'about:blank';
            });
        };
    }, []);    async function fetchTracks() {
        try {
            setLoading(true);
            const response = await fetch('/.netlify/functions/recent-tracks');
            if (!response.ok) {
                // Improved error handling - get the raw text to see HTML errors
                const text = await response.text();
                console.error('Function returned non-200:', response.status, text);
                throw new Error(`Fetch failed: ${response.status}`);
            }
            const data = await response.json();
            
            if (data.items && data.items.length > 0) {
                setTracks(data.items);
                // Reset current index when new tracks arrive
                setCurrentIndex(1);
            } else {
                throw new Error('No tracks found');
            }
        } catch (err) {
            console.error('Error:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    const handlePrevious = () => {
        if (transitioning) return;
        setTransitioning(true);
        setCurrentIndex((prevIndex) => {
            const newIndex = prevIndex === 0 ? tracks.length - 1 : prevIndex - 1;
            // Pause current track when switching
            setIsPlaying(false);
            setActiveTrackId(null);
            return newIndex;
        });
        setTimeout(() => setTransitioning(false), 600);
    };

    const handleNext = () => {
        if (transitioning) return;
        setTransitioning(true);
        setCurrentIndex((prevIndex) => {
            const newIndex = prevIndex === tracks.length - 1 ? 0 : prevIndex + 1;
            // Pause current track when switching
            setIsPlaying(false);
            setActiveTrackId(null);
            return newIndex;
        });
        setTimeout(() => setTransitioning(false), 600);
    };

    const handleTrackClick = (track) => {
        if (transitioning) return;
        setTransitioning(true);
        
        if (track.id === activeTrackId) {
            setIsPlaying(!isPlaying);
        } else {
            setIsPlaying(false);
            setTimeout(() => {
                setActiveTrackId(track.id);
                setIsPlaying(true);
            }, 100);
        }
        
        setTimeout(() => setTransitioning(false), 600);
    };

    if (loading) {
        return (
            <div className="main-container">
                <div className="content-grid">
                    <div className="left-content">
                        <h1>Hi, I'm Justin Ly</h1>
                        <p>Software Engineer | Full Stack Developer | Problem Solver</p>
                    </div>
                    <div className="spotify-section">
                        <div className="spotify-embeds">
                            <h2>My Recent Tracks</h2>
                            <div className="loading-message">Loading your recent tracks...</div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="main-container">
                <div className="content-grid">
                    <div className="left-content">
                        <h1>Hi, I'm Justin Ly</h1>
                        <p>Software Engineer | Full Stack Developer | Problem Solver</p>
                    </div>
                    <div className="spotify-section">
                        <div className="spotify-embeds">
                            <h2>My Recent Tracks</h2>
                            <div className="error-message">
                                {error}
                                <button 
                                    onClick={fetchTracks}
                                    className="retry-button"
                                >
                                    Retry
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="main-container">
            <div className="content-grid">
                <div className="left-content">
                    <h1>Hi, I'm Justin Ly</h1>
                    <p>Software Engineer | Full Stack Developer | Problem Solver</p>
                </div>
                <div className="spotify-section">
                    <div className="spotify-embeds">
                        <h2>My Recent Tracks</h2>
                        <div className="track-card-container">
                            <div className="track-navigation">
                                <button 
                                    className="nav-button prev-button" 
                                    onClick={handlePrevious}
                                    disabled={transitioning}
                                >
                                    ←
                                </button>
                                <button 
                                    className="nav-button next-button" 
                                    onClick={handleNext}
                                    disabled={transitioning}
                                >
                                    →
                                </button>
                            </div>
                            {tracks.map((item, index) => {
                                const track = item.track;
                                const position = (index - currentIndex + tracks.length) % tracks.length;
                                const isActive = position === 0;
                                
                                if (!track) return null;
                                
                                return (
                                    <div 
                                        key={track.id || index} 
                                        className={`track-card ${
                                            isActive ? 'active' : 
                                            position === 1 ? 'next' : 
                                            position === tracks.length - 1 ? 'previous' : 'hidden'
                                        }`}
                                        onClick={() => isActive && !transitioning && handleTrackClick(track)}
                                    >
                                        <iframe
                                            src={`https://open.spotify.com/embed/track/${track.id}?theme=0&backgroundColor=transparent&autoplay=${isActive && isPlaying ? '1' : '0'}`}
                                            width="100%"
                                            height="100%"
                                            frameBorder="0"
                                            allow="encrypted-media; autoplay"
                                            loading="lazy"
                                            style={{ backgroundColor: 'transparent' }}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default App;
