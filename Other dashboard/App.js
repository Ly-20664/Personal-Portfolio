import React, { useState, useEffect } from 'react';
import './App.css'; // General app styles
import './Sidebar.css'; // Sidebar styles
import './RecentlyPlayed.css'; // Recently played styles
import './TopTracks.css'; // Top tracks styles
import RecentlyPlayed from './RecentlyPlayed';
import TopTracks from './TopTracks';
import Callback from './Callback';
import { getAuthorizationUrl } from './spotifyAuth';

function App() {
  const [token, setToken] = useState(null);

  useEffect(() => {
    const storedToken = localStorage.getItem('spotify_access_token');
    if (storedToken) {
      setToken(storedToken);
    } else {
      getAuthorizationUrl();
    }
  }, []);

  return (
    <div className="app-container"> {/* This container will use flexbox to layout children */}
      <div className="sidebar">
        <h1>Justin Ly</h1>
        <p>Aspiring Developer</p>
        <ul>
          <li><a href="#Home">Home</a></li>
          <li><a href="#About">About</a></li>
          <li><a href="#Experience">Experience</a></li>
          <li><a href="#Projects">Projects</a></li>
          <li><a href="#Gallery">Gallery</a></li>
        </ul>
      </div>
      {window.location.pathname === '/callback' ? (
        <Callback setToken={setToken} />
      ) : (
        <div className="main-content">
          <div className="section recently-played-section">
            <RecentlyPlayed token={token} />
          </div>
          <div className="section top-tracks-section">
            <TopTracks token={token} />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
