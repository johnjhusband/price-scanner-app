const express = require('express');
const router = express.Router();
const { exec } = require('child_process');
const crypto = require('crypto');

// Deploy endpoint - triggers deployment when called
// This allows us to trigger deployments programmatically
router.post('/trigger/:environment', (req, res) => {
  const { environment } = req.params;
  const { token } = req.body;
  
  // Simple token validation (in production, use proper auth)
  const validToken = crypto.createHash('sha256').update('flippi-deploy-2025').digest('hex');
  
  if (token !== validToken) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  // Only allow specific environments
  if (!['production', 'staging', 'develop'].includes(environment)) {
    return res.status(400).json({ error: 'Invalid environment' });
  }
  
  // Map environment to branch
  const branchMap = {
    production: 'master',
    staging: 'staging',
    develop: 'develop'
  };
  
  const branch = branchMap[environment];
  const domain = environment === 'production' ? 'app' : 
                 environment === 'staging' ? 'green' : 'blue';
  
  // Execute deployment commands
  const deployScript = `
    cd /var/www/${domain}.flippi.ai
    git fetch origin
    git reset --hard origin/${branch}
    git clean -fd
    cd backend && npm install --production
    cd ../mobile-app && npm install && npx expo export --platform web --output-dir dist
    pm2 restart ${environment === 'production' ? 'prod' : environment}-backend ${environment === 'production' ? 'prod' : environment}-frontend
    nginx -s reload
  `;
  
  exec(deployScript, (error, stdout, stderr) => {
    if (error) {
      console.error('Deployment error:', error);
      return res.status(500).json({ 
        error: 'Deployment failed', 
        details: stderr 
      });
    }
    
    res.json({
      success: true,
      environment,
      branch,
      domain: `${domain}.flippi.ai`,
      output: stdout
    });
  });
});

// Health check for deploy service
router.get('/health', (req, res) => {
  res.json({
    status: 'Deploy service ready',
    environments: ['production', 'staging', 'develop']
  });
});

module.exports = router;