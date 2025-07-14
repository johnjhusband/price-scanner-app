# Test Execution Plan v0.1 - Simplified Architecture

## Overview
Complete test execution plan for the simplified My Thrifting Buddy application with only backend API and frontend web app.

## Pre-Test Setup

### 1. Verify Environment
```bash
# Check Docker is running
docker --version

# Check Node.js (if testing locally)
node --version  # Should be v20+

# Check required files
ls -la backend/server.js backend/.env
ls -la mobile-app/App.js
```

### 2. Build Containers
```bash
# Build backend
cd backend
docker build -f Dockerfile.backend -t thrifting-backend:v01 .

# Build frontend  
cd ../mobile-app
docker build -f Dockerfile.frontend-node -t thrifting-frontend:v01 .
```

### 3. Start Services
```bash
# Option 1: Using docker-compose
docker-compose up -d

# Option 2: Manual start
docker run -d -p 3000:3000 --env-file backend/.env --name backend thrifting-backend:v01
docker run -d -p 8080:8080 --name frontend thrifting-frontend:v01
```

## Test Execution Sequence

### Phase 1: Infrastructure Tests (5 min)

#### 1.1 Container Health
```bash
echo "=== Testing Container Health ==="
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

#### 1.2 Port Availability
```bash
echo "=== Testing Port Availability ==="
netstat -tulpn | grep -E "3000|8080" || lsof -i :3000,8080
```

#### 1.3 Backend Health Check
```bash
echo "=== Testing Backend Health ==="
curl -v http://localhost:3000/health
```

### Phase 2: API Tests (10 min)

#### 2.1 Create Test Image
```bash
# Download test image or create one
wget -O test-handbag.jpg "https://picsum.photos/800/600" 2>/dev/null || \
  curl -o test-handbag.jpg "https://picsum.photos/800/600"
```

#### 2.2 Test Image Analysis
```bash
echo "=== Testing Image Analysis API ==="
curl -X POST http://localhost:3000/api/scan \
  -F "image=@test-handbag.jpg" \
  -H "Accept: application/json" | jq '.'
```

#### 2.3 Test Error Cases
```bash
echo "=== Testing Error Handling ==="

# No image
curl -X POST http://localhost:3000/api/scan

# Invalid file
echo "not an image" > test.txt
curl -X POST http://localhost:3000/api/scan -F "image=@test.txt"
rm test.txt
```

### Phase 3: Frontend Tests (10 min)

#### 3.1 Frontend Accessibility
```bash
echo "=== Testing Frontend Access ==="
curl -I http://localhost:8080
```

#### 3.2 Frontend Content
```bash
echo "=== Testing Frontend Content ==="
curl -s http://localhost:8080 | grep -E "(Thrifting|Select Image|Analyze)" | head -5
```

#### 3.3 Static Assets
```bash
echo "=== Testing Static Assets ==="
# Check if JavaScript bundle loads
curl -I http://localhost:8080/static/js/bundle.js 2>/dev/null || \
  curl -I http://localhost:8080/bundle.js
```

### Phase 4: Integration Tests (15 min)

#### 4.1 Manual Browser Test
```
1. Open http://localhost:8080 in browser
2. Click "Select Image" button
3. Choose test-handbag.jpg
4. Verify image preview appears
5. Click "Analyze" button
6. Verify loading state appears
7. Verify results display with:
   - Item name
   - Price estimates
   - Confidence level
```

#### 4.2 Cross-Origin Test
```bash
# Test CORS from frontend origin
curl -X OPTIONS http://localhost:3000/api/scan \
  -H "Origin: http://localhost:8080" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -v 2>&1 | grep -i "access-control"
```

### Phase 5: Stress Tests (5 min)

#### 5.1 Concurrent Requests
```bash
echo "=== Testing Concurrent Requests ==="
for i in {1..5}; do
  (time curl -s -X POST http://localhost:3000/api/scan \
    -F "image=@test-handbag.jpg" > /dev/null && echo "Request $i: SUCCESS") &
done
wait
```

#### 5.2 Large File Test
```bash
echo "=== Testing File Size Limit ==="
# Create 11MB file (over 10MB limit)
dd if=/dev/zero of=large.jpg bs=1M count=11 2>/dev/null
curl -X POST http://localhost:3000/api/scan -F "image=@large.jpg"
rm large.jpg
```

## Automated Test Script

Create `run-all-tests.sh`:
```bash
#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo "======================================"
echo "My Thrifting Buddy v0.1 Test Suite"
echo "======================================"

PASS=0
FAIL=0

# Function to run test
run_test() {
    echo -n "$1... "
    if eval "$2" > /dev/null 2>&1; then
        echo -e "${GREEN}PASS${NC}"
        ((PASS++))
    else
        echo -e "${RED}FAIL${NC}"
        ((FAIL++))
    fi
}

# Infrastructure Tests
echo -e "\n--- Infrastructure Tests ---"
run_test "Backend container running" "docker ps | grep -q backend"
run_test "Frontend container running" "docker ps | grep -q frontend"
run_test "Backend port 3000 open" "nc -z localhost 3000"
run_test "Frontend port 8080 open" "nc -z localhost 8080"

# API Tests
echo -e "\n--- API Tests ---"
run_test "Backend health check" "curl -s http://localhost:3000/health | grep -q healthy"
run_test "API accepts POST requests" "curl -s -X POST http://localhost:3000/api/scan | grep -q error"

# Frontend Tests
echo -e "\n--- Frontend Tests ---"
run_test "Frontend responds" "curl -s -I http://localhost:8080 | grep -q '200 OK'"
run_test "Frontend has content" "curl -s http://localhost:8080 | grep -q '<title>'"

# Integration Tests
echo -e "\n--- Integration Tests ---"
run_test "CORS configured" "curl -s -I -X OPTIONS http://localhost:3000/api/scan -H 'Origin: http://localhost:8080' | grep -qi 'access-control'"

# Summary
echo -e "\n======================================"
echo "Test Results: $PASS passed, $FAIL failed"
echo "======================================"

exit $FAIL
```

## Test Report Template

```markdown
# Test Execution Report - v0.1

**Date**: [DATE]
**Tester**: [NAME]
**Environment**: Docker/Local

## Summary
- Total Tests: X
- Passed: X
- Failed: X
- Skipped: X

## Test Results

### Infrastructure
- [ ] Backend container: PASS/FAIL
- [ ] Frontend container: PASS/FAIL
- [ ] Port availability: PASS/FAIL

### API Functionality
- [ ] Health endpoint: PASS/FAIL
- [ ] Image analysis: PASS/FAIL
- [ ] Error handling: PASS/FAIL

### Frontend
- [ ] Page loads: PASS/FAIL
- [ ] Image selection: PASS/FAIL
- [ ] Results display: PASS/FAIL

### Integration
- [ ] End-to-end flow: PASS/FAIL
- [ ] CORS: PASS/FAIL

## Issues Found
1. [Issue description]

## Recommendations
1. [Recommendation]
```

## Quick Smoke Test (2 min)

For rapid verification:
```bash
# 1. Check services
docker ps | grep -E "backend|frontend"

# 2. Check health
curl http://localhost:3000/health

# 3. Check frontend
curl -I http://localhost:8080

# 4. Quick analysis test (need test image)
curl -X POST http://localhost:3000/api/scan \
  -F "image=@test-handbag.jpg" \
  | grep -q "analysis" && echo "✓ API Working" || echo "✗ API Failed"
```

## Rollback Plan

If tests fail:
```bash
# Stop containers
docker stop backend frontend

# Remove containers
docker rm backend frontend

# Remove images if needed
docker rmi thrifting-backend:v01 thrifting-frontend:v01

# Revert to previous version or fix issues
```

## Success Criteria

✓ Both containers running
✓ Health endpoint responding
✓ Image analysis working
✓ Frontend accessible
✓ Can complete full user flow
✓ No critical errors in logs