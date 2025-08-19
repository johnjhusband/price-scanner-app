# ⚠️ OPENAI API KEY REQUIRED

The backend server needs a valid OpenAI API key to work.

## How to fix:

1. Get your OpenAI API key from: https://platform.openai.com/api-keys
2. Edit `backend/.env`
3. Replace `sk-proj-REPLACE-THIS-WITH-YOUR-ACTUAL-KEY` with your actual key
4. Restart the server

## Example:
```
OPENAI_API_KEY=sk-proj-abcdef123456789...
```

Without a valid API key, the `/api/scan` endpoint will fail with "invalid_api_key" error.