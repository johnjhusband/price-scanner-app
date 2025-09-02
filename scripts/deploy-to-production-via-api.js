#!/usr/bin/env node

// This script triggers a production deployment using GitHub API
// It works around the workflow file restriction by using the API

const https = require('https');

// GitHub repository details
const owner = 'johnjhusband';
const repo = 'price-scanner-app';
const workflow_id = 'deploy-production.yml';

// You need to set GITHUB_TOKEN environment variable
const token = process.env.GITHUB_TOKEN;

if (!token) {
  console.error('Error: GITHUB_TOKEN environment variable is required');
  console.error('Create a personal access token at: https://github.com/settings/tokens');
  console.error('Then run: export GITHUB_TOKEN=your_token_here');
  process.exit(1);
}

// Trigger workflow dispatch
const data = JSON.stringify({
  ref: 'master',
  inputs: {}
});

const options = {
  hostname: 'api.github.com',
  path: `/repos/${owner}/${repo}/actions/workflows/${workflow_id}/dispatches`,
  method: 'POST',
  headers: {
    'Authorization': `token ${token}`,
    'Accept': 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
    'Content-Length': data.length,
    'User-Agent': 'Flippi-Deploy-Script'
  }
};

console.log('Triggering production deployment...');

const req = https.request(options, (res) => {
  let body = '';
  
  res.on('data', (chunk) => {
    body += chunk;
  });
  
  res.on('end', () => {
    if (res.statusCode === 204) {
      console.log('✅ Production deployment triggered successfully!');
      console.log('Check progress at: https://github.com/johnjhusband/price-scanner-app/actions');
    } else {
      console.error(`❌ Failed to trigger deployment: ${res.statusCode}`);
      if (body) {
        console.error('Response:', body);
      }
    }
  });
});

req.on('error', (e) => {
  console.error('Request failed:', e);
});

req.write(data);
req.end();