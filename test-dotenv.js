const path = require('path');
require('dotenv').config({ path: '/nonexistent/path/.env' });
console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY);
console.log('Script continues running...');
