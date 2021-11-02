const { default: CommonJS } = require('./dist/logger.js');
module.exports =
  typeof process === 'object' ? CommonJS : require('./src/logger.js');