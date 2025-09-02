// Custom body parser configuration to ensure limits are applied
const bodyParser = require('body-parser');

// Create parsers with explicit limits
const jsonParser = bodyParser.json({
  limit: '50mb',
  parameterLimit: 50000,
  type: 'application/json'
});

const urlencodedParser = bodyParser.urlencoded({
  limit: '50mb',
  parameterLimit: 50000,
  extended: true
});

// Logging middleware to debug body parsing
const bodyParserLogger = (req, res, next) => {
  if (req.url.startsWith('/api/feedback')) {
  }
  next();
};

module.exports = {
  jsonParser,
  urlencodedParser,
  bodyParserLogger
};