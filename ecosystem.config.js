module.exports = {
  apps: [
    {
      name: 'dev-backend',
      script: './backend/server.js',
      cwd: '/var/www/blue.flippi.ai',
      env: {
        NODE_ENV: 'development',
        PORT: 3002
      },
      watch: false,
      instances: 1,
      exec_mode: 'fork'
    }
  ]
};