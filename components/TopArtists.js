import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './styles.css';

const TopArtists = () => {
  const [topArtists, setTopArtists] = useState([]);
  const [loading, setLoading] = useState(true); // Add loading state

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      console.error('No access token found');
      return;
    }

    axios.get('https://api.spotify.com/v1/me/top/artists', {
      headers: { Authorization: `Bearer ${token}` },
    }).then(response => {
      console.log('Top Artists:', response.data);
      setTopArtists(response.data.items);
      setLoading(false); // Set loading to false once data is fetched
    }).catch(error => {
      console.error('Error fetching top artists', error);
      setLoading(false); // Set loading to false even if there's an error
    });
  }, []);

  return (
    <div className={loading ? 'hidden' : 'visible'}> {/* Apply hidden class if loading */}
      <h2>Top Artists</h2>
      <div className="container">
        {topArtists.map(artist => (
          <div key={artist.id} className="item">
            <img src={artist.images[0]?.url} alt={artist.name} />
            <p>{artist.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TopArtists;
