#!/bin/bash

# Script to replace console.log statements with logger.log
# This maintains the logs for development but suppresses them in production

echo "Replacing console.log statements with logger.log..."

# Backend files (CommonJS)
echo "Processing backend files..."
for file in $(find backend -name "*.js" -not -path "*/node_modules/*" -not -path "*/utils/logger.js"); do
  if grep -q "console\.log" "$file"; then
    # Check if logger is already imported
    if ! grep -q "require.*logger" "$file"; then
      # Add logger import at the top of the file after any existing requires
      sed -i.bak '0,/^[^\/]*require/{/^[^\/]*require/a\
const logger = require('"'"'./utils/logger'"'"');
}' "$file" 2>/dev/null || \
      # If no requires found, add at the beginning
      sed -i.bak '1i\
const logger = require('"'"'./utils/logger'"'"');\
' "$file"
    fi
    
    # Replace console.log with logger.log
    sed -i.bak 's/console\.log/logger.log/g' "$file"
    
    # Clean up backup files
    rm -f "${file}.bak"
    
    echo "✓ Updated: $file"
  fi
done

# Frontend files (ES6)
echo "Processing frontend files..."
for file in $(find mobile-app -name "*.js" -not -path "*/node_modules/*" -not -path "*/utils/logger.js" -not -path "*/test-build/*" -not -path "*/dist-test/*"); do
  if grep -q "console\.log" "$file"; then
    # Check if logger is already imported
    if ! grep -q "import.*logger" "$file"; then
      # Add logger import at the top of the file after other imports
      sed -i.bak '0,/^import/{/^import/a\
import logger from '"'"'./utils/logger'"'"';
}' "$file" 2>/dev/null || \
      # If no imports found, add at the beginning
      sed -i.bak '1i\
import logger from '"'"'./utils/logger'"'"';\
' "$file"
    fi
    
    # Replace console.log with logger.log
    sed -i.bak 's/console\.log/logger.log/g' "$file"
    
    # Clean up backup files
    rm -f "${file}.bak"
    
    echo "✓ Updated: $file"
  fi
done

echo "Console.log replacement complete!"
echo ""
echo "Note: Please review the changes and adjust import paths as needed."
echo "Some files may need manual adjustment of the logger import path."