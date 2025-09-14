// Test OpenAI v4 import and usage
const { Configuration, OpenAIApi } = require('openai');

console.log('Testing OpenAI v3 import...');
console.log('Configuration:', typeof Configuration);
console.log('OpenAIApi:', typeof OpenAIApi);

// Test v4 import
const OpenAI = require('openai');
console.log('Testing OpenAI v4 import...');
console.log('OpenAI:', typeof OpenAI);

// Test v4 usage
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'test-key'
});
console.log('OpenAI v4 instance created successfully');
