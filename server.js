require('dotenv').config();
const express = require('express');
const cors = require('cors');
const dns = require('dns');
const querystring = require('querystring');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const SpotifyWebApi = require('spotify-web-api-node');
const fs = require('fs');
const path = require('path');
const app = express();

// Security Headers - Modify helmet configuration to allow for iframe loading and cross-origin requests
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "accounts.spotify.com", "api.spotify.com", "cdnjs.cloudflare.com", "cdn.jsdelivr.net"],
        connectSrc: ["'self'", "accounts.spotify.com", "api.spotify.com"],
        frameSrc: ["'self'", "accounts.spotify.com", "open.spotify.com"],
        imgSrc: ["'self'", "data:", "i.scdn.co", "open.spotify.com", "*"],
        styleSrc: ["'self'", "'unsafe-inline'", "cdnjs.cloudflare.com", "cdn.jsdelivr.net"],
        fontSrc: ["'self'", "cdnjs.cloudflare.com", "cdn.jsdelivr.net", "fonts.gstatic.com"]
      }
    },
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" }
  })
);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});

// Apply rate limiter
app.use(limiter);

// CORS configuration - updated to allow Spotify domains
const corsOptions = {
    origin: process.env.NODE_ENV === 'production' 
        ? ['https://justinly.me', 'https://www.justinly.me', 'https://accounts.spotify.com', 'https://api.spotify.com'] 
        : ['http://localhost:3000', 'https://accounts.spotify.com', 'https://api.spotify.com'],
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 600, // 10 minutes
    optionsSuccessStatus: 204
};
app.use(cors(corsOptions));

// Secure static file serving
app.use(express.static('.', {
    setHeaders: (res, path, stat) => {
        // Allow font files to be loaded
        if (path.endsWith('.woff') || path.endsWith('.woff2') || path.endsWith('.ttf') || path.endsWith('.eot')) {
            res.set('Access-Control-Allow-Origin', '*');
        }
        res.set('X-Content-Type-Options', 'nosniff');
        res.set('X-Frame-Options', 'DENY');
    }
}));

// Validate environment variables
const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const REDIRECT_URI = process.env.NODE_ENV === 'production' 
    ? 'https://justinly.me/api/spotify/callback' 
    : 'http://localhost:3000/api/spotify/callback';

// You can hardcode your refresh token here if the environment variable is not set
// Get this token from https://developer.spotify.com/dashboard by creating an app and getting a token
const HARDCODED_REFRESH_TOKEN = 'YOUR_REFRESH_TOKEN_HERE'; // Replace this with your actual refresh token

let REFRESH_TOKEN = process.env.SPOTIFY_REFRESH_TOKEN || HARDCODED_REFRESH_TOKEN || null;

if (!CLIENT_ID || !CLIENT_SECRET) {
    console.error('Missing required environment variables');
    process.exit(1);
}

// No DNS configuration in production to prevent DNS_HOSTNAME_RESOLVED_PRIVATE error
if (process.env.NODE_ENV !== 'production') {
    // Configure DNS with secure defaults - only in development
    dns.setServers([
        '8.8.8.8',
        '8.8.4.4',
        ...dns.getServers()
    ]);
}

// Initialize Spotify API wrapper with the exact redirect URI
const spotifyApi = new SpotifyWebApi({
  clientId: CLIENT_ID,
  clientSecret: CLIENT_SECRET,
  redirectUri: REDIRECT_URI
});

let accessToken = null;
let tokenExpirationTime = null;

// Initialize token securely
(async function initializeToken() {
    try {
        if (REFRESH_TOKEN) {
            spotifyApi.setRefreshToken(REFRESH_TOKEN);
            await refreshAccessToken();
            console.log('Successfully initialized Spotify access token');
        } else {
            console.log('No refresh token available - waiting for authentication');
        }
    } catch (error) {
        console.error('Failed to initialize Spotify token:', error);
    }
})();

// Helper to persist refresh token to .env file
function updateRefreshTokenEnv(token) {
    try {
        const envPath = path.resolve(__dirname, '.env');
        // Check if file exists before trying to read it
        if (fs.existsSync(envPath)) {
            const envLines = fs.readFileSync(envPath, 'utf8').split('\n');
            const key = 'SPOTIFY_REFRESH_TOKEN=';
            const idx = envLines.findIndex(line => line.startsWith(key));
            if (idx !== -1) {
                envLines[idx] = `${key}${token}`;
            } else {
                envLines.push(`${key}${token}`);
            }
            fs.writeFileSync(envPath, envLines.join('\n'));
            console.log('Refresh token updated in .env file');
        } else {
            console.warn('.env file not found, creating new one with refresh token');
            fs.writeFileSync(envPath, `SPOTIFY_REFRESH_TOKEN=${token}\n`);
        }
    } catch (err) {
        console.error('Error updating refresh token in .env:', err);
    }
}

// Improved refreshAccessToken with better error handling and retry
async function refreshAccessToken(retry = true) {
    try {
        if (!spotifyApi.getRefreshToken()) {
            throw new Error('No refresh token available');
        }
        
        const data = await spotifyApi.refreshAccessToken();
        spotifyApi.setAccessToken(data.body['access_token']);
        tokenExpirationTime = Date.now() + data.body.expires_in * 1000;
        
        // Refresh token rotation handling - some APIs send a new refresh token with each refresh
        if (data.body['refresh_token']) {
            REFRESH_TOKEN = data.body['refresh_token'];
            spotifyApi.setRefreshToken(REFRESH_TOKEN);
            updateRefreshTokenEnv(REFRESH_TOKEN);
            console.log('Updated refresh token');
        }
        
        console.log('Access token refreshed successfully');
        return data.body['access_token'];
    } catch (err) {
        console.error('Error refreshing access token via spotify-web-api-node:', err);
        
        // Handle specific error cases
        if (err.statusCode === 400 && err.body && 
            (err.body.error === 'invalid_grant' || err.body.error_description?.includes('refresh token'))) {
            console.error('Refresh token invalid or expired');
            
            // Clear the stored token since it's invalid
            REFRESH_TOKEN = null;
            spotifyApi.resetRefreshToken();
            
            // Only emit this warning in development to avoid leaking information
            if (process.env.NODE_ENV === 'development') {
                console.warn('User will need to re-authenticate');
            }
        }
        
        // General error handling
        if (retry && err.statusCode >= 500 && err.statusCode < 600) {
            console.log('Server error when refreshing token, retrying in 5 seconds...');
            await new Promise(resolve => setTimeout(resolve, 5000));
            return refreshAccessToken(false); // Retry once with retry=false to prevent infinite loops
        }
        
        throw err;
    }
}

// Secure API endpoint with rate limiting and validation
const apiLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 50 // limit each IP to 50 requests per 5 minutes
});

// Add a new public endpoint that doesn't require user authentication
app.get('/api/spotify/public/recent-tracks', apiLimiter, async (req, res) => {
    try {
        // Check if we have a refresh token
        if (!REFRESH_TOKEN && !spotifyApi.getRefreshToken()) {
            return res.status(500).json({ 
                error: 'Server not configured with refresh token'
            });
        }

        // Check if token needs refresh
        if (!tokenExpirationTime || Date.now() >= tokenExpirationTime - 60000) { // Refresh 1 minute before expiration
            await refreshAccessToken();
        }

        const data = await spotifyApi.getMyRecentlyPlayedTracks({ limit: 7 });
        
        // Return raw items for frontend processing
        res.json(data.body);
    } catch (err) {
        console.error('Error fetching public Spotify tracks:', err);

        if (err.statusCode === 429) {
            // Rate limiting error - pass Spotify's retry-after header
            const retryAfter = err.headers['retry-after'] || 30;
            return res.status(429).json({ 
                error: 'Rate limit exceeded',
                retryAfter: parseInt(retryAfter)
            });
        }

        res.status(500).json({ error: 'Failed fetching tracks' });
    }
});

// Original endpoint that might require authentication
app.get('/api/spotify/tracks', apiLimiter, async (req, res) => {
    try {
        // Check if we have a refresh token
        if (!REFRESH_TOKEN && !spotifyApi.getRefreshToken()) {
            return res.status(401).json({ 
                error: 'Authentication required',
                authUrl: '/api/spotify/auth-url'
            });
        }

        // Check if token needs refresh
        if (!tokenExpirationTime || Date.now() >= tokenExpirationTime - 60000) { // Refresh 1 minute before expiration
            await refreshAccessToken();
        }

        const data = await spotifyApi.getMyRecentlyPlayedTracks({ limit: 7 }); // Increased limit to 7 tracks
        
        // Return raw items for frontend processing
        res.json(data.body);
    } catch (err) {
        console.error('Error fetching Spotify tracks:', err);

        // Handle different types of errors
        if (err.message === 'No refresh token available' || 
            (err.statusCode === 401 && err.body?.error?.message === 'The access token expired')) {
            return res.status(401).json({ 
                error: 'Authentication required',
                authUrl: '/api/spotify/auth-url'
            });
        }

        if (err.statusCode === 429) {
            // Rate limiting error - pass Spotify's retry-after header
            const retryAfter = err.headers['retry-after'] || 30;
            return res.status(429).json({ 
                error: 'Rate limit exceeded',
                retryAfter: parseInt(retryAfter)
            });
        }

        res.status(500).json({ error: 'Failed fetching tracks' });
    }
});

// Add auth URL endpoint
app.get('/api/spotify/auth-url', (req, res) => {
    const scopes = [
        'user-read-playback-state',
        'user-read-currently-playing',
        'user-read-recently-played',
        'user-top-read'
    ];
    
    // Create the authorization URL
    const authorizeURL = spotifyApi.createAuthorizeURL(scopes, 'state');
    
    // Don't redirect, just render a page with the link
    res.send(`
        <h1>Spotify Authorization</h1>
        <p>Click the link below to authorize your Spotify account:</p>
        <a href="${authorizeURL}" style="display: inline-block; background: #1DB954; color: white; padding: 12px 24px; text-decoration: none; border-radius: 24px; font-family: Arial, sans-serif; font-weight: bold;">
            Connect to Spotify
        </a>
        <p style="margin-top: 20px; color: #666;">After authorizing, you'll be redirected back to this application.</p>
    `);
});

// Add new Spotify callback endpoint under API path
app.get('/api/spotify/callback', async (req, res) => {
    const code = req.query.code;
    if (!code) return res.status(400).json({ error: 'Code is required' });
    try {
        const data = await spotifyApi.authorizationCodeGrant(code);
        spotifyApi.setAccessToken(data.body['access_token']);
        spotifyApi.setRefreshToken(data.body['refresh_token']);
        tokenExpirationTime = Date.now() + data.body.expires_in * 1000;
        REFRESH_TOKEN = data.body['refresh_token'];
        updateRefreshTokenEnv(data.body['refresh_token']);

        // Show the refresh token in development mode so user can copy it
        if (process.env.NODE_ENV === 'development') {
            return res.send(`
                <h1>Authentication Successful</h1>
                <p>Your refresh token has been saved to the .env file.</p>
                <p>Refresh token: <code>${data.body['refresh_token']}</code></p>
                <p>You may now close this window and restart the server.</p>
                <p><a href="/">Return to home page</a></p>
            `);
        }
        
        res.redirect('/');
    } catch (err) {
        console.error('Error in Spotify callback:', err);
        res.redirect('/?auth=error');
    }
});

// Add a route to display the current refresh token
app.get('/api/spotify/get-refresh-token', (req, res) => {
    if (process.env.NODE_ENV !== 'development') {
        return res.status(403).json({ error: 'This endpoint is only available in development mode.' });
    }
    
    const token = REFRESH_TOKEN || spotifyApi.getRefreshToken() || process.env.SPOTIFY_REFRESH_TOKEN || null;
    
    if (!token) {
        res.send(`
            <h1>No Refresh Token Found</h1>
            <p>You need to authorize the application first.</p>
            <p><a href="/api/spotify/auth-url">Click here to authorize with Spotify</a></p>
        `);
    } else {
        res.send(`
            <h1>Current Refresh Token</h1>
            <p>The following refresh token is currently being used:</p>
            <p><code>${token}</code></p>
            <p>This token has been saved to your .env file.</p>
            <p><a href="/">Return to home page</a></p>
        `);
    }
});

// Add a helper endpoint to show client ID and generate auth URL
app.get('/api/spotify/check-config', (req, res) => {
    const scopes = [
        'user-read-playback-state',
        'user-read-currently-playing',
        'user-read-recently-played',
        'user-top-read'
    ];
    
    // Create the authorization URL
    const authorizeURL = spotifyApi.createAuthorizeURL(scopes, 'state');
    
    res.send(`
        <h1>Spotify Configuration Check</h1>
        <p><strong>Client ID:</strong> ${CLIENT_ID}</p>
        <p><strong>Redirect URI:</strong> ${REDIRECT_URI}</p>
        <p><strong>Authorization URL:</strong></p>
        <pre style="background: #f0f0f0; padding: 10px; overflow-x: auto;">${authorizeURL}</pre>
        <p>Click the link below to authorize using this URL:</p>
        <a href="${authorizeURL}" style="display: inline-block; background: #1DB954; color: white; padding: 12px 24px; text-decoration: none; border-radius: 24px; font-family: Arial, sans-serif; font-weight: bold;">
            Connect to Spotify
        </a>
        <p style="margin-top: 20px;">
            <strong>Important:</strong> Make sure you're logged in to the Spotify account that owns this Client ID.
            If you're getting "Invalid Client" errors, verify that this Client ID exists in your 
            <a href="https://developer.spotify.com/dashboard" target="_blank">Spotify Developer Dashboard</a>.
        </p>
    `);
});

// Add a simple helper endpoint to get a refresh token with your confirmed client ID
app.get('/api/spotify/get-refresh-token-helper', (req, res) => {
    // Ensure we're using the correct client ID
    if (CLIENT_ID !== 'b2c895cfbf9144a5bd7dd6587c75af8c') {
        console.warn('Client ID in .env does not match the confirmed one');
    }
    
    const scopes = [
        'user-read-playback-state',
        'user-read-currently-playing',
        'user-read-recently-played',
        'user-top-read'
    ];
    
    // Create the authorization URL using confirmed client ID
    const spotifyAuthUrl = `https://accounts.spotify.com/authorize?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(scopes.join(' '))}`;
    
    res.send(`
        <h1>Get Spotify Refresh Token</h1>
        <p>This page will help you get a refresh token for your Spotify account.</p>
        
        <h2>Step 1: Connect to Spotify</h2>
        <p>Click the button below to authorize this application with your Spotify account.</p>
        <a href="${spotifyAuthUrl}" style="display: inline-block; background: #1DB954; color: white; padding: 12px 24px; text-decoration: none; border-radius: 24px; font-family: Arial, sans-serif; font-weight: bold; margin-bottom: 20px;">
            Connect to Spotify
        </a>
        
        <h2>Step 2: After Authorization</h2>
        <p>After authorizing, you'll be redirected back to this application with an authorization code.</p>
        <p>The server will automatically exchange this code for an access token and refresh token.</p>
        <p>The refresh token will be displayed on the next page and also saved to your .env file.</p>
        
        <h2>Having Trouble?</h2>
        <p>Make sure that:</p>
        <ul>
            <li>You're logged into the correct Spotify account.</li>
            <li>Your app in the <a href="https://developer.spotify.com/dashboard/applications/${CLIENT_ID}" target="_blank">Spotify Developer Dashboard</a> has <code>${REDIRECT_URI}</code> set as a redirect URI.</li>
            <li>Your app is properly set up with the correct client ID and client secret in your .env file.</li>
        </ul>
    `);
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Not Found' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    // Only test DNS connectivity in development mode
    if (process.env.NODE_ENV !== 'production') {
        dns.resolve('accounts.spotify.com', (err) => {
            if (err) {
                console.error('Warning: Cannot resolve Spotify servers. Please check your internet connection or DNS settings.');
            } else {
                console.log('Successfully connected to Spotify servers');
            }
        });
    }
    console.log(`Server running on port ${PORT}`);
});