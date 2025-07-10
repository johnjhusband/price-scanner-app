# My Thrifting Buddy Backend

Simple Express API that analyzes images using OpenAI Vision to provide resale price estimates.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create `.env` file with your OpenAI API key:
   ```
   OPENAI_API_KEY=your_api_key_here
   PORT=3000
   ```

3. Run the server:
   ```bash
   npm start
   ```

## API Endpoints

- `GET /health` - Health check
- `POST /api/scan` - Analyze an image
  - Accepts: multipart/form-data with 'image' field
  - Returns: JSON with item analysis and price estimates

## Development

Run with auto-reload:
```bash
npm run dev
```

## Requirements

- Node.js 18+
- OpenAI API key with vision capabilities