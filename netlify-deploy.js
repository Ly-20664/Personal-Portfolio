// Script to prepare for Netlify deployment
const fs = require('fs-extra');
const path = require('path');

console.log('🚀 Preparing project for Netlify deployment...');

// Ensure the netlify/functions directory exists
fs.ensureDirSync(path.join(__dirname, 'netlify', 'functions'));

// Check that all serverless functions are in place
const requiredFunctions = [
  'recent-tracks.js',
  'now-playing.js',
  'top-tracks.js'
];

let allFunctionsExist = true;
requiredFunctions.forEach(func => {
  const funcPath = path.join(__dirname, 'netlify', 'functions', func);
  if (!fs.existsSync(funcPath)) {
    console.error(`❌ Missing serverless function: ${func}`);
    allFunctionsExist = false;
  } else {
    console.log(`✅ Found serverless function: ${func}`);
  }
});

// Check if netlify.toml exists
const netlifyTomlPath = path.join(__dirname, 'netlify.toml');
if (!fs.existsSync(netlifyTomlPath)) {
  console.error('❌ Missing netlify.toml configuration file');
} else {
  console.log('✅ Found netlify.toml configuration file');
  
  // Read and validate the netlify.toml content
  try {
    const tomlContent = fs.readFileSync(netlifyTomlPath, 'utf8');
    const requiredRedirects = [
      '/api/recent-tracks',
      '/api/now-playing',
      '/api/top-tracks'
    ];
    
    let allRedirectsExist = true;
    requiredRedirects.forEach(redirect => {
      if (!tomlContent.includes(redirect)) {
        console.error(`❌ Missing redirect rule for: ${redirect}`);
        allRedirectsExist = false;
      } else {
        console.log(`✅ Found redirect rule for: ${redirect}`);
      }
    });
    
    if (allRedirectsExist) {
      console.log('✅ All required redirects are configured in netlify.toml');
    }
  } catch (err) {
    console.error('❌ Error reading netlify.toml:', err);
  }
}

// Reminder about environment variables
console.log('\n⚠️ IMPORTANT: Remember to set these environment variables in your Netlify project settings:');
console.log('   - SPOTIFY_CLIENT_ID');
console.log('   - SPOTIFY_CLIENT_SECRET');
console.log('   - SPOTIFY_REFRESH_TOKEN');

console.log('\n📋 Deployment Checklist:');
console.log('1. Push your code to GitHub');
console.log('2. Connect your repository to Netlify');
console.log('3. Configure environment variables in Netlify settings');
console.log('4. Set the build command to: npm run build');
console.log('5. Set the publish directory to: dist');
console.log('6. Deploy your site!');

if (allFunctionsExist) {
  console.log('\n✅ Your project is ready for Netlify deployment!');
} else {
  console.log('\n❌ Please fix the issues above before deploying to Netlify.');
}
