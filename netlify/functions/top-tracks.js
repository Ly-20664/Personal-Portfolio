// Netlify function for fetching top tracks
const axios = require('axios');
require('dotenv').config();

// Spotify API credentials
const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const REFRESH_TOKEN = process.env.SPOTIFY_REFRESH_TOKEN;

// Get a new access token using the refresh token
async function getAccessToken() {
  try {
    const response = await axios({
      method: 'post',
      url: 'https://accounts.spotify.com/api/token',
      params: {
        grant_type: 'refresh_token',
        refresh_token: REFRESH_TOKEN,
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')}`
      }
    });
    
    return response.data.access_token;
  } catch (error) {
    console.error('Error getting access token:', error);
    throw new Error('Failed to get access token');
  }
}

exports.handler = async function(event, context) {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };
  
  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }
  
  try {
    // Get access token
    const accessToken = await getAccessToken();
    
    // Fetch top tracks
    const response = await axios({
      method: 'get',
      url: 'https://api.spotify.com/v1/me/top/tracks',
      params: {
        time_range: 'short_term',  // last 4 weeks
        limit: 5                   // top 5 tracks
      },
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    // Format the response to match the expected structure
    const formattedTracks = response.data.items.map(track => ({
      songID: track.id,
      artist: track.artists[0].name,
      title: track.name,
      album: track.album.name,
      albumArt: track.album.images[0].url,
      uri: track.uri
    }));
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(formattedTracks)
    };  } catch (error) {
    console.error('Error fetching top tracks:', error);
    
    // If the error is related to authorization, return an appropriate error status
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      return {
        statusCode: error.response.status,
        headers,
        body: JSON.stringify({ error: 'Authorization failed, check your Spotify tokens' })
      };
    }
    
    // For other API errors
    if (error.response) {
      return {
        statusCode: error.response.status,
        headers,
        body: JSON.stringify({ error: `Spotify API error: ${error.response.statusText}` })
      };
    }
    
    // For network errors or other cases
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to fetch top tracks' })
    };
  }
};
