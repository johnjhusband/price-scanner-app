module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Fix for React Native Web class inheritance issues
      ['@babel/plugin-transform-runtime', {
        helpers: true,
        regenerator: true,
        version: '7.28.3'
      }]
    ]
  };
};