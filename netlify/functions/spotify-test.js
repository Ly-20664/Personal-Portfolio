// Netlify function to test Spotify API connection
const axios = require('axios');
require('dotenv').config();

// Spotify API credentials
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
    throw new Error(`Failed to get access token: ${error.message}`);
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
    // Get environment variable values but hide the actual token values
    const envVarStatus = {
      SPOTIFY_CLIENT_ID: CLIENT_ID ? `Set (${CLIENT_ID.substring(0, 5)}...${CLIENT_ID.substring(CLIENT_ID.length-5)})` : 'Not set',
      SPOTIFY_CLIENT_SECRET: CLIENT_SECRET ? 'Set (hidden)' : 'Not set',
      SPOTIFY_REFRESH_TOKEN: REFRESH_TOKEN ? `Set (${REFRESH_TOKEN.substring(0, 5)}...hidden...)` : 'Not set',
    };
    
    // Try to get an access token to verify Spotify API connectivity
    let tokenStatus = 'Unknown';
    let accessToken = '';
    
    try {
      accessToken = await getAccessToken();
      tokenStatus = 'Success';
    } catch (tokenError) {
      tokenStatus = `Failed: ${tokenError.message}`;
    }
    
    // Return diagnostic information
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        status: 'Spotify API diagnostic information',
        environment: process.env.NODE_ENV || 'unknown',
        timestamp: new Date().toISOString(),
        envVars: envVarStatus,
        tokenGeneration: tokenStatus,
        tokenWorks: tokenStatus === 'Success',
        netlifyContext: process.env.CONTEXT || 'unknown'
      })
    };
  } catch (error) {
    console.error('Error in Spotify diagnostics:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to run diagnostics',
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      })
    };
  }
};
