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
      },
      watch: false,
      instances: 1,
      exec_mode: 'fork'
    }
  ]
};