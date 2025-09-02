# My Thrifting Buddy Backend v2.0

Express.js API server for AI-powered secondhand item valuation.

## Features

- **Image Analysis**: Uses OpenAI Vision API to analyze item photos
- **Enhanced Error Handling**: Comprehensive error responses and logging
- **Request Validation**: Input validation and sanitization
- **Performance Monitoring**: Request timing middleware
- **Mac Compatibility**: Fixed for cross-platform development
- **CORS Support**: Configured for multi-environment deployment

## Requirements

- Node.js 16+ (tested with 16, 18, 20)
- npm or yarn
- OpenAI API key

## Installation

```bash
npm install
```

## Configuration

Create a `.env` file in the backend directory:

```env
OPENAI_API_KEY=your_openai_api_key_here
PORT=3000
NODE_ENV=development
```

## Running the Server

### Development
```bash
npm run dev     # With nodemon for auto-reload
```

### Production
```bash
npm start       # Standard node execution
# OR with PM2
pm2 start server.js --name "prod-backend"
```

## API Endpoints

### Health Check
```
GET /health
```

Response:
```json
{
  "status": "OK",
  "timestamp": "2025-07-14T00:00:00.000Z",
  "version": "2.0",
  "features": {
    "imageAnalysis": true,
    "cameraSupport": true,
    "pasteSupport": true,
    "dragDropSupport": true,
    "enhancedAI": true
  }
}
```

### Image Analysis
```
POST /api/scan
Content-Type: multipart/form-data
```

Request:
- `image`: Image file (JPEG, PNG, etc.)

Response:
```json
{
  "success": true,
  "data": {
    "item": "Vintage Leather Jacket",
    "estimatedValue": "$45-65",
    "condition": "Good - minor wear on sleeves",
    "marketability": "High - vintage leather is in demand",
    "suggestedPrice": "$55",
    "profitPotential": "$30-40"
  }
}
```

Error Response:
```json
{
  "success": false,
  "error": "Error description"
}
```

## Middleware

1. **CORS**: Configured for production domains
2. **Body Parser**: JSON and URL-encoded support
3. **Multer**: File upload handling (10MB limit)
4. **Timing**: Request duration logging
5. **Error Handler**: Centralized error responses

## Deployment

### PM2 Deployment
```bash
# Install dependencies
npm install --production

# Start with PM2
pm2 start server.js --name "backend-prod" --env production

# Save PM2 configuration
pm2 save
pm2 startup
```

### Environment-Specific Ports
- Production: 3000 (app.flippi.ai)
- Staging: 3001 (green.flippi.ai)
- Development: 3002 (blue.flippi.ai)

## Testing

```bash
# Unit tests (when implemented)
npm test

# Manual API test
curl http://localhost:3000/health

# Test image upload
curl -X POST -F "image=@test.jpg" http://localhost:3000/api/scan
```

## Monitoring

### PM2 Monitoring
```bash
pm2 monit               # Real-time monitoring
pm2 logs backend-prod   # View logs
pm2 describe backend-prod # Detailed info
```

### Health Checks
- Endpoint: `/health`
- Expected status: 200 OK
- Check features object for capability verification

## Error Handling

All errors are logged with timestamps and return appropriate HTTP status codes:
- 400: Bad Request (missing image, invalid format)
- 413: Payload Too Large (image > 10MB)
- 500: Internal Server Error (OpenAI API issues, etc.)

## Security

- File upload limited to 10MB
- Only image MIME types accepted
- API key stored in environment variables
- CORS restricted to known domains
- No data persistence (stateless)

## Development Notes

1. Use `npm run dev` for hot-reload during development
2. Check `.env` file exists before running
3. Ensure OpenAI API key has vision model access
4. Monitor API usage to manage costs
5. Test with various image formats and sizes

## Version History

- **v2.0** (Current) - Enhanced error handling, Mac compatibility, timing middleware
- **v0.1.0** - Initial proof of concept

## License

Proprietary - All rights reserved