#!/usr/bin/env node

/**
 * Test script for FotoFlip Luxe Photo feature (Issue #175)
 * Verifies that the FotoFlip API is working correctly
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const testUrl = 'https://blue.flippi.ai';

// Create a test image if it doesn't exist
function createTestImage() {
  const testImagePath = path.join(__dirname, 'test-product.jpg');
  
  if (!fs.existsSync(testImagePath)) {
    // Create a simple test image using a data URL
    const base64Image = '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wgARCABAAEADAREAAhEBAxEB/8QAGgAAAwEBAQEAAAAAAAAAAAAAAAQFBgMBB//EABoBAAMBAQEBAAAAAAAAAAAAAAIDBAEFAAb/2gAMAwEAAhADEAAAAfqgAAAAAOZ1SItyuJHUXJV8dksXqOFjpI8ysjsSTchJfZBLoT2TicR+qAAAAA//xAAiEAACAQQCAgMAAAAAAAAAAAABAgMABBESEyEiMRBBUf/aAAgBAQABBQLVaNVrHxrQWjHWLRGZiKdHCNGFjlKGExA+BgZXA+AVBClOpJ9S0e4B1YEHsGj9Qf/EAB4RAAICAQUBAAAAAAAAAAAAAAECABEDBBASITFR/9oACAEDAQE/Achyv1NCGGNbMzEKbyAWdogBJJhN+QCx5MZFxvQEXJZiOKzH6s//xAAeEQACAgICAwAAAAAAAAAAAAABAgARAxIQIRMxUf/aAAgBAgEBPwECO9hEdADRjZBsAJsahEIJJjNqLgU5GJrYxlyNrPFoxRiTE5P/xAArEAACAAUCAwgDAAAAAAAAAAABAgADESExEkEiUWEQEyAyUnGBkTNCof/aAAgBAQAGPwKXKSutzEhCaKJdD9xlg9cxJA2W8NMBIF68oWYgq1KdInzSKcJj8YpCy5YuYlyr0zhj0Ma9RuBfLQHBqRi0KzLTVI1tcnkN4+yf/8QAIxABAAIBAwQCAwAAAAAAAAAAAQARITFBUWFxkaEQgbHB4f/aAAgBAQABPyFN9F5xEU6lX0lB8nB4lqWbFcesAlrxUoUcuneXAGCmD8RUdJ7mIb7mNbA+nqZE+LdvUZsXzP8AhHb4EVcC9fEENNgjwHdcw7zEo1y7xmfEpnb6nJN6wCNQKhgxKJKU0O9Ewf8AE8T/2gAMAwEAAgADAAAAEAAAAAhbZJJwJIAAJJJbaAAAAAD/xAAcEQEBAAIDAQEAAAAAAAAAAAABABEhEDFBUXH/2gAIAQMBAT8QcNGLWJYhhsEFhCyJm8FqGbfJBZnUAhBhk6FsZeYYgGGN3K6yT//EABwRAQEAAwEBAQEAAAAAAAAAAAEAESExEEFRYf/aAAgBAgEBPxBF2R4Gi3GQYsOo0wlCEgZj8g0MfZiQEJQBOo8yR4xkZQRrNbtrg+XOVhP/xAAjEAEAAgIBBAIDAQAAAAAAAAABABEhMUFRYXGREIGhwdHh/9oACAEBAAE/EBsLJXcQAx8hABYo+WDGsxbwX4mOwx3zHLc1t47Q11DqLmGrfGJeCzNe/wBiOlcm6+mVY0Fxl6K4qsQcS7OhiDhWrJy7pqnUgNKxb4jrOEaAF+oQKxg3N/JD2n7gJiJQXBwYlEFoKPqZLq8PD1FAXQWVXS4g4Bs9o9oQgvE1xBWh7HUrqRKZYmKrRUwKOTqf/9k=';
    const imageBuffer = Buffer.from(base64Image, 'base64');
    fs.writeFileSync(testImagePath, imageBuffer);
    console.log('Created test image: test-product.jpg');
  }
  
  return testImagePath;
}

async function testFotoFlipHealth() {
  return new Promise((resolve) => {
    console.log('Testing FotoFlip health endpoint...');
    
    https.get(`${testUrl}/api/fotoflip/health`, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          const passed = result.service === 'FotoFlip' && result.status === 'healthy';
          
          console.log(`  Status: ${res.statusCode}`);
          console.log(`  Service: ${result.service}`);
          console.log(`  Health: ${result.status}`);
          console.log(`  Features:`, result.features);
          console.log(`  Result: ${passed ? 'PASS' : 'FAIL'}`);
          console.log('');
          
          resolve({ endpoint: 'health', passed, result });
        } catch (error) {
          console.log(`  Error: ${error.message}`);
          console.log(`  Result: FAIL`);
          console.log('');
          resolve({ endpoint: 'health', passed: false, error: error.message });
        }
      });
    }).on('error', (err) => {
      console.log(`  Error: ${err.message}`);
      console.log(`  Result: FAIL`);
      console.log('');
      resolve({ endpoint: 'health', passed: false, error: err.message });
    });
  });
}

async function testFotoFlipLuxePhoto() {
  return new Promise((resolve) => {
    console.log('Testing FotoFlip Luxe Photo endpoint...');
    console.log('Note: This test requires the feature to be enabled on the server');
    
    // For now, just check if the endpoint exists (returns 403 if not enabled)
    const options = {
      hostname: 'blue.flippi.ai',
      path: '/api/fotoflip/luxe-photo',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          // 403 is expected if feature not enabled, 400 is expected if no image provided
          const passed = res.statusCode === 403 || res.statusCode === 400;
          
          console.log(`  Status: ${res.statusCode}`);
          console.log(`  Response: ${result.error || result.message}`);
          console.log(`  Result: ${passed ? 'PASS (endpoint exists)' : 'FAIL'}`);
          console.log('');
          
          resolve({ endpoint: 'luxe-photo', passed, result });
        } catch (error) {
          console.log(`  Status: ${res.statusCode}`);
          console.log(`  Error: ${error.message}`);
          console.log(`  Result: FAIL`);
          console.log('');
          resolve({ endpoint: 'luxe-photo', passed: false, error: error.message });
        }
      });
    });
    
    req.on('error', (err) => {
      console.log(`  Error: ${err.message}`);
      console.log(`  Result: FAIL`);
      console.log('');
      resolve({ endpoint: 'luxe-photo', passed: false, error: err.message });
    });
    
    req.end();
  });
}

async function runTests() {
  console.log('FotoFlip Luxe Photo Test Suite');
  console.log('===============================\n');
  
  const results = [];
  
  // Test health endpoint
  results.push(await testFotoFlipHealth());
  
  // Test luxe-photo endpoint
  results.push(await testFotoFlipLuxePhoto());
  
  // Summary
  console.log('Summary');
  console.log('=======');
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  
  console.log(`Total: ${results.length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  
  if (failed > 0) {
    console.log('\nFailed tests:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  - ${r.endpoint}: ${r.error || 'test failed'}`);
    });
  }
  
  console.log('\nNote: Full testing requires:');
  console.log('1. ENABLE_LUXE_PHOTO=true in server .env');
  console.log('2. Python dependencies installed (rembg)');
  console.log('3. Optional: IMGBB_API_KEY for image hosting');
  
  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(console.error);