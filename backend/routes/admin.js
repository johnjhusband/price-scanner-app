// Admin routes for system maintenance
const express = require('express');
const router = express.Router();
const { exec } = require('child_process');
const path = require('path');

// Endpoint to check nginx configuration status
router.get('/nginx-status', (req, res) => {
  const port = process.env.PORT || 3000;
  let domain = 'app.flippi.ai';
  
  if (port === '3001') {
    domain = 'green.flippi.ai';
  } else if (port === '3002') {
    domain = 'blue.flippi.ai';
  }
  
  exec(`grep -E "location = /terms|location = /privacy|location /auth" /etc/nginx/sites-available/${domain} 2>/dev/null || echo "No routes found"`, (error, stdout, stderr) => {
    res.json({
      domain,
      port,
      nginxRoutes: stdout.trim(),
      hasOAuth: stdout.includes('location /auth'),
      hasLegalPages: stdout.includes('location = /terms') && stdout.includes('location = /privacy'),
      message: 'Check if OAuth and legal page routes are configured in nginx'
    });
  });
});

// Endpoint to run the nginx fix script
router.post('/fix-nginx', (req, res) => {
  // Security: Only allow from localhost or with secret key
  const secretKey = req.headers['x-admin-key'];
  const isLocalhost = req.ip === '127.0.0.1' || req.ip === '::1' || req.ip === '::ffff:127.0.0.1';
  
  if (!isLocalhost && secretKey !== process.env.ADMIN_SECRET) {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  
  const scriptPath = path.join(__dirname, '../../scripts/post-deploy-nginx.sh');
  
  exec(`bash ${scriptPath}`, (error, stdout, stderr) => {
    if (error) {
      return res.status(500).json({
        error: 'Script execution failed',
        message: error.message,
        stdout: stdout.trim(),
        stderr: stderr.trim()
      });
    }
    
    res.json({
      success: true,
      output: stdout.trim(),
      message: 'Nginx configuration script executed'
    });
  });
});

module.exports = router;