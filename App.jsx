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
                // Enhanced debugging - log the current hostname 
                const hostname = window.location.hostname;
                console.log(`Current hostname: ${hostname}`);
                
                // Now playing - adapt based on environment with enhanced error handling
                const isNetlify = hostname.includes('netlify.app');
                console.log(`Running in Netlify environment: ${isNetlify}`);
                
                const npEndpoint = isNetlify ? "/.netlify/functions/now-playing" : "/api/now-playing";
                console.log(`Using now-playing endpoint: ${npEndpoint}`);
                
                const npResponse = await fetch(npEndpoint);
                console.log(`Now playing response status: ${npResponse.status}`);
                
                if (!npResponse.ok) {
                    // Get the text response for better error diagnosis
                    const errorText = await npResponse.text();
                    console.error(`Error response from now-playing: ${errorText}`);
                    throw new Error(`Failed to fetch now playing: ${npResponse.status} - ${errorText.substring(0, 100)}...`);
                }
                
                // Try to parse the JSON with better error handling
                let npData;
                try {
                    npData = await npResponse.json();
                } catch (jsonError) {
                    console.error("Failed to parse JSON from now-playing:", jsonError);
                    throw new Error(`Invalid JSON from now-playing: ${jsonError.message}`);
                }
                
                setNowPlaying(npData);

                // Top tracks - adapt based on environment with enhanced error handling
                const ttEndpoint = isNetlify ? "/.netlify/functions/top-tracks" : "/api/top-tracks";
                console.log(`Using top-tracks endpoint: ${ttEndpoint}`);
                
                const ttResponse = await fetch(ttEndpoint);
                console.log(`Top tracks response status: ${ttResponse.status}`);
                
                if (!ttResponse.ok) {
                    // Get the text response for better error diagnosis
                    const errorText = await ttResponse.text();
                    console.error(`Error response from top-tracks: ${errorText}`);
                    throw new Error(`Failed to fetch top tracks: ${ttResponse.status} - ${errorText.substring(0, 100)}...`);
                }
                
                // Try to parse the JSON with better error handling
                let ttData;
                try {
                    ttData = await ttResponse.json();
                } catch (jsonError) {
                    console.error("Failed to parse JSON from top-tracks:", jsonError);
                    throw new Error(`Invalid JSON from top-tracks: ${jsonError.message}`);
                }
                
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
                    // If parsing fails, use the original error message                }
                
                // Check if we're on Netlify with enhanced error detection
                const isNetlify = window.location.hostname.includes('netlify.app');
                console.log(`Error detected, running in Netlify: ${isNetlify}, Current retry: ${retryCount}`);
                
                // Better error message based on error content
                if (isNetlify) {
                    if (errorMessage.includes('Invalid JSON') || errorMessage.includes('Unexpected token')) {
                        setError(`Error parsing Spotify data: The API might be returning HTML instead of JSON. This typically happens when Netlify functions are not properly configured. Check environment variables and function permissions. Retry`);
                    } else if (errorMessage.includes('404') || errorMessage.includes('403')) {
                        setError(`Failed to fetch tracks: ${errorMessage}. Make sure Netlify environment variables are configured correctly. Retry`);
                    } else if (errorMessage.includes('500')) {
                        setError(`Server error: ${errorMessage}. The Netlify function might be encountering an internal error. Check function logs. Retry`);
                    } else {
                        setError(`Failed to fetch tracks in Netlify environment: ${errorMessage}. Retry`);
                    }
                } else {
                    setError(`Failed to fetch tracks: ${errorMessage}. Retry`);
                }
                
                // Auto-retry after 5 seconds if we haven't tried too many times
                // Use more retries on Netlify since it might need time to initialize
                const maxRetries = isNetlify ? 7 : 3;  // Increased for Netlify
                const retryDelay = isNetlify ? 7000 : 5000;  // Longer delay for Netlify
                
                if (retryCount < maxRetries) {
                    console.log(`Scheduling retry ${retryCount + 1}/${maxRetries} in ${retryDelay}ms`);
                    setTimeout(() => {
                        setRetryCount(prev => prev + 1);
                    }, retryDelay);
                } else {
                    console.log('Maximum retries reached, giving up');
                }
            }
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
