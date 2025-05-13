// Test script that verifies the recent-tracks function doesn't throw errors

const axios = require('axios');
require('dotenv').config();

// Function to test the local recent-tracks function
async function testRecentTracksFunction() {
  console.log('=== TESTING RECENT-TRACKS FUNCTION DIRECTLY ===');
  
  try {
    // Import the function handler
    const { handler } = require('./netlify/functions/recent-tracks');
    
    console.log('Invoking recent-tracks handler...');
    
    // Create a mock event object
    const mockEvent = {
      httpMethod: 'GET',
      headers: {
        accept: 'application/json'
      }
    };
    
    // Invoke the handler
    const response = await handler(mockEvent, {});
    
    console.log(`Response status: ${response.statusCode}`);
    console.log(`Headers: ${JSON.stringify(response.headers)}`);
    
    // Try to parse the response body
    try {
      const bodyData = JSON.parse(response.body);
      
      console.log(`Response body parsed successfully`);
      
      if (Array.isArray(bodyData)) {
        console.log(`✅ Body is a valid array with ${bodyData.length} items`);
        
        if (bodyData.length > 0) {
          console.log('First track data:', bodyData[0]);
        } else {
          console.log('Array is empty, but that\'s still valid JSON');
        }
      } else {
        console.log(`❌ Body is not an array as expected:`, typeof bodyData);
      }
    } catch (parseError) {
      console.error(`❌ Failed to parse response body: ${parseError.message}`);
      console.error('Raw body:', response.body.substring(0, 200) + '...');
    }
  } catch (error) {
    console.error(`❌ Function execution failed: ${error.message}`);
    if (error.stack) {
      console.error(error.stack);
    }
  }
}

// Run the test
testRecentTracksFunction().then(() => {
  console.log('Test completed');
}).catch(err => {
  console.error('Test failed:', err);
});
