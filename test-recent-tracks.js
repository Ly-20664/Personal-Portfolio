// Test script specifically for recent-tracks endpoint
const fetch = require('node-fetch');

async function testRecentTracksEndpoint(url) {
  console.log(`Testing Recent Tracks endpoint: ${url}`);
  
  try {
    // First make the request
    const response = await fetch(url);
    console.log(`Response status: ${response.status} ${response.statusText}`);
    
    // Get the raw text response for debugging
    const rawText = await response.text();
    console.log("Raw response text:", rawText.substring(0, 500) + (rawText.length > 500 ? '...' : ''));
    
    // Try to detect HTML content which would cause the "Unexpected token '<'" error
    if (rawText.trim().startsWith('<')) {
      console.error("❌ ERROR: Response contains HTML content instead of JSON!");
      console.error("This is likely causing the 'Unexpected token <' error in your application.");
      
      // Try to extract error information from HTML if possible
      if (rawText.includes('<title>')) {
        const titleMatch = rawText.match(/<title>(.*?)<\/title>/i);
        if (titleMatch && titleMatch[1]) {
          console.error(`HTML page title: "${titleMatch[1]}"`);
        }
      }
      
      if (rawText.includes('Error:') || rawText.includes('<h1>Error')) {
        console.error("Possible error message in HTML:");
        // Extract text near "Error" mentions
        const errorMatches = rawText.match(/Error:?\s*([^<\n]+)/gi);
        if (errorMatches) {
          errorMatches.forEach(match => console.error(`- ${match}`));
        }
      }
      
      return;
    }
    
    // Try to parse the response as JSON
    try {
      const jsonData = JSON.parse(rawText);
      console.log("✅ Response is valid JSON");
      
      // Verify the structure expected by SpotifyDisplay component
      if (Array.isArray(jsonData)) {
        console.log(`✅ Data is an array with ${jsonData.length} items`);
        
        if (jsonData.length > 0) {
          const firstItem = jsonData[0];
          console.log("First item structure:", JSON.stringify(firstItem, null, 2));
          
          // Check for required fields
          const requiredFields = ['songID', 'artist', 'title', 'album', 'albumArt', 'uri'];
          const missingFields = requiredFields.filter(field => !firstItem.hasOwnProperty(field));
          
          if (missingFields.length === 0) {
            console.log("✅ All required fields are present");
          } else {
            console.error(`❌ Missing required fields: ${missingFields.join(', ')}`);
            console.error("This may cause rendering issues in the SpotifyDisplay component");
          }
        } else {
          console.log("ℹ️ Array is empty, this is valid but no tracks will be displayed");
        }
      } else {
        console.error("❌ Response is not an array as expected by SpotifyDisplay component");
        console.error("Data type:", typeof jsonData);
        console.error("Data preview:", JSON.stringify(jsonData).substring(0, 300));
      }
    } catch (jsonError) {
      console.error(`❌ Failed to parse response as JSON: ${jsonError.message}`);
      console.error("This explains the 'Unexpected token' error in your application");
    }
  } catch (error) {
    console.error(`❌ Request failed: ${error.message}`);
  }
}

// Test the endpoint both on development and production URLs
async function runTests() {
  // Production (Netlify) URL
  const netlifyUrl = 'https://justinly.netlify.app/.netlify/functions/recent-tracks';
  
  console.log("=== TESTING RECENT TRACKS ENDPOINT ===");
  console.log("This will help diagnose the 'Unexpected token <' error\n");
  
  await testRecentTracksEndpoint(netlifyUrl);
  
  console.log("\n=== TEST COMPLETE ===");
  console.log("If HTML was detected in the response, check:");
  console.log("1. Your Netlify environment variables (SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_REFRESH_TOKEN)");
  console.log("2. Error handling in the recent-tracks.js function");
  console.log("3. The Netlify function logs for more detailed error information");
}

// Run the tests
runTests();
