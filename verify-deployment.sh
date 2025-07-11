#!/bin/bash

# Verification script to check if the correct code is deployed
# Usage: ./verify-deployment.sh

echo "=== Deployment Verification Script ==="

# Set variables
SUDO_PASS="a"
SERVER_IP="157.245.142.145"
SERVER_PASS="Thisismynewpassord!"

echo -e "\n1. Checking local Docker image contents..."
# Find the JS file in the local image
JS_FILE=$(echo $SUDO_PASS | sudo -S docker run --rm thrifting-buddy/frontend:v0.1.1 ls /app/dist/_expo/static/js/web/ | grep AppEntry)
echo "Found JS file: $JS_FILE"

# Check for TouchableOpacity in local image
echo -e "\n2. Checking for TouchableOpacity in local image..."
TOUCHABLE_COUNT=$(echo $SUDO_PASS | sudo -S docker run --rm thrifting-buddy/frontend:v0.1.1 cat /app/dist/_expo/static/js/web/$JS_FILE | grep -o "TouchableOpacity" | wc -l)
echo "TouchableOpacity found $TOUCHABLE_COUNT times in local image"

# Check for our button styles
echo -e "\n3. Checking for uploadButton styles in local image..."
BUTTON_COUNT=$(echo $SUDO_PASS | sudo -S docker run --rm thrifting-buddy/frontend:v0.1.1 cat /app/dist/_expo/static/js/web/$JS_FILE | grep -o "uploadButton" | wc -l)
echo "uploadButton style found $BUTTON_COUNT times in local image"

# Check the actual source file
echo -e "\n4. Checking source App.js file..."
grep -c "TouchableOpacity" /mnt/c/Users/jhusband/price-scanner-app/mobile-app/App.js && echo "TouchableOpacity IS in source file" || echo "TouchableOpacity NOT in source file"

# Check what's on the server
echo -e "\n5. Checking server deployment..."
sshpass -p "$SERVER_PASS" ssh root@$SERVER_IP << 'EOF'
echo "Server check:"
# Get the container ID
CONTAINER_ID=$(docker ps --filter "name=thrifting_buddy_frontend" -q)
echo "Frontend container ID: $CONTAINER_ID"

# Find the JS file in the running container
JS_FILE=$(docker exec $CONTAINER_ID ls /app/dist/_expo/static/js/web/ | grep AppEntry)
echo "JS file on server: $JS_FILE"

# Check for TouchableOpacity
TOUCHABLE_COUNT=$(docker exec $CONTAINER_ID cat /app/dist/_expo/static/js/web/$JS_FILE | grep -o "TouchableOpacity" | wc -l)
echo "TouchableOpacity found $TOUCHABLE_COUNT times on server"

# Check for button styles
BUTTON_COUNT=$(docker exec $CONTAINER_ID cat /app/dist/_expo/static/js/web/$JS_FILE | grep -o "uploadButton" | wc -l)
echo "uploadButton style found $BUTTON_COUNT times on server"

# Check image ID
echo -e "\nImage details:"
docker images | grep frontend
EOF

echo -e "\n=== Verification Complete ==="