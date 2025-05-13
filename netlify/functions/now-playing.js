// Netlify function for fetching currently playing track
const axios = require('axios');
require('dotenv').config();

// Spotify API credentials - with validation
const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const REFRESH_TOKEN = process.env.SPOTIFY_REFRESH_TOKEN;

// Validate environment variables
if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
  console.error('Missing required environment variables:',
    !CLIENT_ID ? 'SPOTIFY_CLIENT_ID' : '',
    !CLIENT_SECRET ? 'SPOTIFY_CLIENT_SECRET' : '',
    !REFRESH_TOKEN ? 'SPOTIFY_REFRESH_TOKEN' : ''
  );
}

// Get a new access token using the refresh token
async function getAccessToken() {
  try {
    // Validate credentials before making the request
    if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
      const missing = [];
      if (!CLIENT_ID) missing.push('CLIENT_ID');
      if (!CLIENT_SECRET) missing.push('CLIENT_SECRET');
      if (!REFRESH_TOKEN) missing.push('REFRESH_TOKEN');
      
      throw new Error(`Missing required Spotify credentials: ${missing.join(', ')}`);
    }
    
    console.log('Attempting to get Spotify access token');
    
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
    
    if (!response.data || !response.data.access_token) {
      console.error('Spotify token response missing access_token:', JSON.stringify(response.data));
      throw new Error('Invalid response from Spotify token API');
    }
    
    console.log('Successfully obtained Spotify access token');
    return response.data.access_token;
  } catch (error) {
    console.error('Error getting access token:', error.message);
    
    if (error.response) {
      console.error('Spotify API error details:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      });
    }
    
    throw new Error(`Failed to get access token: ${error.message}`);
  }
}

exports.handler = async function(event, context) {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };
  
  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }
  
  // Early validation of environment variables
  if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
    console.error('Missing required environment variables in handler');
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Server configuration error: Missing Spotify credentials',
        missingVars: {
          clientId: !CLIENT_ID,
          clientSecret: !CLIENT_SECRET,
          refreshToken: !REFRESH_TOKEN
        }
      })
    };
  }
  
  try {
    console.log('Handler started, attempting to get access token');
    // Get access token
    const accessToken = await getAccessToken();
    console.log('Access token retrieved successfully');
    
    // Fetch currently playing track
    console.log('Fetching currently playing track from Spotify API');
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
    };  } catch (error) {
    console.error('Error fetching now playing:', error);
    
    // If the error is related to authorization, return an appropriate error status
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      return {
        statusCode: error.response.status,
        headers,
        body: JSON.stringify({ 
          error: 'Authorization failed, check your Spotify tokens',
          details: error.message 
        })
      };
    }
    
    // For other API errors
    if (error.response) {
      return {
        statusCode: error.response.status,
        headers,
        body: JSON.stringify({ 
          error: `Spotify API error: ${error.response.statusText}`,
          details: error.message,
          data: error.response.data
        })
      };
    }
    
    // Handle getAccessToken specific errors
    if (error.message === 'Failed to get access token') {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'Failed to get Spotify access token',
          details: 'Check your Spotify credentials in Netlify environment variables',
          message: error.message
        })
      };
    }
    
    // For network errors or other cases
    return {
      statusCode: 500,  
      headers,
      body: JSON.stringify({ 
        error: 'Server error when fetching Spotify data',
        details: error.message,
        stack: process.env.NODE_ENV === 'production' ? null : error.stack
      })
    };
  }
};
