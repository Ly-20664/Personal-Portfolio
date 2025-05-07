import React, { useEffect, useState } from 'react';
import axios from 'axios';
import RecentlyPlayed from './RecentlyPlayed';

const Dashboard = () => {
  const [topTracks, setTopTracks] = useState([]);
  const [topArtists, setTopArtists] = useState([]);
  const [playlists, setPlaylists] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      console.error('No access token found');
      return;
    }

    console.log('Using Access Token:', token); // Debug statement

    axios.get('https://api.spotify.com/v1/me/top/tracks', {
      headers: { Authorization: `Bearer ${token}` },
    }).then(response => {
      console.log('Top Tracks:', response.data); // Debug statement
      setTopTracks(response.data.items);
    }).catch(error => {
      console.error('Error fetching top tracks', error);
    });

    axios.get('https://api.spotify.com/v1/me/top/artists', {
      headers: { Authorization: `Bearer ${token}` },
    }).then(response => {
      console.log('Top Artists:', response.data); // Debug statement
      setTopArtists(response.data.items);
    }).catch(error => {
      console.error('Error fetching top artists', error);
    });

    axios.get('https://api.spotify.com/v1/me/playlists', {
      headers: { Authorization: `Bearer ${token}` },
    }).then(response => {
      console.log('Playlists:', response.data); // Debug statement
      setPlaylists(response.data.items);
    }).catch(error => {
      console.error('Error fetching playlists', error);
    });
  }, []);

  return (
    <div>
        <h1>Dashboard</h1>
        <RecentlyPlayed />
        <div>
            <h2>Top Tracks</h2>
            {topTracks.map(track => (
                <div key={track.id}>{track.name}</div>
            ))}
        </div>
        <div>
            <h2>Top Artists</h2>
            {topArtists.map(artist => (
                <div key={artist.id}>{artist.name}</div>
            ))}
        </div>
        <div>
            <h2>Playlists</h2>
            {playlists.map(playlist => (
                <div key={playlist.id}>{playlist.name}</div>
            ))}
        </div>
    </div>
);

};

export default Dashboard;
