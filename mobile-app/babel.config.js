module.exports = function(api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', {
        jsxRuntime: 'automatic',
        web: {
          disableImportExportTransform: false
        }
      }]
    ],
    plugins: [
      // Ensure compatibility with older browsers
      '@babel/plugin-proposal-optional-chaining',
      '@babel/plugin-proposal-nullish-coalescing-operator',
      '@babel/plugin-transform-arrow-functions',
      '@babel/plugin-transform-template-literals'
    ]
  };
};