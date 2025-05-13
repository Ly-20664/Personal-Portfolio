// Prepare Netlify build script
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('=== Prepare Netlify Build ===');

// Create a special .env.netlify file with correct environment variables
console.log('Creating .env.netlify file...');

try {
  // Get environment variables from current .env
  require('dotenv').config();
  
  const envContent = `# Netlify Environment Variables
SPOTIFY_CLIENT_ID=${process.env.SPOTIFY_CLIENT_ID || ''}
SPOTIFY_CLIENT_SECRET=${process.env.SPOTIFY_CLIENT_SECRET || ''}
SPOTIFY_REFRESH_TOKEN=${process.env.SPOTIFY_REFRESH_TOKEN || ''}
NODE_ENV=production
`;

  fs.writeFileSync('.env.netlify', envContent);
  console.log('✅ .env.netlify file created successfully');
} catch (error) {
  console.error('❌ Failed to create .env.netlify file:', error);
}

// Create a gitignore entry for netlify cli
if (!fs.existsSync('.gitignore')) {
  fs.writeFileSync('.gitignore', '');
}

const gitignoreContent = fs.readFileSync('.gitignore', 'utf8');
if (!gitignoreContent.includes('.netlify')) {
  fs.appendFileSync('.gitignore', '\n# Netlify\n.netlify\n');
  console.log('✅ Added .netlify to .gitignore');
}

// Create or update netlify.toml
console.log('Verifying netlify.toml configuration...');

const netlifyTomlPath = path.join(__dirname, 'netlify.toml');
const netlifyTomlContent = `[build]
  command = "npm run build"
  publish = "dist"
  functions = "netlify/functions"

[dev]
  framework = "#custom"
  command = "npm run dev"
  targetPort = 3000
  port = 8888

[[redirects]]
  from = "/api/recent-tracks"
  to = "/.netlify/functions/recent-tracks"
  status = 200

[[redirects]]
  from = "/api/now-playing"
  to = "/.netlify/functions/now-playing"
  status = 200
  
[[redirects]]
  from = "/api/top-tracks"
  to = "/.netlify/functions/top-tracks"
  status = 200

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
`;

// Only update if the file doesn't exist or has different content
if (!fs.existsSync(netlifyTomlPath) || 
    fs.readFileSync(netlifyTomlPath, 'utf8') !== netlifyTomlContent) {
  fs.writeFileSync(netlifyTomlPath, netlifyTomlContent);
  console.log('✅ Updated netlify.toml with correct configuration');
} else {
  console.log('✅ netlify.toml already has correct configuration');
}

// Check if webpack.config.js is properly configured
console.log('Checking webpack configuration...');
const webpackConfigPath = path.join(__dirname, 'webpack.config.js');
if (fs.existsSync(webpackConfigPath)) {
  const webpackConfig = fs.readFileSync(webpackConfigPath, 'utf8');
  
  // Check if webpack is copying all necessary static files
  const requiredAssets = ['raw.png', 'raw2.png', 'styles.css', 'script.js'];
  const missingAssets = [];
  
  requiredAssets.forEach(asset => {
    if (!webpackConfig.includes(asset)) {
      missingAssets.push(asset);
    }
  });
  
  if (missingAssets.length > 0) {
    console.warn(`⚠️ Warning: Some assets might be missing from webpack copy config: ${missingAssets.join(', ')}`);
  } else {
    console.log('✅ All required assets are configured in webpack');
  }
} else {
  console.error('❌ webpack.config.js not found!');
}

// Run the build
console.log('\n=== Running production build ===');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Build completed successfully!');
} catch (error) {
  console.error('❌ Build failed:', error);
  process.exit(1);
}

console.log('\n=== Build ready for Netlify deployment ===');
console.log('Deploy your site with the following steps:');
console.log('1. Install Netlify CLI if not installed: npm install -g netlify-cli');
console.log('2. Login to Netlify: netlify login');
console.log('3. Link this site to Netlify: netlify link');
console.log('4. Deploy the site: netlify deploy --prod');
console.log('\nOr use the Netlify web interface to deploy from your git repository.');
