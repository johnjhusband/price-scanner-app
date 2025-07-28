const express = require('express');
const router = express.Router();
const { execSync } = require('child_process');

// Secret endpoint to force legal pages fix
router.get('/force-legal-pages-fix', (req, res) => {
  console.log('Force legal pages fix requested');
  
  try {
    const { execSync } = require('child_process');
    const scriptPath = '/var/www/app.flippi.ai/scripts/force-fix-legal-pages.sh';
    
    const output = execSync(`bash ${scriptPath} 2>&1`, { encoding: 'utf8' });
    
    res.json({
      success: true,
      message: 'Legal pages fix executed',
      output: output.substring(0, 1000)
    });
  } catch (error) {
    res.json({
      error: 'Failed to run fix',
      message: error.message
    });
  }
});

// Secret endpoint to force OAuth fix
router.get('/force-oauth-fix-now', (req, res) => {
  console.log('EMERGENCY: Force OAuth fix requested');
  
  try {
    // Only work in production
    if (process.env.PORT !== '3000') {
      return res.json({ error: 'Not production' });
    }
    
    // Check if script exists
    const scriptPath = '/var/www/app.flippi.ai/scripts/production-oauth-fix.sh';
    const fs = require('fs');
    
    if (!fs.existsSync(scriptPath)) {
      return res.json({ error: 'Script not found', path: scriptPath });
    }
    
    // Run the fix
    console.log('Running OAuth fix script...');
    const output = execSync(`bash ${scriptPath} 2>&1`, { encoding: 'utf8' });
    
    res.json({
      success: true,
      message: 'OAuth fix executed',
      output: output.substring(0, 1000)
    });
  } catch (error) {
    res.json({
      error: 'Failed to run fix',
      message: error.message,
      stderr: error.stderr ? error.stderr.toString() : null
    });
  }
});

module.exports = router;