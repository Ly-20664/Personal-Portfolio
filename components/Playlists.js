import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './styles.css';

const Playlists = () => {
  const [playlists, setPlaylists] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      console.error('No access token found');
      return;
    }

    axios.get('https://api.spotify.com/v1/me/playlists', {
      headers: { Authorization: `Bearer ${token}` },
    }).then(response => {
      console.log('Playlists:', response.data);
      setPlaylists(response.data.items);
    }).catch(error => {
      console.error('Error fetching playlists', error);
    });
  }, []);

  return (
    <div>
      <h2>Playlists</h2>
      <div className="container">
        {playlists.map(playlist => (
          <div key={playlist.id} className="item">
            <img src={playlist.images[0].url} alt={playlist.name} />
            <p>{playlist.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Playlists;
