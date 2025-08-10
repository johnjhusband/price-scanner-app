#!/bin/bash
DOMAIN=$(basename $(pwd))
PORT=3002
echo "Legal pages diagnostic for $DOMAIN"
echo "Backend status:"
curl -s -o /dev/null -w "/terms: %{http_code}\n" http://localhost:$PORT/terms
curl -s -o /dev/null -w "/privacy: %{http_code}\n" http://localhost:$PORT/privacy
echo "Public access:"
curl -s -o /dev/null -w "https://$DOMAIN/terms: %{http_code}\n" https://$DOMAIN/terms
curl -s -o /dev/null -w "https://$DOMAIN/privacy: %{http_code}\n" https://$DOMAIN/privacy