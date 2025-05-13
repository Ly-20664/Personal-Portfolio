// Debug script for Netlify deployment
const fs = require('fs');
const path = require('path');
require('dotenv').config();

console.log('Running Netlify deployment debug script...');

// Check environment variables
console.log('\n=== Environment Variables ===');
const requiredVars = [
  'SPOTIFY_CLIENT_ID',
  'SPOTIFY_CLIENT_SECRET',
  'SPOTIFY_REFRESH_TOKEN'
];

let allVarsPresent = true;
requiredVars.forEach(varName => {
  if (!process.env[varName]) {
    console.error(`❌ Missing required environment variable: ${varName}`);
    allVarsPresent = false;
  } else {
    const value = process.env[varName];
    // Show first 4 chars and last 4 chars for security
    const maskedValue = value.length > 12 
      ? `${value.substring(0, 4)}...${value.substring(value.length - 4)}`
      : '****'; 
    console.log(`✅ ${varName}: ${maskedValue}`);
  }
});

if (!allVarsPresent) {
  console.error('\n⚠️ Some environment variables are missing. Netlify functions will fail!');
}

// Check for Netlify functions folder structure
console.log('\n=== Netlify Functions Folder Structure ===');
const functionsDir = path.join(__dirname, 'netlify', 'functions');

if (!fs.existsSync(functionsDir)) {
  console.error(`❌ Netlify functions directory not found: ${functionsDir}`);
} else {
  console.log(`✅ Netlify functions directory found: ${functionsDir}`);
  
  // List functions
  const functions = fs.readdirSync(functionsDir)
    .filter(file => file.endsWith('.js'));
  
  if (functions.length === 0) {
    console.error('❌ No function files found in the functions directory!');
  } else {
    console.log(`Found ${functions.length} function files:`);
    functions.forEach(func => {
      console.log(`  - ${func}`);
      
      // Basic syntax check of each function file
      try {
        require(path.join(functionsDir, func));
        console.log(`    ✅ Function syntax is valid`);
      } catch (err) {
        console.error(`    ❌ Function has syntax errors: ${err.message}`);
      }
    });
  }
}

// Check netlify.toml configuration
console.log('\n=== Netlify Configuration ===');
const netlifyTomlPath = path.join(__dirname, 'netlify.toml');

if (!fs.existsSync(netlifyTomlPath)) {
  console.error('❌ netlify.toml file not found!');
} else {
  console.log('✅ netlify.toml file found');
  const tomlContent = fs.readFileSync(netlifyTomlPath, 'utf-8');
  
  // Check for required sections
  if (!tomlContent.includes('[build]')) {
    console.error('❌ Missing [build] section in netlify.toml');
  } else {
    console.log('✅ [build] section found in netlify.toml');
  }
  
  if (!tomlContent.includes('functions =')) {
    console.error('❌ Missing functions directory specification in netlify.toml');
  } else {
    console.log('✅ Functions directory is specified in netlify.toml');
  }
  
  // Check redirects for API endpoints
  const apiEndpoints = ['/api/now-playing', '/api/top-tracks', '/api/recent-tracks'];
  const missingRedirects = [];
  
  apiEndpoints.forEach(endpoint => {
    if (!tomlContent.includes(`from = "${endpoint}"`)) {
      missingRedirects.push(endpoint);
    }
  });
  
  if (missingRedirects.length > 0) {
    console.error(`❌ Missing redirects for: ${missingRedirects.join(', ')}`);
  } else {
    console.log('✅ All required API redirects are configured');
  }
}

// Check package.json for required dependencies
console.log('\n=== Package.json Dependencies ===');
const packageJsonPath = path.join(__dirname, 'package.json');

if (!fs.existsSync(packageJsonPath)) {
  console.error('❌ package.json file not found!');
} else {
  const packageJson = require(packageJsonPath);
  const requiredDeps = ['axios', 'dotenv'];
  const missingDeps = [];
  
  requiredDeps.forEach(dep => {
    if (!packageJson.dependencies[dep]) {
      missingDeps.push(dep);
    }
  });
  
  if (missingDeps.length > 0) {
    console.error(`❌ Missing required dependencies: ${missingDeps.join(', ')}`);
  } else {
    console.log('✅ All required dependencies are present in package.json');
  }
}

console.log('\n=== Debug Summary ===');
console.log('If all checks passed, your Netlify deployment should work correctly.');
console.log('If any checks failed, fix those issues before deploying.');
console.log('\nAdditional troubleshooting tips:');
console.log('1. Check that environment variables are set in Netlify dashboard');
console.log('2. Verify that functions are deployed to the correct directory');
console.log('3. Look at Netlify function logs after deployment for error details');
console.log('4. Use verbose logging in functions to troubleshoot issues');
