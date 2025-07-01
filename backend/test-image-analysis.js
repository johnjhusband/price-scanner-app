const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const axios = require('axios');

const SERVER_URL = 'http://localhost:8000';

async function testImageAnalysis(imagePath) {
  try {
    console.log('🧪 Testing Price Scanner Backend...');
    console.log(`📁 Image path: ${imagePath}`);

    // Check if image file exists
    if (!fs.existsSync(imagePath)) {
      throw new Error(`Image file not found: ${imagePath}`);
    }

    // Create form data
    const form = new FormData();
    form.append('image', fs.createReadStream(imagePath));

    console.log('📤 Sending image to backend...');

    // Send request to backend
    const response = await axios.post(`${SERVER_URL}/api/scan`, form, {
      headers: {
        ...form.getHeaders(),
      },
      timeout: 30000 // 30 second timeout
    });

    console.log('✅ Success! Analysis results:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(JSON.stringify(response.data, null, 2));
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Extract key information
    if (response.data.analysis) {
      console.log('\n📊 Key Results:');
      console.log(`🏷️  Item: ${response.data.analysis.item_identification || 'Unknown'}`);
      console.log(`💰 Estimated Value: ${response.data.analysis.price_range || 'Not determined'}`);
      console.log(`⭐ Condition: ${response.data.analysis.condition_assessment || 'Not assessed'}`);
    }

  } catch (error) {
    console.error('❌ Test failed:');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Response:`, error.response.data);
    } else if (error.request) {
      console.error('No response received. Is the server running?');
      console.error('Start the server with: npm start');
    } else {
      console.error('Error:', error.message);
    }
  }
}

// Function to test server health first
async function testServerHealth() {
  try {
    console.log('🏥 Checking server health...');
    const response = await axios.get(`${SERVER_URL}/health`, { timeout: 5000 });
    console.log('✅ Server is running and healthy');
    return true;
  } catch (error) {
    console.error('❌ Server health check failed');
    console.error('Make sure the backend server is running: npm start');
    return false;
  }
}

// Main function
async function main() {
  // Get image path from command line argument
  const imagePath = process.argv[2];
  
  if (!imagePath) {
    console.log('Usage: node test-image-analysis.js <path-to-image>');
    console.log('Example: node test-image-analysis.js ./test-images/shirt.jpg');
    process.exit(1);
  }

  // Check server health first
  const serverHealthy = await testServerHealth();
  if (!serverHealthy) {
    process.exit(1);
  }

  // Test image analysis
  await testImageAnalysis(imagePath);
}

// Run the test
main(); 