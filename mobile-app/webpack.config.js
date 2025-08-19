const createExpoWebpackConfigAsync = require('@expo/webpack-config');

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(env, argv);
  
  // Fix for React Native Web inheritance issues
  if (config.module && config.module.rules) {
    config.module.rules.forEach(rule => {
      if (rule.oneOf) {
        rule.oneOf.forEach(oneOfRule => {
          if (oneOfRule.use && oneOfRule.use.loader && oneOfRule.use.loader.includes('babel-loader')) {
            if (!oneOfRule.use.options) {
              oneOfRule.use.options = {};
            }
            if (!oneOfRule.use.options.plugins) {
              oneOfRule.use.options.plugins = [];
            }
            // Add runtime transform to fix class inheritance
            oneOfRule.use.options.plugins.push([
              '@babel/plugin-transform-runtime',
              {
                helpers: true,
                regenerator: true
              }
            ]);
          }
        });
      }
    });
  }
  
  return config;
};