// Enhanced diagnostic script for Netlify functions
const axios = require('axios');
require('dotenv').config();

// Console formatting helpers
const COLORS = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

console.log(`${COLORS.bold}${COLORS.blue}======= NETLIFY FUNCTIONS DIAGNOSTIC TOOL =======${COLORS.reset}`);
console.log(`${COLORS.cyan}Running checks to debug Spotify API integration issues...${COLORS.reset}\n`);

// Check environment variables
const requiredVars = [
  'SPOTIFY_CLIENT_ID',
  'SPOTIFY_CLIENT_SECRET',
  'SPOTIFY_REFRESH_TOKEN'
];

console.log(`${COLORS.bold}1. Checking environment variables:${COLORS.reset}`);

let allVarsExist = true;
requiredVars.forEach(varName => {
  const exists = process.env[varName] !== undefined && process.env[varName] !== '';
  console.log(`   ${exists ? '✅' : '❌'} ${varName}: ${exists ? 'Present' : 'Missing'}`);
  if (!exists) allVarsExist = false;
});

if (!allVarsExist) {
  console.log(`\n${COLORS.red}${COLORS.bold}CRITICAL ERROR: Missing environment variables.${COLORS.reset}`);
  console.log(`${COLORS.yellow}This is likely the reason your Netlify functions are returning HTML errors.${COLORS.reset}`);
  console.log(`\nTo fix this issue:`);
  console.log(`1. Go to your Netlify dashboard`);
  console.log(`2. Navigate to: Site settings > Build & deploy > Environment > Environment variables`);
  console.log(`3. Add the missing environment variables listed above`);
  console.log(`4. Trigger a new deployment\n`);
  process.exit(1);
}

// Test Spotify token validity
console.log(`\n${COLORS.bold}2. Testing Spotify token validity:${COLORS.reset}`);

async function getAccessToken() {
  try {
    console.log(`   Attempting to get access token from Spotify...`);
    const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
    const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
    const REFRESH_TOKEN = process.env.SPOTIFY_REFRESH_TOKEN;
    
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
    
    const accessToken = response.data.access_token;
    console.log(`   ✅ Successfully obtained access token from Spotify API`);
    return accessToken;
  } catch (error) {
    console.log(`   ❌ ${COLORS.red}Failed to get access token: ${error.message}${COLORS.reset}`);
    
    if (error.response) {
      console.log(`\n${COLORS.bold}Error details:${COLORS.reset}`);
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Message: ${JSON.stringify(error.response.data)}`);
    }
    
    console.log(`\n${COLORS.yellow}Likely causes:${COLORS.reset}`);
    console.log(`1. Invalid CLIENT_ID or CLIENT_SECRET`);
    console.log(`2. Expired or invalid REFRESH_TOKEN`);
    console.log(`3. Spotify API rate limiting or service issues`);
    
    process.exit(1);
  }
}

async function testTopTracks(accessToken) {
  try {
    console.log(`\n${COLORS.bold}3. Testing Top Tracks endpoint:${COLORS.reset}`);
    console.log(`   Attempting to fetch top tracks from Spotify...`);
    
    const response = await axios({
      method: 'get',
      url: 'https://api.spotify.com/v1/me/top/tracks',
      params: {
        time_range: 'short_term',
        limit: 5
      },
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    console.log(`   ✅ Successfully fetched top tracks from Spotify API`);
    console.log(`   Found ${response.data.items.length} tracks\n`);
    
    // Print first track as sample
    if (response.data.items.length > 0) {
      const firstTrack = response.data.items[0];
      console.log(`${COLORS.green}Sample track data:${COLORS.reset}`);
      console.log(`   Title: ${firstTrack.name}`);
      console.log(`   Artist: ${firstTrack.artists[0].name}`);
      console.log(`   Album: ${firstTrack.album.name}`);
    }
    
    return true;
  } catch (error) {
    console.log(`   ❌ ${COLORS.red}Failed to fetch top tracks: ${error.message}${COLORS.reset}`);
    
    if (error.response) {
      console.log(`\n${COLORS.bold}Error details:${COLORS.reset}`);
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Message: ${JSON.stringify(error.response.data)}`);
    }
    
    return false;
  }
}

async function runDiagnostics() {
  try {
    const accessToken = await getAccessToken();
    const topTracksSuccess = await testTopTracks(accessToken);
    
    if (topTracksSuccess) {
      console.log(`\n${COLORS.green}${COLORS.bold}✅ GOOD NEWS! Your Spotify API integration is working correctly.${COLORS.reset}`);
      console.log(`\nIf you're still seeing errors on your deployed site, check for:`);
      console.log(`1. Make sure your environment variables are properly set in Netlify`);
      console.log(`2. Review your Netlify function logs for any errors`);
      console.log(`3. Verify your CORS settings are correct`);
    } else {
      console.log(`\n${COLORS.red}${COLORS.bold}❌ There are issues with your Spotify API integration.${COLORS.reset}`);
      console.log(`Please fix the errors above before deploying.`);
    }
  } catch (error) {
    console.error(`${COLORS.red}Diagnostic failed: ${error.message}${COLORS.reset}`);
  }
}

runDiagnostics();
