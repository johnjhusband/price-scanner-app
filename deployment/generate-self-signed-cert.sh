#!/bin/bash

# Generate self-signed certificate for Traefik
# This creates a certificate valid for 365 days

echo "=== Generating Self-Signed Certificate ==="

# Create certs directory
mkdir -p traefik-certs

# Generate private key and certificate
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout traefik-certs/cert.key \
  -out traefik-certs/cert.crt \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=157.245.142.145"

# Create a dynamic Traefik configuration for the certificate
cat > traefik-certs/dynamic.yml << EOF
tls:
  certificates:
    - certFile: /certs/cert.crt
      keyFile: /certs/cert.key
EOF

# Set proper permissions
chmod 600 traefik-certs/cert.key
chmod 644 traefik-certs/cert.crt
chmod 644 traefik-certs/dynamic.yml

echo "=== Certificate Generated Successfully ==="
echo "Certificate details:"
openssl x509 -in traefik-certs/cert.crt -text -noout | grep -E "Subject:|Not Before:|Not After:"