# Simplified backend - VERSION 0.1.0
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy application file
COPY server.js .

# Note: .env file is NOT copied into image for security
# It should be provided via env_file in docker-compose

EXPOSE 3000

CMD ["node", "server.js"]