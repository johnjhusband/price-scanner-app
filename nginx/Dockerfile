# Nginx with embedded configuration
FROM nginx:alpine

# Install curl for health checks
RUN apk add --no-cache curl

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Removed sites-enabled to avoid conflicts with default.conf

# Create default.conf that serves frontend with enhanced telemetry
RUN cat > /etc/nginx/conf.d/default.conf << 'EOF'
# Upstream definitions for better monitoring
upstream frontend_upstream {
    server frontend:80 max_fails=3 fail_timeout=30s;
}

upstream backend_upstream {
    server backend:3000 max_fails=3 fail_timeout=30s;
}

server {
    listen 80 default_server;
    server_name _;
    
    # Add request ID for tracking
    add_header X-Request-ID $request_id always;
    
    # Frontend proxy with telemetry
    location / {
        # Log all frontend requests
        access_log /var/log/nginx/frontend-access.log telemetry;
        error_log /var/log/nginx/frontend-error.log debug;
        
        proxy_pass http://frontend_upstream;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Request-ID $request_id;
        
        # Timeouts for debugging
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
        
        # Add response headers for debugging
        add_header X-Upstream-Status $upstream_status always;
        add_header X-Upstream-Response-Time $upstream_response_time always;
        add_header X-Proxy-Cache $upstream_cache_status always;
    }
    
    # API endpoints with telemetry
    location /api/ {
        # Log all API requests
        access_log /var/log/nginx/api-access.log telemetry;
        error_log /var/log/nginx/api-error.log debug;
        
        proxy_pass http://backend_upstream/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Request-ID $request_id;
        
        # Timeouts for debugging
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
        
        # Add response headers for debugging
        add_header X-Upstream-Status $upstream_status always;
        add_header X-Upstream-Response-Time $upstream_response_time always;
        add_header X-Backend-Server $upstream_addr always;
    }
    
    # Health check
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
    
    # Nginx status for monitoring
    location /nginx_status {
        stub_status on;
        access_log off;
        allow 127.0.0.1;
        deny all;
    }
}
EOF

# Create non-root user
RUN addgroup -g 10001 -S nginx-user && \
    adduser -S nginx-user -u 10001 -G nginx-user && \
    chown -R nginx-user:nginx-user /var/cache/nginx && \
    chown -R nginx-user:nginx-user /var/log/nginx && \
    chown -R nginx-user:nginx-user /etc/nginx/conf.d && \
    touch /var/run/nginx.pid && \
    chown -R nginx-user:nginx-user /var/run/nginx.pid && \
    # Fix nginx.conf to use nginx-user
    sed -i 's/user nginx;/user nginx-user;/g' /etc/nginx/nginx.conf

# Switch to non-root user  
USER nginx-user

# Health check
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD curl -f http://localhost/health || exit 1

# Metadata
LABEL maintainer="DevOps Team" \
      version="1.0.0" \
      description="Nginx reverse proxy for My Thrifting Buddy"

# Expose ports
EXPOSE 80 443

# Start nginx
CMD ["nginx", "-g", "daemon off;"]