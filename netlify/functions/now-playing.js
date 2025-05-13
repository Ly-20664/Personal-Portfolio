// Netlify function for fetching currently playing track
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
    
    // Fetch currently playing track
    const response = await axios({
      method: 'get',
      url: 'https://api.spotify.com/v1/me/player/currently-playing',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    // If no track is currently playing, return null
    if (response.status === 204) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(null)
      };
    }
    
    // Format the response to match the expected structure
    const track = response.data.item;
    const formattedResponse = {
      id: track.id,
      name: track.name,
      artist: track.artists.map(artist => artist.name).join(', '),
      album: track.album.name,
      albumArt: track.album.images[0].url,
      url: track.external_urls.spotify,
      isPlaying: response.data.is_playing
    };
      return {
      statusCode: 200,
      headers,
      body: JSON.stringify(formattedResponse)
    };
  } catch (error) {
    console.error('Error fetching now playing:', error);
    
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
    
    // For network errors or other cases, still return 200 to avoid breaking the UI
    return {
      statusCode: 200,  
      headers,
      body: JSON.stringify(null)
    };
  }
};
