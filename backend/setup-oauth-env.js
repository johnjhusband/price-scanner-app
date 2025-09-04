const fs = require('fs');
const path = require('path');

const sharedEnvPath = '/var/www/shared/.env';
const credentials = {
  GOOGLE_CLIENT_ID: '54703081262-jfcfm1h0jiljenmmrg59kjv0cfta2hdu.apps.googleusercontent.com',
  GOOGLE_CLIENT_SECRET: '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',
  JWT_SECRET: 'flippi-jwt-secret-2025-blue-environment'
};

// Create shared directory if needed
const sharedDir = path.dirname(sharedEnvPath);
if (!fs.existsSync(sharedDir)) {
  fs.mkdirSync(sharedDir, { recursive: true });
}

// Read existing env or create new
let envContent = '';
if (fs.existsSync(sharedEnvPath)) {
  envContent = fs.readFileSync(sharedEnvPath, 'utf8');
}

// Check if OAuth already configured
if (envContent.includes('GOOGLE_CLIENT_ID=54703081262')) {
  process.exit(0);
}

// Remove old OAuth entries
const lines = envContent.split('\n').filter(line => 
  !line.startsWith('GOOGLE_CLIENT_ID=') && 
  !line.startsWith('GOOGLE_CLIENT_SECRET=') && 
  !line.startsWith('JWT_SECRET=')
);

// Add new OAuth entries
lines.push('');
lines.push('GOOGLE_CLIENT_ID=' + credentials.GOOGLE_CLIENT_ID);
lines.push('GOOGLE_CLIENT_SECRET=' + credentials.GOOGLE_CLIENT_SECRET);
lines.push('JWT_SECRET=' + credentials.JWT_SECRET);

// Write back
fs.writeFileSync(sharedEnvPath, lines.join('\n'));