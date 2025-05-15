// Netlify function for fetching recent tracks
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
  
  // Instead of just logging, throw an error that will be caught by the handler
  throw new Error('Missing required Spotify environment variables');
}

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
  console.log('Recent tracks function called');
  
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json' // Explicitly set content type to JSON - CRITICAL for preventing HTML errors
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
    console.log('Attempting to get access token');
    // Get access token
    const accessToken = await getAccessToken();
    console.log('Successfully obtained access token');
    
    // Fetch recently played tracks
    console.log('Fetching recently played tracks from Spotify API');
    const response = await axios({
      method: 'get',
      url: 'https://api.spotify.com/v1/me/player/recently-played',
      params: {
        limit: 7
      },
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    // Simply return the raw response data which already has the right structure
    // This is the data directly from Spotify API with { items: [{track: {...}}] } shape
    console.log('Returning raw Spotify API response data');
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response.data)
    };
    
  } catch (error) {
    console.error('Error in recent-tracks function:', error);
    
    // CRITICAL FIX: Always set content type to application/json to prevent HTML error pages
    // This prevents the "Unexpected token '<'" error
    headers['Content-Type'] = 'application/json';
    
    // IMPORTANT: For ANY error, return a 200 status with empty array
    // This ensures the frontend always gets valid JSON it can handle
    console.log('Returning empty array due to error');
    
    // Check if it's a response error from Spotify
    if (error.response) {
      return {
        statusCode: 200, // Return 200 instead of error code
        headers,
        body: JSON.stringify({ items: [] }) // Empty items array instead of error object
      };
    }
    
    // For network errors or other cases
    return {
      statusCode: 200,  // Return 200 OK with empty results instead of an error
      headers,
      body: JSON.stringify({ items: [] })  // Empty items array instead of error object
    };
  }
};
