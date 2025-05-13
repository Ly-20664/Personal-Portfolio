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
            try {                // Now playing - adapt based on environment
                const isNetlify = window.location.hostname.includes('netlify.app');
                const npEndpoint = isNetlify ? "/.netlify/functions/now-playing" : "/api/now-playing";
                const npResponse = await fetch(npEndpoint);
                if (!npResponse.ok) {
                    throw new Error(`Failed to fetch now playing: ${npResponse.status}`);
                }
                const npData = await npResponse.json();
                setNowPlaying(npData);

                // Top tracks - adapt based on environment
                const ttEndpoint = isNetlify ? "/.netlify/functions/top-tracks" : "/api/top-tracks";
                const ttResponse = await fetch(ttEndpoint);
                if (!ttResponse.ok) {
                    throw new Error(`Failed to fetch top tracks: ${ttResponse.status}`);
                }
                const ttData = await ttResponse.json();
                setTopTracks(ttData);
            } catch (err) {
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
                  // Check if we're on Netlify 
                const isNetlify = window.location.hostname.includes('netlify.app');
                if (isNetlify && (errorMessage.includes('404') || errorMessage.includes('403'))) {
                    setError(`Failed to fetch tracks: ${errorMessage}. Make sure Netlify environment variables are configured correctly. Retry`);
                } else {
                    setError(`Failed to fetch tracks: ${errorMessage} Retry`);
                }
                
                // Auto-retry after 5 seconds if we haven't tried too many times
                // Use more retries on Netlify since it might need time to initialize
                const maxRetries = isNetlify ? 5 : 3;
                if (retryCount < maxRetries) {
                    setTimeout(() => {
                        setRetryCount(prev => prev + 1);
                    }, 5000);
                }}
        };
        
        fetchData();
    }, [retryCount]);
    
    if (error) {
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

ReactDOM.render(<App />, document.getElementById("spotify-embeds"));
