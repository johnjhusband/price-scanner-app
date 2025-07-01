module.exports = {
  apps: [
    {
      name: 'thrifting-buddy-api',
      script: './backend/server.js',
      instances: 'max',
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
      },
      env_staging: {
        NODE_ENV: 'staging',
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: './logs/api-error.log',
      out_file: './logs/api-out.log',
      log_file: './logs/api-combined.log',
      time: true,
    },
    {
      name: 'thrifting-buddy-mobile-web',
      script: 'npx',
      args: 'expo start --web --port 19006',
      cwd: './mobile-app',
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: 'development',
      },
      env_staging: {
        NODE_ENV: 'staging',
      },
      env_production: {
        NODE_ENV: 'production',
      },
      error_file: './logs/mobile-error.log',
      out_file: './logs/mobile-out.log',
      log_file: './logs/mobile-combined.log',
      time: true,
    },
  ],

  deploy: {
    staging: {
      user: 'deploy',
      host: 'your-staging-server.com',
      ref: 'origin/develop',
      repo: 'git@github.com:yourusername/thrifting-buddy.git',
      path: '/var/www/thrifting-buddy-staging',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env staging',
      'pre-setup': '',
    },
    production: {
      user: 'deploy',
      host: 'your-production-server.com',
      ref: 'origin/master',
      repo: 'git@github.com:yourusername/thrifting-buddy.git',
      path: '/var/www/thrifting-buddy',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production',
      'pre-setup': '',
    },
  },
};