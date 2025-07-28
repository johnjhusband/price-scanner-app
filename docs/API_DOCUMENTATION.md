# Flippi.ai API Documentation - v2.0

## Base URLs
- Production: `https://app.flippi.ai`
- Staging: `https://green.flippi.ai`
- Development: `https://blue.flippi.ai`
- Local: `http://localhost:3000`

## Authentication

### Public Endpoints
- `/health` - No authentication required
- `/auth/google` - OAuth initiation
- `/auth/google/callback` - OAuth callback

### Protected Endpoints
All other endpoints require JWT authentication via cookies set during OAuth login.

## Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "processing": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "hint": "Helpful suggestion"
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
  "timestamp": "2025-07-26T00:00:00.000Z",
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

### 2. OAuth Authentication

#### GET /auth/google
Initiates Google OAuth login flow.

**Response:**
- Redirects to Google OAuth consent screen

#### GET /auth/google/callback
Handles OAuth callback from Google.

**Query Parameters:**
- `code`: Authorization code from Google

**Response:**
- Success: Redirects to app with JWT cookie set
- Failure: Redirects to login page with error

**Cookies Set:**
- `token`: JWT token (httpOnly, secure in production)

### 3. Image Analysis (Protected)

#### POST /api/scan
Analyze an image to get detailed resale price estimates using GPT-4o-mini vision.

**Authentication:** Required (JWT cookie)

**Request:**
- Method: POST
- Content-Type: multipart/form-data
- Fields:
  - `image` (required) - Image file
  - `description` (optional) - Text description of item
- Max file size: 10MB
- Supported formats: JPEG, PNG, GIF, WebP

**Success Response:**
```json
{
  "success": true,
  "data": {
    "item_name": "Vintage Leather Jacket",
    "price_range": "$45-65",
    "style_tier": "Designer",
    "recommended_platform": "The RealReal",
    "recommended_live_platform": "Whatnot",
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
- `item_name`: Identified item description
- `price_range`: Estimated resale value range
- `style_tier`: Category (Entry/Designer/Luxury)
- `recommended_platform`: Best traditional marketplace
- `recommended_live_platform`: Best live selling platform
- `condition`: Detailed condition assessment
- `authenticity_score`: Percentage (0-100%)
- `boca_score`: Sellability rating (0-100)
- `buy_price`: Suggested purchase price (resale/5)
- `resale_average`: Average resale price
- `market_insights`: Market analysis and trends
- `selling_tips`: Recommendations for selling
- `brand_context`: Brand information if applicable
- `seasonal_notes`: Seasonal selling advice

**Error Responses:**

401 Unauthorized:
```json
{
  "success": false,
  "error": "Authentication required"
}
```

400 Bad Request:
```json
{
  "success": false,
  "error": "No image file provided",
  "hint": "Please select an image to analyze"
}
```

413 Payload Too Large:
```json
{
  "success": false,
  "error": "File size exceeds 10MB limit",
  "hint": "Please use a smaller image"
}
```

500 Internal Server Error:
```json
{
  "success": false,
  "error": "Failed to analyze image",
  "hint": "Please try again with a different image"
}
```

### 4. User Profile (Protected)

#### GET /api/user
Get current user information.

**Authentication:** Required (JWT cookie)

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe",
    "picture": "https://..."
  }
}
```

### 5. Legal Pages

#### GET /terms
Serves terms of service HTML page.

#### GET /privacy
Serves privacy policy HTML page.

## Request Headers

### Required Headers
- None for public endpoints
- Cookie header with JWT token for protected endpoints

### Optional Headers
- `X-Request-ID`: Client-provided request tracking ID

## Authentication Flow

1. User clicks "Sign in with Google"
2. Redirect to `/auth/google`
3. Google OAuth consent screen
4. Callback to `/auth/google/callback`
5. JWT token set as httpOnly cookie
6. Redirect to app main page
7. All subsequent API calls include cookie

## JWT Token Structure

```json
{
  "userId": 1,
  "email": "user@example.com",
  "iat": 1721900000,
  "exp": 1722504800
}
```

- Expires in 7 days
- httpOnly cookie (not accessible via JavaScript)
- Secure flag in production

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
- **401 Unauthorized**: Authentication required or invalid
- **413 Payload Too Large**: File exceeds 10MB
- **500 Internal Server Error**: Server or OpenAI API error
- **503 Service Unavailable**: Service temporarily down

### Error Response Format
All errors return consistent JSON with helpful hints:
```json
{
  "success": false,
  "error": "Human-readable error message",
  "hint": "Suggestion for resolution"
}
```

## Example Usage

### cURL Examples

**Health Check:**
```bash
curl https://app.flippi.ai/health
```

**Analyze Image (with authentication):**
```bash
# First login via browser to get cookie
# Then use cookie in request
curl -X POST https://app.flippi.ai/api/scan \
  -H "Cookie: token=YOUR_JWT_TOKEN" \
  -F "image=@vintage-jacket.jpg" \
  -F "description=Vintage leather jacket"
```

### JavaScript (Fetch API)
```javascript
// Health check
const health = await fetch('https://app.flippi.ai/health');
const status = await health.json();
console.log(status.version); // "2.0"

// Analyze image (after login)
const formData = new FormData();
formData.append('image', fileInput.files[0]);
formData.append('description', 'Vintage leather jacket');

try {
  const response = await fetch('https://app.flippi.ai/api/scan', {
    method: 'POST',
    body: formData,
    credentials: 'include' // Important for cookies
  });
  
  const result = await response.json();
  
  if (result.success) {
    console.log('Item:', result.data.item_name);
    console.log('Value:', result.data.price_range);
    console.log('Boca Score:', result.data.boca_score);
  } else {
    console.error('Error:', result.error);
    console.log('Hint:', result.hint);
  }
} catch (error) {
  console.error('Network error:', error);
}
```

### React Native Example
```javascript
// Login first
const handleGoogleSignIn = () => {
  window.location.href = `${API_URL}/auth/google`;
};

// Then analyze image
const analyzeImage = async () => {
  const formData = new FormData();
  formData.append('image', {
    uri: imageUri,
    name: 'photo.jpg',
    type: 'image/jpeg',
  });
  formData.append('description', productDescription);

  const response = await fetch(`${API_URL}/api/scan`, {
    method: 'POST',
    body: formData,
    credentials: 'include',
  });

  const data = await response.json();
  if (data.success) {
    setAnalysisResult(data.data);
  }
};
```

## Performance

- Average response time: < 3 seconds
- Max file processing: 10MB
- Concurrent requests: Unlimited (no queuing)
- Timeout: 30 seconds
- JWT expiry: 7 days

## Security Considerations

1. **HTTPS Only**: Production endpoints require HTTPS
2. **JWT Authentication**: Secure httpOnly cookies
3. **Input Validation**: File type and size validated
4. **No Data Storage**: Images processed in memory only
5. **API Key Security**: OpenAI key stored in environment variables
6. **CORS Protection**: Restricted to known domains
7. **SQL Injection Protection**: Parameterized queries for user data

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  googleId TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  name TEXT,
  picture TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  lastLoginAt DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

## Environment Variables

Required for OAuth:
- `JWT_SECRET`: Secret key for JWT signing
- `GOOGLE_CLIENT_ID`: Google OAuth client ID
- `GOOGLE_CLIENT_SECRET`: Google OAuth client secret
- `FRONTEND_URL`: Redirect URL after login

## Versioning

Current version: 2.0

API version included in health check response.

## Changelog

### v2.0 (July 2025)
- Added Google OAuth authentication
- Protected API endpoints with JWT
- Enhanced response format with hints
- Added boca_score and recommended_live_platform
- Improved error messages
- Added user profile endpoint
- Database integration for users

### v1.0
- Basic image analysis
- Open API (no auth)
- Simple health check

## Future Enhancements

- Additional OAuth providers (Facebook, Apple)
- Scan history API
- Batch image processing
- WebSocket support for real-time updates
- Rate limiting implementation
- Webhook notifications
- Analytics endpoints

## Support

For API issues or questions:
- Check service status: https://app.flippi.ai/health
- Email: teamflippi@gmail.com