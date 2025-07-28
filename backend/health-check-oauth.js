// Emergency OAuth check that runs on health endpoint
const { execSync } = require('child_process');
const fs = require('fs');

module.exports = function checkOAuth() {
  try {
    // Only run in production
    if (process.env.PORT !== '3000') return;
    
    // Check if we've already tried
    const flagFile = '/tmp/oauth-fix-attempted';
    if (fs.existsSync(flagFile)) return;
    
    // Check if nginx has OAuth configured
    const nginxConfig = execSync('cat /etc/nginx/sites-available/app.flippi.ai 2>/dev/null || echo ""', { encoding: 'utf8' });
    
    if (!nginxConfig.includes('location /auth')) {
      console.log('EMERGENCY: OAuth not configured - attempting fix...');
      
      // Create flag file
      fs.writeFileSync(flagFile, new Date().toISOString());
      
      // Try to run the fix
      try {
        execSync('bash /var/www/app.flippi.ai/scripts/production-oauth-fix.sh 2>&1', { stdio: 'inherit' });
        console.log('OAuth fix applied!');
      } catch (e) {
        console.log('Could not apply OAuth fix automatically');
      }
    }
  } catch (error) {
    // Silently fail if not on server
  }
};