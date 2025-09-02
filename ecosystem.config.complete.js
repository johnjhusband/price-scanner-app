module.exports = {
  apps: [
    // Production processes
    {
      name: 'prod-backend',
      script: './backend/server.js',
      cwd: '/var/www/app.flippi.ai',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        FEEDBACK_DB_PATH: '/var/www/app.flippi.ai/backend/flippi.db'
      },
      watch: false,
      instances: 1,
      exec_mode: 'fork',
      error_file: '/var/log/pm2/prod-backend-error.log',
      out_file: '/var/log/pm2/prod-backend-out.log'
    },
    {
      name: 'prod-frontend',
      script: 'npm',
      args: 'run start:web',
      cwd: '/var/www/app.flippi.ai/mobile-app',
      env: {
        NODE_ENV: 'production',
        PORT: 4000,
        REACT_APP_API_URL: 'https://app.flippi.ai'
      },
      watch: false,
      instances: 1,
      exec_mode: 'fork',
      error_file: '/var/log/pm2/prod-frontend-error.log',
      out_file: '/var/log/pm2/prod-frontend-out.log'
    },
    
    // Staging processes  
    {
      name: 'staging-backend',
      script: './backend/server.js',
      cwd: '/var/www/green.flippi.ai',
      env: {
        NODE_ENV: 'staging',
        PORT: 3001,
        FEEDBACK_DB_PATH: '/var/www/green.flippi.ai/backend/flippi.db'
      },
      watch: false,
      instances: 1,
      exec_mode: 'fork',
      error_file: '/var/log/pm2/staging-backend-error.log',
      out_file: '/var/log/pm2/staging-backend-out.log'
    },
    {
      name: 'staging-frontend',
      script: 'npm',
      args: 'run start:web',
      cwd: '/var/www/green.flippi.ai/mobile-app',
      env: {
        NODE_ENV: 'staging',
        PORT: 4001,
        REACT_APP_API_URL: 'https://green.flippi.ai'
      },
      watch: false,
      instances: 1,
      exec_mode: 'fork',
      error_file: '/var/log/pm2/staging-frontend-error.log',
      out_file: '/var/log/pm2/staging-frontend-out.log'
    },
    
    // Development processes
    {
      name: 'dev-backend',
      script: './backend/server.js',
      cwd: '/var/www/blue.flippi.ai',
      env: {
        NODE_ENV: 'development',
        PORT: 3002,
        ENABLE_LUXE_PHOTO: 'true',
        FOTOFLIP_BG_COLOR: '#FAF6F1',
        FOTOFLIP_MODE: 'beautify',
        ENVIRONMENT: 'blue',
        FEEDBACK_DB_PATH: '/var/www/blue.flippi.ai/backend/flippi.db'
      },
      watch: false,
      instances: 1,
      exec_mode: 'fork',
      error_file: '/var/log/pm2/dev-backend-error.log',
      out_file: '/var/log/pm2/dev-backend-out.log'
    },
    {
      name: 'dev-frontend',
      script: 'npm',
      args: 'run start:web',
      cwd: '/var/www/blue.flippi.ai/mobile-app',
      env: {
        NODE_ENV: 'development',
        PORT: 4002,
        REACT_APP_API_URL: 'https://blue.flippi.ai'
      },
      watch: false,
      instances: 1,
      exec_mode: 'fork',
      error_file: '/var/log/pm2/dev-frontend-error.log',
      out_file: '/var/log/pm2/dev-frontend-out.log'
    }
  ]
};