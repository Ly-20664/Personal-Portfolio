require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const dns = require('dns');
const querystring = require('querystring');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const app = express();

// Security Headers
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// CORS configuration - restrict to your domain only
const corsOptions = {
    origin: process.env.NODE_ENV === 'production' 
        ? ['https://justinly.me'] // Replace with your actual domain
        : ['http://localhost:3000'],
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
        res.set('X-Content-Type-Options', 'nosniff');
        res.set('X-Frame-Options', 'DENY');
    }
}));

// Validate environment variables
const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI;
let REFRESH_TOKEN = process.env.SPOTIFY_REFRESH_TOKEN;

if (!CLIENT_ID || !CLIENT_SECRET || !REDIRECT_URI || !REFRESH_TOKEN) {
    console.error('Missing required environment variables');
    process.exit(1);
}

// Configure DNS with secure defaults
dns.setServers([
    '8.8.8.8',
    '8.8.4.4',
    ...dns.getServers()
]);

// Secure axios configuration
axios.defaults.timeout = 10000;
axios.defaults.retry = 3;
axios.defaults.retryDelay = 1000;
axios.defaults.headers.common['User-Agent'] = 'PersonalWebsite/1.0';

// Add axios retry interceptor with security checks
axios.interceptors.response.use(undefined, async (err) => {
    const config = err.config;
    if (!config || !config.retry || config.currentRetry >= config.retry) {
        return Promise.reject(err);
    }
    
    config.currentRetry = (config.currentRetry || 0) + 1;
    await new Promise(resolve => setTimeout(resolve, config.retryDelay));
    return axios(config);
});

let accessToken = null;
let tokenExpirationTime = null;

// Initialize token securely
(async function initializeToken() {
    try {
        await refreshAccessToken();
        console.log('Successfully initialized Spotify access token');
    } catch (error) {
        console.error('Failed to initialize Spotify token:', error);
    }
})();

async function refreshAccessToken() {
    try {
        if (!REFRESH_TOKEN) {
            throw new Error('No refresh token available');
        }

        const response = await axios.post('https://accounts.spotify.com/api/token', 
            querystring.stringify({
                grant_type: 'refresh_token',
                refresh_token: REFRESH_TOKEN
            }), {
            headers: {
                'Authorization': 'Basic ' + Buffer.from(CLIENT_ID + ':' + CLIENT_SECRET).toString('base64'),
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        accessToken = response.data.access_token;
        tokenExpirationTime = Date.now() + (response.data.expires_in * 1000);
        return accessToken;
    } catch (error) {
        console.error('Error refreshing access token:', error);
        throw error;
    }
}

// Secure API endpoint with rate limiting and validation
const apiLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 50 // limit each IP to 50 requests per 5 minutes
});

app.get('/api/spotify/tracks', apiLimiter, async (req, res) => {
    try {
        // Check if token needs refresh
        if (!accessToken || Date.now() >= tokenExpirationTime) {
            await refreshAccessToken();
        }

        const response = await axios.get('https://api.spotify.com/v1/me/player/recently-played', {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            },
            params: { limit: 5 }
        });

        // Sanitize the response data
        const sanitizedTracks = response.data.items.map(item => ({
            id: item.track.id,
            name: item.track.name,
            artist: item.track.artists.map(artist => artist.name).join(', '),
            album: item.track.album.name,
            image: item.track.album.images[0]?.url
        }));

        res.json({ tracks: sanitizedTracks });
    } catch (error) {
        console.error('Error fetching tracks:', error);
        
        if (error.response?.status === 401) {
            try {
                await refreshAccessToken();
                const response = await axios.get('https://api.spotify.com/v1/me/player/recently-played', {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`
                    },
                    params: { limit: 5 }
                });
                
                const sanitizedTracks = response.data.items.map(item => ({
                    id: item.track.id,
                    name: item.track.name,
                    artist: item.track.artists.map(artist => artist.name).join(', '),
                    album: item.track.album.name,
                    image: item.track.album.images[0]?.url
                }));

                return res.json({ tracks: sanitizedTracks });
            } catch (refreshError) {
                console.error('Error refreshing token:', refreshError);
                return res.status(401).json({ error: 'Authentication failed' });
            }
        }
        
        res.status(500).json({ error: 'Failed to fetch tracks' });
    }
});

// Add auth URL endpoint
app.get('/api/spotify/auth-url', apiLimiter, (req, res) => {
    try {
        const scopes = [
            'user-read-playback-state',
            'user-read-currently-playing',
            'user-read-recently-played',
            'user-top-read'
        ];

        const authUrl = 'https://accounts.spotify.com/authorize?' + 
            querystring.stringify({
                client_id: CLIENT_ID,
                response_type: 'code',
                redirect_uri: REDIRECT_URI,
                scope: scopes.join(' '),
                show_dialog: true
            });

        res.json({ url: authUrl });
    } catch (error) {
        console.error('Error generating auth URL:', error);
        res.status(500).json({ error: 'Failed to generate auth URL' });
    }
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
    // Test connection to Spotify servers on startup
    dns.resolve('accounts.spotify.com', (err) => {
        if (err) {
            console.error('Warning: Cannot resolve Spotify servers. Please check your internet connection or DNS settings.');
        } else {
            console.log('Successfully connected to Spotify servers');
        }
    });
    console.log(`Server running on http://localhost:${PORT}`);
});