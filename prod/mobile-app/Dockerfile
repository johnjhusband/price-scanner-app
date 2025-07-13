# Simplified frontend - VERSION 0.1
FROM node:20-alpine AS builder

# Install build dependencies
RUN apk add --no-cache python3 make g++ git

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy application files
COPY App.js ./
COPY app.json ./

# Build for web
RUN npx expo export --platform web --output-dir dist

# Production stage
FROM node:20-alpine

# Install minimal dependencies
RUN apk add --no-cache curl

WORKDIR /app

# Copy built app from builder
COPY --from=builder /app/dist ./dist

# Install a simple static server
RUN npm install -g serve

# Create simple server script
RUN cat > server.js << 'EOF'
const { exec } = require('child_process');
const http = require('http');

// Start app on port 8080
const appProcess = exec('serve -s dist -l 8080', (error, stdout, stderr) => {
  if (error) {
    console.error(`App error: ${error}`);
    return;
  }
  console.log(`App running on port 8080`);
});

// Health check endpoint on same port
const healthServer = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('healthy\n');
  }
});

healthServer.listen(8081, () => {
  console.log('Health check on port 8081');
});

// Handle process termination
process.on('SIGTERM', () => {
  appProcess.kill();
  healthServer.close();
  process.exit(0);
});
EOF

# Create non-root user
RUN addgroup -g 10001 -S nodejs && \
    adduser -S nodejs -u 10001 -G nodejs && \
    chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 8080 8081

CMD ["node", "server.js"]