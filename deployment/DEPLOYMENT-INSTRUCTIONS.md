# DEPLOYMENT INSTRUCTIONS - VERSION 0.1

## Clean Up (if needed)
```bash
cd /root/price-scanner-app
docker compose down
docker ps -a | grep thrifting | awk '{print $1}' | xargs -r docker rm -f
docker volume ls | grep thrifting | awk '{print $2}' | xargs -r docker volume rm
```

## Deploy
```bash
cd deployment
docker compose up -d --no-build
```

## Access
- Frontend: http://localhost:8080
- Backend: http://localhost:3000

## Stop
```bash
docker compose down
```