// Get a refresh token for Spotify
require('dotenv').config();
const SpotifyWebApi = require('spotify-web-api-node');
const http = require('http');
const url = require('url');
const open = require('open');
const fs = require('fs');
const path = require('path');

// Get credentials from environment variables
const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const REDIRECT_URI = 'http://localhost:8888/callback';

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('Missing required environment variables SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET');
  process.exit(1);
}

// Create the Spotify API object
const spotifyApi = new SpotifyWebApi({
  clientId: CLIENT_ID,
  clientSecret: CLIENT_SECRET,
  redirectUri: REDIRECT_URI
});

// Create scopes for permissions
const scopes = [
  'user-read-playback-state',
  'user-read-currently-playing',
  'user-read-recently-played',
  'user-top-read'
];

// Create authorization URL directly to avoid path-to-regexp issues
const spotifyBaseUrl = "https://accounts.spotify.com/authorize";
const authorizeParams = new URLSearchParams({
  client_id: CLIENT_ID,
  response_type: 'code',
  redirect_uri: REDIRECT_URI,
  scope: scopes.join(' '),
  state: 'state'
});
const authorizeURL = `${spotifyBaseUrl}?${authorizeParams.toString()}`;

console.log('Opening browser for Spotify authorization...');
console.log('Please login with your Spotify account and approve the permissions.');

// Open the authorization URL in the default browser
open(authorizeURL);

// Create a simple HTTP server to handle the callback
const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  
  if (parsedUrl.pathname === '/callback') {
    const code = parsedUrl.query.code;
    
    if (!code) {
      res.writeHead(400, { 'Content-Type': 'text/html' });
      res.end('<h1>Error</h1><p>No authorization code received</p>');
      return;
    }
    
    try {
      // Exchange authorization code for tokens
      const data = await spotifyApi.authorizationCodeGrant(code);
      const accessToken = data.body['access_token'];
      const refreshToken = data.body['refresh_token'];
      
      // Update .env file with the refresh token
      const envPath = path.resolve(__dirname, '.env');
      const envContent = fs.readFileSync(envPath, 'utf8');
      
      // Replace or add the SPOTIFY_REFRESH_TOKEN line
      const updatedContent = envContent.replace(
        /SPOTIFY_REFRESH_TOKEN=.*(\r?\n|$)/,
        `SPOTIFY_REFRESH_TOKEN=${refreshToken}$1`
      );
      
      fs.writeFileSync(envPath, updatedContent);
      
      console.log('Refresh token has been saved to .env file!');
      
      // Send success response
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(`
        <h1>Success!</h1>
        <p>Your refresh token has been saved to your .env file.</p>
        <p>Refresh token: <code>${refreshToken}</code></p>
        <p>You can now close this window and restart your server.</p>
      `);
      
      // Close the server after handling the callback
      setTimeout(() => {
        console.log('Server shutting down...');
        server.close();
        process.exit(0);
      }, 1000);
    } catch (error) {
      console.error('Error exchanging code for tokens:', error);
      res.writeHead(500, { 'Content-Type': 'text/html' });
      res.end('<h1>Error</h1><p>Failed to exchange authorization code for tokens</p>');
    }
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

server.listen(8888, () => {
  console.log('Waiting for Spotify callback on http://localhost:8888/callback');
});