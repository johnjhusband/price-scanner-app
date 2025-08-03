// Check if nginx is properly configured for legal pages
// This runs when the server starts to log configuration status

const { execSync } = require('child_process');
const fs = require('fs');

function checkNginxConfig() {
  console.log('\n=== NGINX CONFIGURATION CHECK ===');
  
  // Detect environment
  const port = process.env.PORT || 3000;
  let domain = 'app.flippi.ai';
  
  if (port === '3001') {
    domain = 'green.flippi.ai';
  } else if (port === '3002') {
    domain = 'blue.flippi.ai';
  }
  
  console.log(`Environment: ${domain} (port ${port})`);
  
  try {
    // Check if nginx config file exists
    const nginxConfigPath = `/etc/nginx/sites-available/${domain}`;
    
    if (fs.existsSync(nginxConfigPath)) {
      const config = fs.readFileSync(nginxConfigPath, 'utf8');
      
      // Check for OAuth routes
      if (config.includes('location /auth')) {
        console.log('✓ OAuth routes configured in nginx');
      } else {
        console.log('✗ OAuth routes MISSING from nginx');
        console.log('  OAuth login will not work properly!');
      }
      
      // Check for legal pages routes
      if (config.includes('location = /terms') && config.includes('location = /privacy')) {
        console.log('✓ Legal pages routes configured in nginx');
      } else {
        console.log('✗ Legal pages routes MISSING from nginx');
        console.log('  Terms and Privacy pages will show React app instead!');
        console.log('');
        console.log('  TO FIX: Run this command on the server:');
        console.log(`  sudo bash /var/www/${domain}/scripts/post-deploy-nginx.sh`);
      }
    } else {
      console.log(`✗ Nginx config not found at ${nginxConfigPath}`);
    }
  } catch (error) {
    console.log('  Could not check nginx config (may not have permissions)');
  }
  
  // Test endpoints
  console.log('\nTesting endpoints:');
  
  const endpoints = [
    { path: '/health', expected: '200' },
    { path: '/auth/google', expected: '302' },
    { path: '/terms', expected: '200' },
    { path: '/privacy', expected: '200' }
  ];
  
  endpoints.forEach(({ path, expected }) => {
    try {
      const result = execSync(
        `curl -s -o /dev/null -w "%{http_code}" http://localhost:${port}${path}`,
        { encoding: 'utf8' }
      ).trim();
      
      if (result === expected) {
        console.log(`  ✓ ${path} returns ${result}`);
      } else {
        console.log(`  ✗ ${path} returns ${result} (expected ${expected})`);
      }
    } catch (error) {
      console.log(`  ✗ ${path} failed to respond`);
    }
  });
  
  console.log('=================================\n');
}

module.exports = checkNginxConfig;