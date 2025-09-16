module.exports = {
  apps: [
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
        OPENAI_API_KEY: process.env.OPENAI_API_KEY,
        FOTOFLIP_PYTHON: process.env.FOTOFLIP_PYTHON || '/var/www/blue.flippi.ai/.venv/bin/python',
        GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
        GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
      },
      watch: false,
      instances: 1,
      exec_mode: 'fork'
    },
    {
      name: 'dev-growth',
      script: './growth.js',
      cwd: '/var/www/blue.flippi.ai',
      env: {
        NODE_ENV: 'development',
        GROWTH_PORT: 3003,
        ENABLE_REDDIT_AUTOMATION: 'true',
        REDDIT_AUTOMATION_INTERVAL: '30'
      },
      watch: false,
      instances: 1,
      exec_mode: 'fork'
    }
  ]
};