// Test script for Netlify functions
const fetch = require('node-fetch');

async function testEndpoint(endpoint) {
  try {
    console.log(`Testing endpoint: ${endpoint}`);
    const response = await fetch(endpoint);
    console.log(`Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.text();
      console.log("Response data:", data);
      
      try {
        // Try parsing as JSON
        const jsonData = JSON.parse(data);
        console.log("✅ Valid JSON response");
        if (Array.isArray(jsonData)) {
          console.log(`Array with ${jsonData.length} items`);
          if (jsonData.length > 0) {
            console.log("First item sample:", JSON.stringify(jsonData[0], null, 2));
          }
        } else {
          console.log("Response is an object:", Object.keys(jsonData));
        }
      } catch (jsonError) {
        console.error("❌ Invalid JSON response:", jsonError.message);
      }
    } else {
      console.error(`❌ Error response: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error("Error details:", errorText);
    }
  } catch (error) {
    console.error("❌ Request failed:", error.message);
  }
}

// Test all endpoints
async function runTests() {
  const baseUrl = 'https://justinly.netlify.app/.netlify/functions';
  
  console.log("=== NETLIFY FUNCTIONS TEST ===");
  await testEndpoint(`${baseUrl}/spotify-test`);
  console.log("\n----------------------------\n");
  await testEndpoint(`${baseUrl}/now-playing`);
  console.log("\n----------------------------\n");
  await testEndpoint(`${baseUrl}/recent-tracks`);
  
  console.log("\nTests completed!");
}

runTests();
