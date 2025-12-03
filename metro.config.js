const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Ensure Firebase modules are properly resolved
config.resolver.sourceExts.push('cjs', 'mjs');

module.exports = config;

