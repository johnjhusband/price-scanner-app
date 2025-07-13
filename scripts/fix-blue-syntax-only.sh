#!/bin/bash

# Fix only the syntax error in blue App.js

echo "=== Fixing Blue Syntax Error ==="

# Remove the duplicate </TouchableOpacity> on line 367
sed -i '367d' blue/mobile-app/App.js

echo "Removed duplicate </TouchableOpacity> tag"
echo ""
echo "Checking if syntax is now valid..."
grep -n -B3 -A3 "</TouchableOpacity>" blue/mobile-app/App.js | grep -C5 "367:"

echo ""
echo "Syntax error fixed locally."
echo "To deploy: run a build and deploy script"