# My Thrifting Buddy API Documentation - v0.1.0

## Base URL
- Development: `http://localhost:3000`

## Authentication
None - API is completely open in v0.1.0

## Response Format

Success response:
```json
{
  "success": true,
  "analysis": { ... }
}
```

Error response:
```json
{
  "error": "Error message",
  "details": "..." // Only in development mode
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

### Image Analysis

#### POST /api/scan
Analyze an image to get resale price estimates.

**Request:**
- Method: POST
- Content-Type: multipart/form-data
- Field: `image` (required) - Image file (JPEG, PNG, etc.)
- Max file size: 10MB

**Response:**
```json
{
  "success": true,
  "analysis": {
    "item_name": "Vintage Leather Jacket",
    "price_range": "$50-$150",
    "style_tier": "Designer",
    "recommended_platform": "Poshmark",
    "condition": "Good",
    "buy_price": "$20",
    "resale_average": "$100"
  }
}
```

**Response Fields:**
- `item_name`: Description of the identified item
- `price_range`: Estimated resale value range
- `style_tier`: Fashion tier classification
  - `Entry`: Accessible fashion brands (e.g., Fossil, Coach)
  - `Designer`: Mid-range resale brands (e.g., Furla, Michael Kors)
  - `Luxury`: Premium resale brands (e.g., Chanel, Hermès)
- `recommended_platform`: Best marketplace based on item and tier
- `condition`: Item condition assessment
- `buy_price`: Maximum recommended purchase price (resale ÷ 5)
- `resale_average`: Average of the price range

**Error Response:**
```json
{
  "error": "Failed to analyze image",
  "details": "No image provided" // Only in development
}
```

**Possible Errors:**
- 400: No image provided
- 500: OpenAI API error or processing failure

## Example Usage

### cURL
```bash
# Health check
curl http://localhost:3000/health

# Analyze image
curl -X POST http://localhost:3000/api/scan \
  -F "image=@photo.jpg"
```

### JavaScript (Fetch)
```javascript
// Analyze image
const formData = new FormData();
formData.append('image', fileInput.files[0]);

const response = await fetch('http://localhost:3000/api/scan', {
  method: 'POST',
  body: formData
});

const data = await response.json();
console.log(data.analysis);
```

## Rate Limiting
None implemented in v0.1.0

## CORS
Configured to accept requests from:
- http://localhost:3000
- http://localhost:8080

## What's NOT in v0.1.0
- User authentication endpoints
- Scan history endpoints
- User profile endpoints
- Search functionality
- Pagination
- Rate limiting
- API versioning