# My Thrifting Buddy API Documentation - v2.0

## Base URLs
- Production: `https://app.flippi.ai`
- Staging: `https://green.flippi.ai`
- Development: `https://blue.flippi.ai`
- Local: `http://localhost:3000`

## Authentication
None - API is open access (no authentication required)

## Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message"
}
```

## Endpoints

### 1. Health Check

#### GET /health
Comprehensive health check with feature status.

**Response:**
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

**Status Codes:**
- 200: Service healthy
- 503: Service unavailable

### 2. Image Analysis

#### POST /api/scan
Analyze an image to get detailed resale price estimates using OpenAI Vision.

**Request:**
- Method: POST
- Content-Type: multipart/form-data
- Field: `image` (required) - Image file
- Max file size: 10MB
- Supported formats: JPEG, PNG, GIF, WebP

**Success Response:**
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

**Response Fields:**
- `item`: Description of the identified item
- `estimatedValue`: Price range for resale
- `condition`: Detailed condition assessment
- `marketability`: How well the item will sell
- `suggestedPrice`: Recommended listing price
- `profitPotential`: Expected profit after costs

**Error Responses:**

400 Bad Request:
```json
{
  "success": false,
  "error": "No image file provided"
}
```

413 Payload Too Large:
```json
{
  "success": false,
  "error": "File size exceeds 10MB limit"
}
```

500 Internal Server Error:
```json
{
  "success": false,
  "error": "Failed to analyze image"
}
```

## Request Headers

### Required Headers
- None (CORS headers handled automatically)

### Optional Headers
- `X-Request-ID`: Client-provided request tracking ID

## CORS Configuration

The API accepts requests from:
- Production: https://app.flippi.ai
- Staging: https://green.flippi.ai
- Development: https://blue.flippi.ai
- Local development: http://localhost:*

## Rate Limiting
Currently no rate limiting implemented. Future versions will include:
- 100 requests per minute per IP
- 1000 requests per hour per IP

## Error Handling

### HTTP Status Codes
- **200 OK**: Request successful
- **400 Bad Request**: Invalid input (missing image, wrong format)
- **413 Payload Too Large**: File exceeds 10MB
- **500 Internal Server Error**: Server or OpenAI API error
- **503 Service Unavailable**: Service temporarily down

### Error Response Format
All errors return consistent JSON:
```json
{
  "success": false,
  "error": "Human-readable error message"
}
```

## Example Usage

### cURL Examples

**Health Check:**
```bash
curl https://app.flippi.ai/health
```

**Analyze Image:**
```bash
curl -X POST https://app.flippi.ai/api/scan \
  -F "image=@vintage-jacket.jpg"
```

### JavaScript (Fetch API)
```javascript
// Health check
const health = await fetch('https://app.flippi.ai/health');
const status = await health.json();
console.log(status.version); // "2.0"

// Analyze image
const formData = new FormData();
formData.append('image', fileInput.files[0]);

try {
  const response = await fetch('https://app.flippi.ai/api/scan', {
    method: 'POST',
    body: formData
  });
  
  const result = await response.json();
  
  if (result.success) {
    console.log('Item:', result.data.item);
    console.log('Value:', result.data.estimatedValue);
  } else {
    console.error('Error:', result.error);
  }
} catch (error) {
  console.error('Network error:', error);
}
```

### React Native Example
```javascript
import * as ImagePicker from 'expo-image-picker';

// Pick and analyze image
const pickAndAnalyze = async () => {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.8,
  });

  if (!result.canceled) {
    const formData = new FormData();
    formData.append('image', {
      uri: result.assets[0].uri,
      name: 'photo.jpg',
      type: 'image/jpeg',
    });

    const response = await fetch('https://app.flippi.ai/api/scan', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    // Handle response
  }
};
```

## Performance

- Average response time: < 3 seconds
- Max file processing: 10MB
- Concurrent requests: Unlimited (no queuing)
- Timeout: 30 seconds

## Security Considerations

1. **HTTPS Only**: Production endpoints require HTTPS
2. **Input Validation**: File type and size validated
3. **No Data Storage**: Images processed in memory only
4. **API Key Security**: OpenAI key stored in environment variables
5. **CORS Protection**: Restricted to known domains

## Versioning

Current version: 2.0

API version included in health check response. Future versions will support version headers.

## Changelog

### v2.0 (Current)
- Enhanced error handling and validation
- Added comprehensive health endpoint
- Improved response format consistency
- Added request timing middleware
- Mac compatibility fixes
- Better CORS configuration

### v0.1.0
- Initial release
- Basic image analysis
- Simple health check

## Future Enhancements

- User authentication (JWT)
- Scan history endpoints
- Batch image processing
- WebSocket support for real-time updates
- GraphQL endpoint
- Rate limiting
- API key authentication
- Webhook notifications

## Support

For API issues or questions:
- Check service status: https://app.flippi.ai/health
- GitHub Issues: [Repository URL]
- Email: support@flippi.ai