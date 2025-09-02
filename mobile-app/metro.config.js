const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Ensure web platform is properly configured
config.resolver.platforms = ['web', 'ios', 'android'];

module.exports = config;