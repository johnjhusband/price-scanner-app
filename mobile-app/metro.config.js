const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Ensure web platform is properly configured
config.resolver.platforms = ['web', 'ios', 'android'];

// Fix for React Native Web inheritance issues
config.transformer = {
  ...config.transformer,
  babelTransformerPath: require.resolve('./metro-transformer.js')
};

module.exports = config;