# Flippi.ai API Documentation - v2.0

## Base URLs
- Production: `https://app.flippi.ai`
- Staging: `https://green.flippi.ai`
- Development: `https://blue.flippi.ai`
- Local: `http://localhost:3000`

## Authentication

### Public Endpoints
- GET /health - Health check
- POST /api/scan - Image analysis (optionally authenticated for history)
- POST /api/auth/signup - Create new account
- POST /api/auth/login - Login to existing account
- GET /api/auth/verify - Verify JWT token

### Protected Endpoints
All other endpoints require JWT authentication:
- Authorization: Bearer {token}

### JWT Token Format
```json
{
  "userId": 123,
  "email": "user@example.com",
  "exp": 1234567890
}
```

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
- Field: `description` (optional) - Text description of the item
- Max file size: 10MB
- Supported formats: JPEG, PNG, GIF, WebP, HEIC, HEIF

**Success Response:**
```json
{
  "success": true,
  "data": {
    "item_name": "Vintage Leather Jacket",
    "price_range": "$45-65",
    "style_tier": "Designer",
    "recommended_platform": "The RealReal",
    "condition": "Good - minor wear on sleeves",
    "authenticity_score": "85%",
    "boca_score": "72",
    "buy_price": "$11",
    "resale_average": "$55",
    "market_insights": "Vintage leather is trending...",
    "selling_tips": "Highlight the vintage aspects...",
    "brand_context": "This appears to be from...",
    "seasonal_notes": "Best selling season is fall..."
  },
  "processing": {
    "fileSize": 57046,
    "processingTime": 2341,
    "version": "2.0"
  }
}
```

**Response Fields:**
- `item_name`: Description of the identified item
- `price_range`: Estimated resale value range
- `style_tier`: Category (Entry/Designer/Luxury)
- `recommended_platform`: Best platform for selling
- `condition`: Detailed condition assessment
- `authenticity_score`: Likelihood of authenticity (0-100%)
- `boca_score`: Sellability score (0-100)
- `buy_price`: Recommended purchase price
- `resale_average`: Average resale value
- `market_insights`: Current market trends
- `selling_tips`: Optimization suggestions
- `brand_context`: Brand information and history
- `seasonal_notes`: Seasonal selling advice

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

### 3. Authentication

#### POST /api/auth/signup
Create a new user account.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123"
}
```

**Success Response:**
```json
{
  "success": true,
  "message": "User created successfully",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "email": "user@example.com"
  }
}
```

**Password Requirements:**
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number

#### POST /api/auth/login
Login to existing account.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123"
}
```

**Success Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "email": "user@example.com"
  }
}
```

#### GET /api/auth/verify
Verify JWT token validity.

**Headers:**
```
Authorization: Bearer {token}
```

**Success Response:**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "email": "user@example.com"
  }
}
```

### 4. Scan History (Protected)

#### GET /api/scan-history
Get user's scan history with pagination.

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 20)

**Success Response:**
```json
{
  "success": true,
  "data": {
    "scans": [
      {
        "id": 1,
        "item_name": "Vintage Leather Jacket",
        "price_range": "$45-65",
        "style_tier": "Designer",
        "recommended_platform": "The RealReal",
        "authenticity_score": "85%",
        "boca_score": "72",
        "buy_price": "$11",
        "created_at": "2025-07-23T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "totalPages": 3
    }
  }
}
```

#### GET /api/scan-history/:id
Get specific scan details.

#### DELETE /api/scan-history/:id
Delete a scan from history.

### 5. Analytics (Protected)

#### GET /api/analytics/summary
Get scanning summary and statistics.

**Success Response:**
```json
{
  "success": true,
  "data": {
    "totalScans": 150,
    "platformStats": [
      {
        "platform": "eBay",
        "count": 45,
        "avg_boca_score": 68
      }
    ],
    "styleTierStats": [
      {
        "style_tier": "Designer",
        "count": 80,
        "avg_resale_value": 120
      }
    ],
    "highValueFinds": [...],
    "scanTrends": [...]
  }
}
```

#### GET /api/analytics/search
Search scan history with filters.

**Query Parameters:**
- `q` - Search query (searches item name, insights, tips, etc.)
- `platform` - Filter by platform
- `style_tier` - Filter by style tier
- `min_price` - Minimum price filter
- `max_price` - Maximum price filter
- `sort` - Sort field (created_at, item_name, boca_score, resale_average)
- `order` - Sort order (ASC, DESC)
- `page` - Page number
- `limit` - Results per page

#### GET /api/analytics/export
Export scan history as CSV file.

**Response:**
- Content-Type: text/csv
- Downloads a CSV file with all user's scan history

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

// Analyze image with optional description
const formData = new FormData();
formData.append('image', fileInput.files[0]);
formData.append('description', 'Vintage leather jacket from the 1970s'); // optional

try {
  const response = await fetch('https://app.flippi.ai/api/scan', {
    method: 'POST',
    body: formData
  });
  
  const result = await response.json();
  
  if (result.success) {
    console.log('Item:', result.data.item_name);
    console.log('Price Range:', result.data.price_range);
    console.log('Buy Price:', result.data.buy_price);
    console.log('Platform:', result.data.recommended_platform);
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
const pickAndAnalyze = async (description = '') => {
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
    
    if (description) {
      formData.append('description', description);
    }

    const response = await fetch('https://app.flippi.ai/api/scan', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    // Handle response - data.data contains all analysis fields
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

### v2.1 (Current)
- Added JWT authentication system
- Implemented user registration and login
- Added scan history tracking for authenticated users
- Created analytics endpoints with search and export
- Enhanced database with users and scan_history tables

### v2.0
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

- ~~User authentication (JWT)~~ ✓ Implemented
- ~~Scan history endpoints~~ ✓ Implemented
- ~~Analytics and search~~ ✓ Implemented
- Batch image processing
- WebSocket support for real-time updates
- GraphQL endpoint
- Rate limiting
- API key authentication
- Webhook notifications
- Email verification
- Password reset functionality
- OAuth integration (Google, Facebook)
- Admin dashboard endpoints

## Support

For API issues or questions:
- Check service status: https://app.flippi.ai/health
- GitHub Issues: [Repository URL]
- Email: support@flippi.ai