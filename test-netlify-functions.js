// Test Netlify Functions Locally
const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 3001;

// Import Netlify functions
const nowPlayingFunction = require('./netlify/functions/now-playing');
const topTracksFunction = require('./netlify/functions/top-tracks');
const recentTracksFunction = require('./netlify/functions/recent-tracks');

// Middleware to convert Netlify functions to Express
const netlifyToExpress = (netlifyFunction) => async (req, res) => {
  try {
    const result = await netlifyFunction({
      httpMethod: req.method,
      headers: req.headers,
      body: JSON.stringify(req.body),
      queryStringParameters: req.query
    });
    
    // Set headers
    Object.entries(result.headers || {}).forEach(([key, value]) => {
      res.set(key, value);
    });
    
    // Send response
    res.status(result.statusCode).send(result.body);
  } catch (error) {
    console.error('Error executing Netlify function:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    });
  }
};

// Setup routes for Netlify functions
app.get('/.netlify/functions/now-playing', netlifyToExpress(nowPlayingFunction.handler));
app.get('/.netlify/functions/top-tracks', netlifyToExpress(topTracksFunction.handler));
app.get('/.netlify/functions/recent-tracks', netlifyToExpress(recentTracksFunction.handler));

// Add API routes with the same endpoints as the redirects in netlify.toml
app.get('/api/now-playing', netlifyToExpress(nowPlayingFunction.handler));
app.get('/api/top-tracks', netlifyToExpress(topTracksFunction.handler));
app.get('/api/recent-tracks', netlifyToExpress(recentTracksFunction.handler));

// Start server
app.listen(port, () => {
  console.log(`Netlify Functions Test Server running at http://localhost:${port}`);
  console.log('Available endpoints:');
  console.log('- /.netlify/functions/now-playing');
  console.log('- /.netlify/functions/top-tracks');
  console.log('- /.netlify/functions/recent-tracks');
  console.log('- /api/now-playing');
  console.log('- /api/top-tracks');
  console.log('- /api/recent-tracks');
});

// Print test curl commands
console.log('\nTest with:');
console.log(`curl http://localhost:${port}/.netlify/functions/now-playing`);
console.log(`curl http://localhost:${port}/api/now-playing`);
