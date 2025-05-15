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
    
    // Format the response to match the expected structure for the SpotifyDisplay component
    console.log('Spotify API response received, formatting data');
    
    // Safely handle the response data
    let formattedTracks = [];
    
    try {
      // Validate response structure before processing
      if (!response || !response.data) {
        console.error('Empty response from Spotify API');
        throw new Error('Empty response from Spotify API');
      }
      
      // Log response structure for debugging
      console.log(`Response data structure: ${JSON.stringify(Object.keys(response.data))}`);
      
      if (response.data && response.data.items && Array.isArray(response.data.items)) {
        console.log(`Found ${response.data.items.length} track items to format`);
        
        formattedTracks = response.data.items
          .filter(item => item && item.track) // Ensure item and track exist
          .map(item => {
            // Safely access nested properties with fallbacks
            const track = item.track;
            return {
              songID: track.id || `unknown-${Math.random().toString(36).substring(2, 9)}`,
              artist: track.artists && track.artists[0] ? track.artists[0].name : 'Unknown Artist',
              title: track.name || 'Unknown Track',
              album: track.album && track.album.name ? track.album.name : 'Unknown Album',
              albumArt: track.album && track.album.images && track.album.images[0] ? 
                        track.album.images[0].url : 'https://via.placeholder.com/300',
              uri: track.uri || ''
            };
          });
          
        console.log(`Successfully formatted ${formattedTracks.length} tracks`);
      } else {
        console.error('Unexpected response format from Spotify API', JSON.stringify(response.data).substring(0, 200));
        throw new Error('Invalid response format from Spotify API');
      }
    } catch (formatError) {
      console.error('Error formatting tracks:', formatError);
      // Don't throw the error - return an empty array instead to prevent HTML error responses
      formattedTracks = [];
      console.log('Returning empty array due to formatting error');
    }
      return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ items: formattedTracks })
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
