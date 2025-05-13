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
                
                setNowPlaying(npData);                // Recent tracks - adapt based on environment with enhanced error handling
                const ttEndpoint = isNetlify ? "/.netlify/functions/recent-tracks" : "/api/recent-tracks";
                console.log(`Using recent-tracks endpoint: ${ttEndpoint}`);
                
                const ttResponse = await fetch(ttEndpoint);
                console.log(`Recent tracks response status: ${ttResponse.status}`);
                
                if (!ttResponse.ok) {                    // Get the text response for better error diagnosis
                    const errorText = await ttResponse.text();
                    console.error(`Error response from recent-tracks: ${errorText}`);
                    throw new Error(`Failed to fetch recent tracks: ${ttResponse.status} - ${errorText.substring(0, 100)}...`);}
                  // Try to parse the JSON with better error handling
                let ttData;                try {
                    // Check if response text starts with '<', indicating HTML
                    const responseText = await ttResponse.text();
                    
                    if (responseText.trim().startsWith('<')) {
                        console.error("Received HTML instead of JSON from recent-tracks endpoint");
                        console.error("First 100 chars:", responseText.substring(0, 100));
                        
                        // Instead of throwing, we can set an empty array to avoid breaking the UI
                        console.log("Setting empty array for recent tracks to prevent UI error");
                        setTopTracks([]);
                        
                        // Still throw for the error message display
                        throw new Error(`Received HTML instead of JSON from recent-tracks endpoint. This is likely due to missing or invalid environment variables (SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_REFRESH_TOKEN) on Netlify.`);
                    }
                    
                    // Regular JSON parsing if we don't have HTML
                    const ttData = JSON.parse(responseText);
                    console.log("Recent tracks data received:", JSON.stringify(ttData).substring(0, 100) + "...");
                    
                    // Validate the data before setting state
                    if (Array.isArray(ttData)) {
                        console.log(`Received ${ttData.length} recent tracks`);
                        setTopTracks(ttData);
                    } else {
                        console.error("Recent tracks data is not an array:", ttData);
                        
                        // Set empty array instead of throwing
                        setTopTracks([]);
                        throw new Error("Invalid data format from recent-tracks endpoint");
                    }
                } catch (jsonError) {
                    console.error("Failed to parse data from recent-tracks:", jsonError);
                    
                    // Always set empty array to avoid UI breaking
                    setTopTracks([]);
                    
                    // Specific handling for the Unexpected token '<' error (HTML response)
                    if (jsonError.message && jsonError.message.includes("Unexpected token '<'")) {
                        throw new Error(`Invalid JSON from recent-tracks: Received HTML instead of JSON - likely missing or invalid environment variables (SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_REFRESH_TOKEN) on Netlify.`);
                    } else {
                        throw new Error(`Invalid JSON from recent-tracks: ${jsonError.message}`);
                    }
                }
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
                
                // Check if we're on Netlify with enhanced error detection
                const isNetlify = window.location.hostname.includes('netlify.app');
                console.log(`Error detected, running in Netlify: ${isNetlify}, Current retry: ${retryCount}`);
                
                // Better error message based on error content
                if (isNetlify) {
                    if (errorMessage.includes('Invalid JSON') || errorMessage.includes('Unexpected token')) {
                        console.error('JSON parsing error details:', errorMessage);
                        setError(`Error parsing Spotify data: The API returned HTML instead of JSON. This typically happens when environment variables are missing or invalid on Netlify. Check your SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, and SPOTIFY_REFRESH_TOKEN settings. Retry`);
                    } else if (errorMessage.includes('404') || errorMessage.includes('403')) {
                        setError(`Failed to fetch tracks: ${errorMessage}. Make sure Netlify environment variables are configured correctly. Retry`);
                    } else if (errorMessage.includes('500')) {
                        setError(`Server error: ${errorMessage}. The Netlify function might be encountering an internal error. Check function logs. Retry`);
                    } else {
                        setError(`Failed to fetch tracks in Netlify environment: ${errorMessage}. Check Netlify function logs for more details. Retry`);
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
            />            <div className="spotify-test-section" style={{ marginTop: '20px', textAlign: 'center' }}>
                <p style={{ fontSize: '14px', color: '#777' }}>
                    Experiencing issues?
                    <a 
                        href="/.netlify/functions/spotify-test" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        style={{ marginLeft: '8px', color: '#1DB954', textDecoration: 'underline' }}
                    >
                        Test Spotify API Connection
                    </a>
                    <span style={{ margin: '0 8px' }}>|</span>
                    <a 
                        href="/recent-tracks-test.html" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        style={{ color: '#1DB954', textDecoration: 'underline' }}
                    >
                        Test Recent Tracks API
                    </a>
                </p>
            </div>
        </div>
    );
};

ReactDOM.render(<App />, document.getElementById("spotify-embeds"));
