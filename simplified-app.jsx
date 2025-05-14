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
                // Simplified implementation
                console.log("Fetching data");
                
                // Set empty data for testing
                setNowPlaying({ id: "test" });
                setTopTracks([]);
            } catch (err) {
                console.error("Error:", err);
                
                const isNetlify = false;
                const errorMessage = err.message;
                
                // Better error message based on error content
                if (isNetlify) {
                    if (errorMessage.includes('Invalid JSON')) {
                        setError("Error parsing data");
                    } else {
                        setError("Other error");
                    }
                } else {
                    setError("Local error");
                }
                
                // Retry logic
                const maxRetries = 3;
                const retryDelay = 5000;
                
                if (retryCount < maxRetries) {
                    setTimeout(() => {
                        setRetryCount(prev => prev + 1);
                    }, retryDelay);
                }
            }
        };
        
        fetchData();
    }, [retryCount]);
    
    if (error) {
        return <div>Error: {error}</div>;
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

export default App;
