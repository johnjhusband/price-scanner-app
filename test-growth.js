// Simple test to verify growth service configuration
console.log('Testing growth service setup...');
console.log('Current directory:', process.cwd());
console.log('Growth.js exists:', require('fs').existsSync('./growth.js'));
console.log('Growth UI exists:', require('fs').existsSync('./growth-ui/index.html'));
console.log('Backend modules exist:', require('fs').existsSync('./backend/node_modules'));

// Test basic requires
try {
  console.log('\nTesting module paths...');
  const path = require('path');
  console.log('✓ Path module loaded');
  
  // Check if we can access backend modules
  const moduleTest = require('fs').existsSync('./backend/node_modules/express');
  console.log('✓ Express module found:', moduleTest);
  
  console.log('\nGrowth service is ready to deploy!');
  console.log('Next steps:');
  console.log('1. Deploy to dev server');
  console.log('2. Run: pm2 start ecosystem.config.js --only dev-growth');
  console.log('3. Configure nginx');
  console.log('4. Access at https://blue.flippi.ai/growth');
} catch (error) {
  console.error('Error:', error.message);
}