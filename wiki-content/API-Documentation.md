# API Documentation

## 🔌 API Overview

Base URL: `https://{environment}.flippi.ai/api`

Environments:
- **Blue**: `https://blue.flippi.ai/api`
- **Green**: `https://green.flippi.ai/api`
- **Production**: `https://app.flippi.ai/api`

## 🔐 Authentication

All API requests require authentication token in headers:
```
Authorization: Bearer <token>
```

## 📍 Endpoints

### Products

#### GET /products
Get all products
```bash
curl -H "Authorization: Bearer <token>" \
     https://blue.flippi.ai/api/products
```

Response:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Product Name",
      "price": 29.99,
      "created_at": "2025-09-13T00:00:00Z"
    }
  ]
}
```

#### POST /products
Create new product
```bash
curl -X POST \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{"name": "New Product", "price": 19.99}' \
     https://blue.flippi.ai/api/products
```

#### PUT /products/:id
Update product
```bash
curl -X PUT \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{"price": 24.99}' \
     https://blue.flippi.ai/api/products/1
```

#### DELETE /products/:id
Delete product
```bash
curl -X DELETE \
     -H "Authorization: Bearer <token>" \
     https://blue.flippi.ai/api/products/1
```

### Scanner

#### POST /scanner/process
Process scanned item
```bash
curl -X POST \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{"barcode": "123456789", "source": "mobile"}' \
     https://blue.flippi.ai/api/scanner/process
```

Response:
```json
{
  "success": true,
  "data": {
    "product_id": 1,
    "name": "Scanned Product",
    "price": 29.99,
    "matched": true
  }
}
```

## 🔴 Error Responses

Standard error format:
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message"
  }
}
```

Common error codes:
- `AUTH_REQUIRED` - Missing authentication
- `INVALID_TOKEN` - Invalid or expired token
- `NOT_FOUND` - Resource not found
- `VALIDATION_ERROR` - Invalid request data
- `SERVER_ERROR` - Internal server error

## 📊 Response Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `404` - Not Found
- `500` - Server Error

## 🧪 Testing

Test endpoints using curl or Postman:
```bash
# Get auth token first
TOKEN=$(curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"username": "test", "password": "test"}' \
  https://blue.flippi.ai/api/auth/login | jq -r '.token')

# Use token for requests
curl -H "Authorization: Bearer $TOKEN" \
     https://blue.flippi.ai/api/products
```

## 🔗 Related Pages

[[Architecture]] | [[Development-Workflow]] | [[Troubleshooting]]