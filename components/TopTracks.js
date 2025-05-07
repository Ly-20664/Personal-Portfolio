import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './styles.css';

const TopTracks = () => {
  const [topTracks, setTopTracks] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      console.error('No access token found');
      return;
    }

    axios.get('https://api.spotify.com/v1/me/top/tracks', {
      headers: { Authorization: `Bearer ${token}` },
    }).then(response => {
      console.log('Top Tracks:', response.data);
      setTopTracks(response.data.items);
    }).catch(error => {
      console.error('Error fetching top tracks', error);
    });
  }, []);

  return (
    <div>
      <h2>Top Tracks</h2>
      <div className="container">
        {topTracks.map(track => (
          <div key={track.id} className="item">
            <img src={track.album.images[0].url} alt={track.name} />
            <p>{track.name}</p>
            <audio controls src={track.preview_url}>
              Your browser does not support the audio element.
            </audio>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TopTracks;
