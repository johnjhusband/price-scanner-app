# CLAUDE.md (Consolidated)

## CRITICAL RULES - MUST FOLLOW
- At start of EVERY response, internally review ALL rules before ANY action
- Execute EXACTLY what is asked - nothing more, nothing less
- NEVER: apologize, tell user they're right/wrong, take actions without explicit instruction
- Wait for direct commands. If something fails, report and STOP
- Give ONE recommendation. Give SIMPLE answers first (1-3 sentences max)
- NEVER create files unless absolutely necessary. ALWAYS prefer editing existing files

## Environment
- Root access Linux, no sudo needed
- Git at /usr/bin/git, User: John Husband (John@husband.llc)
- DISPLAY=:10.0, Terminal: xfce4-terminal
- For visibility: `DISPLAY=:10.0 x-terminal-emulator -e "bash -c 'COMMAND; read -p \"Press enter to close\"'" &`

## Project: My Thrifting Buddy
AI-powered resale value estimation app with Express.js backend + React Native frontend

### Architecture
- **Backend**: Express.js, PostgreSQL/Knex, JWT auth, AWS S3, OpenAI Vision API
- **Frontend**: React Native/Expo SDK 50, Context API, React Navigation v6
- **Docker**: Separate frontend/backend containers, nginx proxy, redis cache

### Database
```sql
users (id, email, username, password_hash, is_active, email_verified)
scan_history (id, user_id, image_url, item_name, platform_prices, confidence_score)
refresh_tokens (id, user_id, token, family, fingerprint, used, expires_at)
```

## CRITICAL Setup Requirements

### 1. Web Dependencies (MUST install before Docker)
```bash
cd mobile-app
npx expo install react-native-web react-dom @expo/metro-runtime
npm install  # Update package-lock.json
npx expo start --web  # Test it works
```

### 2. Environment File Location
- **.env MUST be in `/backend` directory**, NOT project root
- Frontend doesn't need .env (uses dynamic API detection)

### 3. Required Backend .env Variables
```bash
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://user:pass@localhost:5432/thrifting_buddy
JWT_ACCESS_SECRET=<32+ chars>
JWT_REFRESH_SECRET=<32+ chars>
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
BCRYPT_ROUNDS=12
OPENAI_API_KEY=your_key
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
S3_BUCKET_NAME=thrifting-buddy-images
AWS_REGION=us-east-1
ALLOWED_ORIGINS=http://localhost:19006,exp://localhost:19000
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
MAX_FILE_SIZE_MB=10
SENTRY_DSN=your_dsn  # Optional but must be valid if set
LOG_LEVEL=info
```

## Essential Commands

### Quick Start
```bash
# Backend
cd backend && npm install && cp .env.example .env && npm run migrate && npm run dev

# Frontend (with web support)
cd mobile-app && npm install && npx expo install react-native-web react-dom @expo/metro-runtime && npx expo start

# Docker (after above steps)
df -h  # Check space (need 2-3x image size)
docker system prune -f && docker builder prune -f  # Clean first
docker-compose build
docker-compose up
```

### API Endpoints
- Auth: `/api/auth/{register,login,refresh,logout,me}`
- Scan: `/api/scan` (POST), `/api/scan/history`, `/api/scan/:id`
- Health: `/health`

### Testing (Prevents Broken Deployments)
```bash
npm test          # Run before commits
npm run lint      # Catch style issues
npm run typecheck # Catch type errors
```

## Critical Docker Rules

### Pre-Build ALWAYS
1. Check dependencies match package.json: `npm start` in both dirs
2. Ensure web deps installed in mobile-app
3. Clean Docker: `docker system prune -f && docker builder prune -f`
4. Check space: `df -h` (need 2-3x final size)

### Docker Best Practices (Prevents Space/Build Issues)
- **Each RUN creates a layer** - combine commands to reduce size
- **Order matters** - put frequently changing files last
- **Multi-stage builds** - don't include build tools in final image
- **Use specific versions** - node:20-alpine not node:latest
- **Clean in same layer** - `apt-get install X && apt-get clean`

### Package Management
- NEVER add require() without updating package.json immediately
- ALWAYS run `npm install` after package.json changes
- ALWAYS commit package.json + package-lock.json together
- Docker uses `npm ci` - fails if package-lock out of sync

### Space Issues
```bash
docker ps -a && docker container prune -f
docker images && docker image prune -f
docker builder prune -f
docker system df  # Check what's using space
```

## Common Fixes

| Issue | Fix |
|-------|-----|
| Backend won't start | Check .env in backend dir with all required vars |
| Frontend Docker fails | Install web deps: `npx expo install react-native-web react-dom @expo/metro-runtime` |
| No space for Docker | Run cleanup commands above |
| API connection fails | Check CORS origins, port 3000, API URL |
| Package not found | Verify in package.json, run npm install, check package-lock |

## Code Standards
- Backend: CommonJS (require/module.exports), async/await
- Frontend: ES6 modules, React hooks, Context API
- Responses: `{error, code}` or `{success: true, data}`
- NO COMMENTS unless asked

### Technology Selection (Prevents Debugging Issues)
- **Prefer common patterns** over obscure optimizations
- Choose packages with **strong documentation** and active communities
- Use **stable/LTS versions** not beta/experimental
- Consider how easily other devs and AI can work with the code
- Examples: React > niche frameworks, PostgreSQL > exotic DBs, Express > unknown Node frameworks

## Security
- JWT access/refresh tokens, session fingerprinting
- File upload validation, S3 private storage
- Rate limiting, input validation, XSS/CSRF protection
- Docker: Non-root users, network isolation

## Development Workflow (Prevents Broken Code)
1. **Branch from master** - never commit directly
2. **Test locally first** - npm test, npm run lint
3. **Migrations** - test both up AND down
4. **PR before merge** - get review
5. **Run all tests** - don't skip "just this once"

## Known Limitations (Prevents Wasted Effort)
- **No Redis caching** implemented yet
- **Camera mock button** needs testing
- **No email verification** flow
- **No E2E tests** automated
- **Large images** process slowly

## Deployment Checklist
1. [ ] Install web dependencies in mobile-app
2. [ ] Place .env in backend directory  
3. [ ] Set all production env variables
4. [ ] Run ALL tests: backend & frontend
5. [ ] Test migrations up AND down
6. [ ] Verify locally with `npm start`
7. [ ] Clean Docker cache before build
8. [ ] Document any new env variables