# Backend Test Plan v0.1 - Simplified Architecture

## Overview
This test plan covers the simplified backend API consisting of a single 90-line Express server with two endpoints.

## Architecture Summary
- Single file: `server.js`
- No authentication required
- No database
- Direct OpenAI API integration
- Two endpoints: health check and image analysis

## Test Categories

### 1. Environment Setup Tests

#### Test 1.1: Environment Variable Loading
```bash
# Verify .env file exists and contains OPENAI_API_KEY
test -f backend/.env && grep -q "OPENAI_API_KEY" backend/.env
echo $?  # Should return 0
```

#### Test 1.2: Port Configuration
```bash
# Start server and verify it listens on port 3000
curl -I http://localhost:3000/health
# Expected: HTTP/1.1 200 OK
```

### 2. Health Check Endpoint Tests

#### Test 2.1: Basic Health Check
```bash
curl http://localhost:3000/health
# Expected: {"status":"healthy","timestamp":"<ISO_DATE>"}
```

#### Test 2.2: Health Check Response Headers
```bash
curl -I http://localhost:3000/health | grep -i "content-type"
# Expected: Content-Type: application/json
```

### 3. Image Analysis Endpoint Tests

#### Test 3.1: Valid Image Upload
```bash
# Create test image (or use existing)
curl -X POST http://localhost:3000/api/scan \
  -F "image=@test-image.jpg" \
  -H "Accept: application/json"
  
# Expected: JSON response with price analysis
# {
#   "analysis": {
#     "item_identification": "...",
#     "price_estimates": {...},
#     "confidence": "..."
#   }
# }
```

#### Test 3.2: Missing Image
```bash
curl -X POST http://localhost:3000/api/scan \
  -H "Content-Type: multipart/form-data"
  
# Expected: {"error":"No image file provided"}
```

#### Test 3.3: Invalid File Type
```bash
echo "test" > test.txt
curl -X POST http://localhost:3000/api/scan \
  -F "image=@test.txt"
  
# Expected: Error about invalid file type
```

#### Test 3.4: CORS Headers
```bash
curl -X OPTIONS http://localhost:3000/api/scan \
  -H "Origin: http://localhost:8080" \
  -H "Access-Control-Request-Method: POST" \
  -I
  
# Expected: Access-Control-Allow-Origin header present
```

### 4. Error Handling Tests

#### Test 4.1: OpenAI API Key Missing
```bash
# Remove OPENAI_API_KEY from environment and restart
# Then try image analysis
# Expected: Appropriate error message
```

#### Test 4.2: Large File Handling
```bash
# Create large file (>10MB)
dd if=/dev/zero of=large.jpg bs=1M count=11
curl -X POST http://localhost:3000/api/scan \
  -F "image=@large.jpg"
  
# Expected: File size limit error
```

### 5. Performance Tests

#### Test 5.1: Response Time
```bash
time curl -X POST http://localhost:3000/api/scan \
  -F "image=@test-image.jpg" \
  -o /dev/null -s
  
# Expected: < 10 seconds (depends on OpenAI API)
```

#### Test 5.2: Concurrent Requests
```bash
# Send 5 requests simultaneously
for i in {1..5}; do
  curl -X POST http://localhost:3000/api/scan \
    -F "image=@test-image.jpg" &
done
wait

# All should complete successfully
```

## Test Execution Script

Create `test-backend.sh`:
```bash
#!/bin/bash

echo "=== Backend v0.1 Test Suite ==="

# Test 1: Health check
echo -n "Testing health endpoint... "
if curl -s http://localhost:3000/health | grep -q "healthy"; then
  echo "PASS"
else
  echo "FAIL"
fi

# Test 2: Image analysis
echo -n "Testing image analysis... "
if [ -f "test-image.jpg" ]; then
  RESPONSE=$(curl -s -X POST http://localhost:3000/api/scan -F "image=@test-image.jpg")
  if echo "$RESPONSE" | grep -q "analysis"; then
    echo "PASS"
  else
    echo "FAIL: $RESPONSE"
  fi
else
  echo "SKIP (no test image)"
fi

# Test 3: Missing image error
echo -n "Testing missing image error... "
RESPONSE=$(curl -s -X POST http://localhost:3000/api/scan)
if echo "$RESPONSE" | grep -q "error"; then
  echo "PASS"
else
  echo "FAIL"
fi

echo "=== Test Suite Complete ==="
```

## Docker Container Tests

### Test 6.1: Container Build
```bash
cd backend
docker build -t backend-v01 .
# Expected: Successful build
```

### Test 6.2: Container Run
```bash
docker run -d -p 3000:3000 --env-file .env backend-v01
# Expected: Container starts and stays running
```

### Test 6.3: Container Health
```bash
docker ps | grep backend-v01
# Expected: Status shows "Up" and "(healthy)" if healthcheck configured
```

## Manual Testing Checklist

- [ ] Server starts without errors
- [ ] Health endpoint responds
- [ ] Can upload JPEG image
- [ ] Can upload PNG image
- [ ] Receives price analysis from OpenAI
- [ ] Error on missing image
- [ ] Error on invalid file type
- [ ] CORS works from frontend origin
- [ ] Server handles malformed requests gracefully

## Success Criteria

- All endpoints return expected responses
- No crashes on invalid input
- Response times under 10 seconds
- CORS properly configured
- Error messages are user-friendly

## Notes

- No authentication tests needed (feature removed)
- No database tests needed (feature removed)
- No caching tests needed (feature removed)
- Focus on core functionality only