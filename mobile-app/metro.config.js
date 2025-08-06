const { getDefaultConfig } = require('expo/metro-config');

module.exports = (() => {
  const config = getDefaultConfig(__dirname);
  
  // Ensure proper browser compatibility
  config.transformer = {
    ...config.transformer,
    babelTransformerPath: require.resolve('metro-react-native-babel-transformer'),
    minifierConfig: {
      // Keep function names for better debugging
      keep_fnames: true,
      // Ensure ES5 compatibility
      ecma: 5,
      safari10: true,
      // Ensure compatibility with older browsers
      output: {
        ascii_only: true,
        quote_style: 3,
        wrap_iife: true,
        beautify: false
      },
      compress: {
        drop_console: false, // Keep console logs for debugging
        drop_debugger: true,
        pure_funcs: ['console.log']
      }
    }
  };
  
  return config;
})();