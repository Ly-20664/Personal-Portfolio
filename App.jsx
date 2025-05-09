import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import SpotifyDisplay from "./SpotifyDisplay";

const App = () => {
    const [nowPlaying, setNowPlaying] = useState(null);
    const [topTracks, setTopTracks] = useState([]);
    const [error, setError] = useState(null);
    const [retryCount, setRetryCount] = useState(0);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Now playing
                const npResponse = await fetch("/api/now-playing");
                if (!npResponse.ok) {
                    throw new Error(`Failed to fetch now playing: ${npResponse.status}`);
                }
                const npData = await npResponse.json();
                setNowPlaying(npData);

                // Top tracks
                const ttResponse = await fetch("/api/top-tracks");
                if (!ttResponse.ok) {
                    throw new Error(`Failed to fetch top tracks: ${ttResponse.status}`);
                }
                const ttData = await ttResponse.json();
                setTopTracks(ttData);            } catch (err) {
                console.error("Error fetching Spotify data:", err);
                
                // Try to parse if there's a more specific error message from the API
                let errorMessage = err.message;
                try {
                    if (err.response && err.response.data && err.response.data.error) {
                        errorMessage = err.response.data.error;
                    }
                } catch (parseError) {
                    // If parsing fails, use the original error message
                }
                
                setError(`Failed to fetch tracks: ${errorMessage} Retry`);
                
                // Auto-retry after 5 seconds if we haven't tried too many times
                if (retryCount < 3) {
                    setTimeout(() => {
                        setRetryCount(prev => prev + 1);
                    }, 5000);
                }
            }
        };

        fetchData();
    }, [retryCount]);    if (error) {
        return (
            <div className="error-message">
                Error: {error.replace(" Retry", "")}
                <button 
                    className="retry-button" 
                    onClick={() => setRetryCount(prev => prev + 1)}
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div>
            <SpotifyDisplay
                nowPlaying={nowPlaying}
                topTracks={topTracks}
            />
        </div>
    );
};

ReactDOM.render(<App />, document.getElementById("spotify-root"));
