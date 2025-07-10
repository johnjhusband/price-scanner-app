# CLAUDE.md - Software Developer Agent

This file contains software development-specific guidance for Claude Code when working on this repository.

## Core Development Principles

### Code First, Documentation Second
- NEVER create documentation unless explicitly requested
- ALWAYS prefer editing existing files over creating new ones
- Do what has been asked; nothing more, nothing less

### Testing Discipline
```bash
# ALWAYS run these before claiming task completion
npm test          # Unit tests must pass
npm run lint      # No linting errors
npm run typecheck # No type errors (if applicable)
npm start         # Application must actually run
```

## Critical Development Rules

### 1. Dependency Management (PREVENTS BUILD FAILURES)
- **Before using ANY package**: Check if it exists in package.json
- **When adding require/import**: IMMEDIATELY add to package.json
- **After modifying package.json**: ALWAYS run `npm install`
- **Commit discipline**: package.json and package-lock.json MUST be committed together
- **Docker builds use `npm ci`**: Requires perfect package-lock.json sync

### 2. Environment Configuration
- **Backend .env location**: MUST be in `/backend` directory, NOT project root
- **Frontend .env**: Not needed - uses dynamic API detection
- **Missing env vars**: Backend will crash on startup - check error messages
- **Docker context**: Can only access files within build directory

### 3. Web Dependencies (Mobile App)
```bash
# REQUIRED before Docker builds
cd mobile-app
npx expo install react-native-web react-dom @expo/metro-runtime
npm install  # Updates package-lock.json
npx expo start --web  # Verify it works
```

## Technology Selection Standards

### Choose Boring Technology
- **Common patterns** > clever optimizations
- **Strong documentation** > cutting edge
- **LTS/stable versions** > beta/experimental
- **AI/human debuggable** > obscure efficiency

### Approved Stack
- **Backend**: Express.js, PostgreSQL, JWT, CommonJS
- **Frontend**: React Native, Expo SDK, React hooks
- **Infrastructure**: Docker, Nginx, PM2
- **Testing**: Jest, Supertest

### Red Flags to Avoid
- Packages with < 1000 weekly downloads
- No documentation or examples
- Last updated > 2 years ago
- Complex abstractions for simple tasks

## Docker Development

### Pre-Build Checklist
1. `npm start` works in both directories
2. Web dependencies installed (mobile-app)
3. All require() statements have packages in package.json
4. Disk space available: `df -h` (need 2-3x image size)
5. Clean Docker: `docker system prune -f`

### Space-Efficient Dockerfiles
```dockerfile
# Good: Combined RUN reduces layers
RUN apt-get update && apt-get install -y nodejs && apt-get clean && rm -rf /var/lib/apt/lists/*

# Bad: Multiple RUN creates multiple layers
RUN apt-get update
RUN apt-get install -y nodejs
RUN apt-get clean
```

### Build Order Matters
1. OS dependencies (changes rarely)
2. Package files (package*.json)
3. Install dependencies
4. Application code (changes frequently)

## Database Development

### Migration Discipline
```bash
# Create migration
npm run migrate:make description_here

# ALWAYS test both directions
npm run migrate:latest
npm run migrate:rollback

# Never edit existing migrations in production
```

### Schema Changes
1. Create new migration file
2. Test migration up AND down
3. Update models to match
4. Update validation schemas
5. Test all affected endpoints

## API Development

### Request/Response Standards
```javascript
// Error response
{ error: "Human readable message", code: "ERROR_CODE", details: {} }

// Success response  
{ success: true, data: {} }

// List response
{ success: true, data: [], total: 100, page: 1, limit: 20 }
```

### Security Checklist
- [ ] Input validation on all endpoints
- [ ] Rate limiting configured
- [ ] Authentication required where needed
- [ ] File upload size limits
- [ ] SQL injection prevention (use parameterized queries)
- [ ] XSS prevention (sanitize output)

## Debugging Workflow

### When Things Break
1. **Read the actual error message** - it usually tells you exactly what's wrong
2. **Check the basics**:
   - Is the service running? `ps aux | grep node`
   - Is the port available? `lsof -i :3000`
   - Are env variables set? `echo $VAR_NAME`
   - Is the database up? `psql -U user -d database -c '\dt'`
3. **Check logs**:
   - Application logs: `logs/app.log`
   - Docker logs: `docker logs container_name`
   - System logs: `journalctl -u service`

### Common Issues & Quick Fixes

| Symptom | Likely Cause | Fix |
|---------|--------------|-----|
| "Cannot find module X" | Missing from package.json | `npm install X --save` |
| "EADDRINUSE :3000" | Port already in use | `kill -9 $(lsof -t -i:3000)` |
| "ECONNREFUSED" | Service not running | Start the service |
| Docker "No space left" | Disk/Docker cache full | `docker system prune -af` |
| "Invalid token" | JWT expired or wrong secret | Check JWT_SECRET matches |
| CORS errors | Origin not in allowed list | Add to ALLOWED_ORIGINS |

## Performance Considerations

### Backend Optimization
- Use connection pooling for databases
- Implement caching for expensive operations
- Add indexes for frequently queried fields
- Use pagination for large datasets
- Compress responses with gzip

### Frontend Optimization  
- Compress images before upload
- Implement lazy loading
- Use React.memo for expensive components
- Virtualize long lists
- Cache API responses appropriately

## Code Quality Standards

### Clean Code Rules
- Functions do ONE thing
- Names reveal intent
- No magic numbers/strings
- Early returns over nested ifs
- Explicit over implicit

### Error Handling
```javascript
// Good: Specific error handling
try {
  await riskyOperation();
} catch (error) {
  if (error.code === 'ENOENT') {
    throw new NotFoundError('File not found');
  }
  throw new ServerError('Operation failed', error);
}

// Bad: Generic catch-all
try {
  await riskyOperation();
} catch (error) {
  console.log(error);
  res.status(500).send('Error');
}
```

### Comments
- **DO NOT ADD COMMENTS** unless explicitly requested
- Code should be self-documenting
- Use descriptive names instead of comments

## Git Workflow

### Branch Strategy
- `master` - production ready
- `feature/*` - new features
- `fix/*` - bug fixes
- `hotfix/*` - urgent production fixes

### Commit Discipline
1. Test locally first
2. Lint and format code
3. Write clear commit messages
4. Reference issue numbers
5. Never commit sensitive data

## Final Checklist Before "Done"

- [ ] Code runs locally without errors
- [ ] All tests pass
- [ ] No linting errors  
- [ ] Dependencies are tracked in package.json
- [ ] Environment variables documented
- [ ] Error cases handled
- [ ] Security considerations addressed
- [ ] Performance impact considered
- [ ] Migration tested both ways (if DB changes)
- [ ] Docker builds successfully (if applicable)