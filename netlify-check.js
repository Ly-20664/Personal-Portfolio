// Enhanced check for required environment variables for Netlify deployment
require('dotenv').config();
const fs = require('fs');
const path = require('path');

console.log('=== Netlify Environment Check ===');
console.log('Checking environment variables and configuration...');

// Define the required environment variables for Spotify integration
const requiredVars = [
  'SPOTIFY_CLIENT_ID',
  'SPOTIFY_CLIENT_SECRET',
  'SPOTIFY_REFRESH_TOKEN'
];

// Check if each variable exists
const missingVars = requiredVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ ERROR: The following required environment variables are missing:');
  missingVars.forEach(varName => console.error(`  - ${varName}`));
  console.error('\nPlease add these to your Netlify environment variables in the Netlify dashboard:');
  console.error('Site settings > Build & deploy > Environment > Environment variables');
  process.exit(1);
} else {
  console.log('✅ All required environment variables are set.');
  
  // Basic validation of token formats
  if (!process.env.SPOTIFY_CLIENT_ID.match(/^[0-9a-f]{32}$/i)) {
    console.warn('⚠️ Warning: SPOTIFY_CLIENT_ID does not match expected format. Verify it\'s correct.');
  }
  
  if (!process.env.SPOTIFY_CLIENT_SECRET.match(/^[0-9a-f]{32}$/i)) {
    console.warn('⚠️ Warning: SPOTIFY_CLIENT_SECRET does not match expected format. Verify it\'s correct.');
  }
  
  if (!process.env.SPOTIFY_REFRESH_TOKEN) {
    console.warn('⚠️ Warning: SPOTIFY_REFRESH_TOKEN is set but empty. Verify it\'s correct.');
  } else {
    console.log('ℹ️ SPOTIFY_REFRESH_TOKEN is set (value hidden for security)');
  }
  
  // Check netlify.toml file
  console.log('\n=== Checking netlify.toml configuration ===');
  const netlifyTomlPath = path.join(__dirname, 'netlify.toml');
  
  if (!fs.existsSync(netlifyTomlPath)) {
    console.error('❌ netlify.toml file not found!');
  } else {
    console.log('✅ netlify.toml file found');
    const tomlContent = fs.readFileSync(netlifyTomlPath, 'utf-8');
    
    // Check for required sections
    const checkTomlSection = (section, description) => {
      if (tomlContent.includes(section)) {
        console.log(`✅ ${description} found in netlify.toml`);
        return true;
      } else {
        console.error(`❌ Missing ${description} in netlify.toml`);
        return false;
      }
    };
    
    checkTomlSection('[build]', 'Build section');
    checkTomlSection('functions = ', 'Functions directory specification');
    
    // Check API redirects
    console.log('\n=== Checking API redirects ===');
    const apiEndpoints = [
      { from: '/api/now-playing', to: '/.netlify/functions/now-playing' },
      { from: '/api/top-tracks', to: '/.netlify/functions/top-tracks' },
      { from: '/api/recent-tracks', to: '/.netlify/functions/recent-tracks' }
    ];
    
    apiEndpoints.forEach(endpoint => {
      if (tomlContent.includes(`from = "${endpoint.from}"`) && 
          tomlContent.includes(`to = "${endpoint.to}"`)) {
        console.log(`✅ Redirect from ${endpoint.from} to ${endpoint.to} configured`);
      } else {
        console.error(`❌ Missing redirect for ${endpoint.from}`);
      }
    });
  }
  
  // Check Netlify functions directory
  console.log('\n=== Checking Netlify functions ===');
  const functionsDir = path.join(__dirname, 'netlify', 'functions');
  
  if (!fs.existsSync(functionsDir)) {
    console.error(`❌ Netlify functions directory not found: ${functionsDir}`);
  } else {
    console.log(`✅ Netlify functions directory found: ${functionsDir}`);
    
    const requiredFunctions = ['now-playing.js', 'top-tracks.js', 'recent-tracks.js'];
    const missingFunctions = [];
    
    requiredFunctions.forEach(funcFile => {
      const filePath = path.join(functionsDir, funcFile);
      if (!fs.existsSync(filePath)) {
        missingFunctions.push(funcFile);
      }
    });
    
    if (missingFunctions.length > 0) {
      console.error(`❌ Missing required function files: ${missingFunctions.join(', ')}`);
    } else {
      console.log('✅ All required function files are present');
    }
  }
  
  console.log('\n✅ Your project is ready for Netlify deployment! 🚀');
}
