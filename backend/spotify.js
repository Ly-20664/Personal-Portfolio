const express = require('express');
const axios = require('axios');
const router = express.Router();

// Get credentials from environment variables
const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

let accessToken = null;

// Fetch access token using client credentials flow
async function fetchAccessToken() {
    const response = await axios.post('https://accounts.spotify.com/api/token', null, {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')}`
        },
        params: {
            grant_type: 'client_credentials'
        }
    });
    accessToken = response.data.access_token;
}

// Middleware to ensure access token is available
router.use(async (req, res, next) => {
    if (!accessToken) {
        await fetchAccessToken();
    }
    next();
});

// Endpoint to fetch Spotify tracks
router.get('/tracks', async (req, res) => {
    try {
        const response = await axios.get('https://api.spotify.com/v1/playlists/{playlist_id}/tracks', {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        res.json(response.data);
    } catch (error) {
        if (error.response && error.response.status === 401) {
            // Token expired, fetch a new one
            await fetchAccessToken();
            return res.redirect(req.originalUrl);
        }
        res.status(500).send('Error fetching Spotify tracks');
    }
});

module.exports = router;
