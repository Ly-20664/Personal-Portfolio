// Check for required environment variables for Netlify deployment
require('dotenv').config();

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
  
  console.log('\nYour project is ready for Netlify deployment! 🚀');
}
