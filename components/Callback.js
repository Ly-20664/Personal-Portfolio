import React, { useEffect } from 'react';
import axios from 'axios';

const Callback = () => {
  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get('code');
    axios.post('https://accounts.spotify.com/api/token', null, {
      params: {
        grant_type: 'authorization_code',
        code,
        redirect_uri: process.env.REACT_APP_REDIRECT_URI,
        client_id: process.env.REACT_APP_SPOTIFY_CLIENT_ID,
        client_secret: process.env.REACT_APP_SPOTIFY_CLIENT_SECRET, // Use environment variable for security
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }).then(response => {
      const { access_token } = response.data;
      localStorage.setItem('access_token', access_token);

      // Fetch recent tracks
      axios.get('https://api.spotify.com/v1/me/player/recently-played', {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }).then(trackResponse => {
        const recentTracks = trackResponse.data.items;
        localStorage.setItem('recent_tracks', JSON.stringify(recentTracks));
        window.location.href = '/dashboard';
      }).catch(trackError => {
        console.error('Error fetching recent tracks', trackError);
      });
    }).catch(error => {
      console.error('Error fetching access token', error);
    });
  }, []);

  return <div>Loading...</div>;
};

export default Callback;
