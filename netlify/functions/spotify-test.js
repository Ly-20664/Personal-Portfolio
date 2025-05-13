// Netlify function to test Spotify API connection
const axios = require('axios');
require('dotenv').config();

// Spotify API credentials
const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const REFRESH_TOKEN = process.env.SPOTIFY_REFRESH_TOKEN;

// Output simple HTML for direct browser viewing
function generateHtmlResponse(data) {
  return `
<!DOCTYPE html>
<html>
<head>
  <title>Spotify API Test Results</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
    .success { color: green; }
    .error { color: red; }
    pre { background: #f4f4f4; padding: 10px; border-radius: 4px; overflow-x: auto; }
    .container { max-width: 800px; margin: 0 auto; }
    h1 { color: #1DB954; }
    .env-var { margin-bottom: 10px; }
    .test-result { margin-top: 20px; border-top: 1px solid #ddd; padding-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Spotify API Test Results</h1>
    <h2>Environment Variables</h2>
    <div class="env-var">
      <strong>SPOTIFY_CLIENT_ID:</strong> ${data.envVars.SPOTIFY_CLIENT_ID}
    </div>
    <div class="env-var">
      <strong>SPOTIFY_CLIENT_SECRET:</strong> ${data.envVars.SPOTIFY_CLIENT_SECRET}
    </div>
    <div class="env-var">
      <strong>SPOTIFY_REFRESH_TOKEN:</strong> ${data.envVars.SPOTIFY_REFRESH_TOKEN}
    </div>
    
    <div class="test-result">
      <h2>Token Generation</h2>
      <p class="${data.tokenWorks ? 'success' : 'error'}">
        ${data.tokenWorks ? '✅ Successfully generated access token' : '❌ Failed to generate access token'}
      </p>
      <p>${data.tokenGeneration}</p>
    </div>
    
    <div class="test-result">
      <h2>Complete Response Data</h2>
      <pre>${JSON.stringify(data, null, 2)}</pre>
    </div>
    
    <p>If you're seeing errors, check your Netlify environment variables and make sure they're set correctly.</p>
    
    <div class="test-links">
      <h2>Test Other Endpoints</h2>
      <ul>
        <li><a href="/.netlify/functions/top-tracks">Test Top Tracks Endpoint</a></li>
        <li><a href="/.netlify/functions/now-playing">Test Now Playing Endpoint</a></li>
      </ul>
    </div>
  </div>
</body>
</html>
  `;
}

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
    
    const responseData = {
      status: 'Spotify API diagnostic information',
      environment: process.env.NODE_ENV || 'unknown',
      timestamp: new Date().toISOString(),
      envVars: envVarStatus,
      tokenGeneration: tokenStatus,
      tokenWorks: tokenStatus === 'Success',
      netlifyContext: process.env.CONTEXT || 'unknown'
    };
    
    // Check the Accept header to determine if we should return HTML or JSON
    const acceptHeader = event.headers.accept || '';
    if (acceptHeader.includes('text/html')) {
      // Return HTML for browser viewing
      return {
        statusCode: 200,
        headers: { ...headers, 'Content-Type': 'text/html' },
        body: generateHtmlResponse(responseData)
      };
    } else {
      // Return JSON for API calls
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(responseData)
      };
    }  } catch (error) {
    console.error('Error in Spotify diagnostics:', error);
    
    const errorData = {
      error: 'Failed to run diagnostics',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    };
    
    // Check if we should return HTML or JSON
    const acceptHeader = event.headers.accept || '';
    if (acceptHeader.includes('text/html')) {
      // Return HTML error for browser viewing
      return {
        statusCode: 500,
        headers: { ...headers, 'Content-Type': 'text/html' },
        body: `
<!DOCTYPE html>
<html>
<head>
  <title>Spotify API Test Error</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
    .error { color: red; }
    pre { background: #f4f4f4; padding: 10px; border-radius: 4px; overflow-x: auto; }
    .container { max-width: 800px; margin: 0 auto; }
  </style>
</head>
<body>
  <div class="container">
    <h1 class="error">Spotify API Test Error</h1>
    <p>There was an error testing your Spotify API connection:</p>
    <p class="error">${error.message}</p>
    
    <h2>Common Solutions:</h2>
    <ol>
      <li>Check that all environment variables are correctly set in Netlify</li>
      <li>Verify your Spotify API credentials are valid and not expired</li>
      <li>Make sure your Spotify Developer App has the right permissions</li>
      <li>Try generating a new refresh token if the current one is expired</li>
    </ol>
    
    <div>
      <h3>Error Details:</h3>
      <pre>${JSON.stringify(errorData, null, 2)}</pre>
    </div>
  </div>
</body>
</html>
        `
      };
    } else {
      // Return JSON error for API calls
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify(errorData)
      };
    }
  }
};
