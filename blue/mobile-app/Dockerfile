FROM node:16-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies including web dependencies
RUN npm install

# Copy all source files including the enhanced App.js
COPY . .

# Build the web version (App.js is already the enhanced version)
RUN npx expo export --platform web --output-dir dist

# Production stage
FROM nginx:alpine

# Copy built files to nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx config for SPA routing
RUN echo 'server { \
    listen 8080; \
    listen 8081; \
    server_name localhost; \
    root /usr/share/nginx/html; \
    index index.html; \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
    location /health { \
        return 200 "OK"; \
        add_header Content-Type text/plain; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 8080 8081

CMD ["nginx", "-g", "daemon off;"]
