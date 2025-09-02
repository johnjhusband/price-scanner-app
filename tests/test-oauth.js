#!/usr/bin/env node

/**
 * Test script for Google OAuth integration (Issue #84)
 * Verifies OAuth endpoints are accessible
 */

const https = require('https');

const testUrl = 'https://blue.flippi.ai';

async function testOAuthEndpoint(endpoint) {
  return new Promise((resolve) => {
    const fullUrl = `${testUrl}${endpoint}`;
    console.log(`Testing ${fullUrl}...`);
    
    https.get(fullUrl, { 
      timeout: 10000,
      headers: {
        'User-Agent': 'OAuth-Test/1.0'
      }
    }, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        // For OAuth endpoints, we expect either:
        // - 302 redirect (to Google)
        // - 401 unauthorized
        // - 200 with error message
        // NOT 502 Bad Gateway
        
        const isValidResponse = res.statusCode !== 502 && res.statusCode !== 503;
        
        console.log(`  Status: ${res.statusCode}`);
        console.log(`  Headers: ${JSON.stringify(res.headers.location || 'No redirect')}`);
        console.log(`  Result: ${isValidResponse ? 'PASS' : 'FAIL (502/503 indicates backend issue)'}`);
        console.log('');
        
        resolve({
          endpoint,
          statusCode: res.statusCode,
          passed: isValidResponse,
          headers: res.headers
        });
      });
    }).on('error', (err) => {
      console.error(`  Error: ${err.message}`);
      console.log(`  Result: FAIL`);
      console.log('');
      resolve({
        endpoint,
        statusCode: 0,
        error: err.message,
        passed: false
      });
    });
  });
}

async function testAuthRoutes() {
  return new Promise((resolve) => {
    console.log('Testing backend auth route availability...');
    
    https.get(`${testUrl}/api/auth/test`, (res) => {
      const passed = res.statusCode !== 502 && res.statusCode !== 503;
      
      console.log(`  Backend /api/auth route:`);
      console.log(`  Status: ${res.statusCode}`);
      console.log(`  Result: ${passed ? 'PASS' : 'FAIL (backend not responding)'}`);
      console.log('');
      
      resolve({
        endpoint: '/api/auth',
        statusCode: res.statusCode,
        passed
      });
    }).on('error', (err) => {
      console.log(`  Error: ${err.message}`);
      console.log(`  Result: FAIL`);
      console.log('');
      resolve({
        endpoint: '/api/auth',
        error: err.message,
        passed: false
      });
    });
  });
}

async function runTests() {
  console.log('Google OAuth Test Suite');
  console.log('=======================\n');
  
  const results = [];
  
  // Test OAuth endpoints
  results.push(await testOAuthEndpoint('/auth/google'));
  results.push(await testOAuthEndpoint('/auth/google/callback'));
  results.push(await testAuthRoutes());
  
  // Summary
  console.log('Summary');
  console.log('=======');
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  
  console.log(`Total: ${results.length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  
  if (failed > 0) {
    console.log('\nFailed endpoints:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  - ${r.endpoint} (${r.error || `status ${r.statusCode}`})`);
    });
    
    console.log('\nPossible causes:');
    console.log('- Backend not running (check pm2 status)');
    console.log('- Nginx misconfiguration (check /auth proxy_pass)');
    console.log('- Missing OAuth credentials in .env');
    console.log('- Port mismatch (backend should be on 3002)');
  }
  
  console.log('\nNote: Full OAuth testing requires:');
  console.log('1. GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env');
  console.log('2. Correct redirect URIs in Google Cloud Console');
  console.log('3. Backend running on correct port (3002)');
  console.log('4. Nginx properly configured to proxy /auth routes');
  
  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(console.error);