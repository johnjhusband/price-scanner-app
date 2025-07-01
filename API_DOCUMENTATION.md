# My Thrifting Buddy API Documentation

## Base URL
- Development: `http://localhost:3000`
- Production: `https://your-domain.com`

## Authentication
The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

## Response Format
All responses follow this format:
```json
{
  "success": true,
  "data": { ... },
  "message": "Success message",
  "timestamp": "2025-01-09T..."
}
```

Error responses:
```json
{
  "error": "Error message",
  "message": "Detailed error description",
  "details": { ... }
}
```

## Endpoints

### Health Check

#### GET /health
Check if the server is running.

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2025-01-09T12:00:00.000Z"
}
```

### Authentication

#### POST /api/auth/register
Create a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "username": "johndoe",
  "password": "securepassword",
  "fullName": "John Doe" // optional
}
```

**Validation:**
- Email must be valid format
- Username: 3-30 characters
- Password: minimum 6 characters

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "id": "user_123456789_abc",
    "email": "user@example.com",
    "username": "johndoe",
    "fullName": "John Doe",
    "isActive": true,
    "emailVerified": false,
    "createdAt": "2025-01-09T..."
  },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

#### POST /api/auth/login
Login with existing credentials.

**Request Body:**
```json
{
  "emailOrUsername": "user@example.com",
  "password": "securepassword"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "user": { ... },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

#### POST /api/auth/logout
Logout current user. **Requires authentication.**

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

#### GET /api/auth/me
Get current user information. **Requires authentication.**

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user_123456789_abc",
    "email": "user@example.com",
    "username": "johndoe",
    "fullName": "John Doe",
    "isActive": true,
    "emailVerified": false,
    "createdAt": "2025-01-09T..."
  }
}
```

#### POST /api/auth/verify-token
Verify if a token is valid.

**Request Body:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response:**
```json
{
  "valid": true,
  "user": { ... }
}
```

### Image Analysis

#### POST /api/scan
Analyze an image to get price estimates. **Optional authentication.**

**Headers:**
```
Content-Type: multipart/form-data
Authorization: Bearer YOUR_JWT_TOKEN // optional
```

**Request:**
- Field name: `image`
- File types: JPG, PNG, GIF, WebP
- Max size: 10MB

**Response:**
```json
{
  "analysis": {
    "item_identification": "Vintage Nike T-shirt",
    "price_range": "$25-45",
    "condition_assessment": "Good condition with minor wear",
    "selling_platforms": {
      "eBay": "$30-40",
      "Facebook Marketplace": "$25-35",
      "Poshmark": "$35-45",
      "Mercari": "$28-38",
      "WhatNot": "N/A"
    },
    "notable_features": ["Vintage logo", "90s era", "Size L"],
    "market_insights": "Vintage Nike items are in high demand"
  },
  "confidence": "High",
  "timestamp": "2025-01-09T12:00:00.000Z"
}
```

#### POST /api/analyze
Alternative endpoint for image analysis (same as /api/scan).

#### POST /api/analyze-base64
Analyze a base64 encoded image.

**Headers:**
```
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN // optional
```

**Request Body:**
```json
{
  "image": "base64_encoded_image_data",
  "mimeType": "image/jpeg" // optional, defaults to image/jpeg
}
```

**Response:** Same as `/api/scan`

## Error Codes

| Status Code | Description |
|------------|-------------|
| 200 | Success |
| 201 | Created (registration) |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Invalid credentials or token |
| 409 | Conflict - Resource already exists |
| 413 | Payload Too Large - Image exceeds 10MB |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error |

## Rate Limiting
- Window: 15 minutes
- Max requests: 100 per IP address
- Authenticated users may have higher limits

## CORS
The API supports CORS for the following origins in development:
- `http://localhost:8081`
- `http://localhost:19006`
- `exp://localhost:19000`
- Mobile apps (no origin)

## Image Requirements
- Supported formats: JPEG, PNG, GIF, WebP
- Maximum file size: 10MB
- Recommended: Clear, well-lit photos
- Best results: Single item centered in frame

## Best Practices

1. **Authentication**: Store JWT tokens securely in your app
2. **Error Handling**: Always check for error responses
3. **Image Quality**: Higher quality images yield better results
4. **Rate Limiting**: Implement exponential backoff for retries
5. **Caching**: Cache analysis results to avoid duplicate API calls

## Example Implementation

### JavaScript/React Native
```javascript
// Login
const login = async (email, password) => {
  const response = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ emailOrUsername: email, password })
  });
  const data = await response.json();
  if (data.token) {
    // Store token securely
    await SecureStore.setItemAsync('authToken', data.token);
  }
  return data;
};

// Analyze Image
const analyzeImage = async (imageUri) => {
  const formData = new FormData();
  formData.append('image', {
    uri: imageUri,
    type: 'image/jpeg',
    name: 'item.jpg'
  });
  
  const token = await SecureStore.getItemAsync('authToken');
  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch('http://localhost:3000/api/scan', {
    method: 'POST',
    headers,
    body: formData
  });
  
  return await response.json();
};
```

### cURL Examples
```bash
# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","username":"testuser","password":"test123"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"emailOrUsername":"test@example.com","password":"test123"}'

# Analyze Image
curl -X POST http://localhost:3000/api/scan \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "image=@/path/to/image.jpg"
```

## Webhooks (Future)
Planned webhook support for:
- Price alerts when items drop below target price
- New similar items found
- Market trend notifications

## SDK Support (Future)
Planned SDK support for:
- JavaScript/TypeScript
- Python
- Swift (iOS)
- Kotlin (Android)