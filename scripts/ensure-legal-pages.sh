#!/bin/bash
# Ensure legal pages are accessible by testing backend routes

CURRENT_DIR=$(pwd)
if [[ "$CURRENT_DIR" == *"app.flippi.ai"* ]]; then
    PORT="3000"
elif [[ "$CURRENT_DIR" == *"green.flippi.ai"* ]]; then
    PORT="3001"
elif [[ "$CURRENT_DIR" == *"blue.flippi.ai"* ]]; then
    PORT="3002"
else
    echo "Unknown environment"
    exit 1
fi

echo "Testing legal pages on backend port $PORT..."

for page in terms privacy mission contact; do
    echo -n "Testing /$page: "
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$PORT/$page)
    echo "$RESPONSE"
done

echo ""
echo "If all pages return 200, the backend is serving them correctly."
echo "Nginx just needs to proxy these routes to the backend."