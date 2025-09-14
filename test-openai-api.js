// Test OpenAI API key and v4 usage
const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function testOpenAI() {
  try {
    console.log('Testing OpenAI API...');
    console.log('API Key present:', !!process.env.OPENAI_API_KEY);
    console.log('API Key starts with:', process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.substring(0, 10) + '...' : 'NOT SET');
    
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: "Say 'Hello, this is a test'"
        }
      ],
      max_tokens: 50,
    });

    console.log('OpenAI API Response:', response.choices[0].message.content);
    console.log('✅ OpenAI API is working!');
  } catch (error) {
    console.error('❌ OpenAI API Error:', error.message);
  }
}

testOpenAI();
