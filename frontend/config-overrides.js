module.exports = function override(config) {
  config.resolve = config.resolve || {};
  config.resolve.fallback = {
    ...(config.resolve.fallback || {}),
    fs: false,
  };
  config.ignoreWarnings = [
    ...(config.ignoreWarnings || []),
    /Failed to parse source map.*face-api\.js/,
  ];

  return config;
};
