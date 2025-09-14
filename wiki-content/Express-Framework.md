# Express Framework

## 🚀 Overview

Express is the web application framework that powers all of Flippi's backend services. It's a minimal and flexible Node.js framework that provides a robust set of features for building web applications and APIs.

## 📍 Where Express is Used

Express is used throughout the Flippi ecosystem:

### 1. Main Backend (`backend/server.js`)
- **Port**: 3000/3001/3002 (depending on environment)
- **Purpose**: Core API server for the Flippi app
- **Handles**:
  - Image scanning and analysis
  - User authentication
  - Payment processing
  - Admin features
  - Mobile app API endpoints

### 2. Growth Service (`growth.js`)
- **Port**: 3003
- **Purpose**: Standalone marketing website
- **Handles**:
  - Public blog/content pages
  - Growth dashboard
  - Content management
  - SEO-optimized pages

### 3. Route Files (28+ files)
Express powers all API endpoints:
- `/backend/routes/auth.js` - Authentication (login/signup)
- `/backend/routes/payment.js` - Stripe payment processing
- `/backend/routes/analytics.js` - Usage tracking
- `/backend/routes/admin.js` - Admin dashboard
- `/backend/routes/feedback.js` - User feedback
- And 20+ more route files

## 🔧 What Express Does

### Core Functions
1. **Creates Web Servers** - Handles HTTP requests (GET, POST, PUT, DELETE)
2. **Routes URLs** - Maps URLs to specific functions
3. **Middleware** - Processes requests (authentication, logging, parsing)
4. **Static Files** - Serves HTML, CSS, images
5. **REST APIs** - Makes it easy to build APIs

### Example Usage
```javascript
const express = require('express');
const app = express();

// Create a route
app.get('/', (req, res) => {
  res.send('Homepage');
});

// API endpoint
app.get('/api/growth/content', (req, res) => {
  res.json({ content: [...] });
});

// Start server
app.listen(3003);
```

## 🏗️ Architecture

### Main Backend Structure
```
backend/
├── server.js          # Main Express app
├── routes/            # All API endpoints
│   ├── auth.js       # Authentication routes
│   ├── payment.js    # Payment routes
│   ├── admin.js      # Admin routes
│   └── ...           # 25+ more route files
└── middleware/        # Express middleware
```

### Growth Service Structure
```
growth.js              # Standalone Express app
├── Public Routes      # Marketing pages
├── Admin Routes       # Growth dashboard
└── API Routes         # Content management
```

## 🔌 Key Express Features We Use

### 1. Routing
```javascript
app.get('/api/analyze', handleImageAnalysis);
app.post('/api/auth/login', handleLogin);
app.put('/api/user/profile', updateProfile);
app.delete('/api/item/:id', deleteItem);
```

### 2. Middleware
```javascript
app.use(cors());                    // Enable CORS
app.use(express.json());            // Parse JSON bodies
app.use(authenticateUser);          // Custom auth
app.use(express.static('public'));  // Serve static files
```

### 3. Error Handling
```javascript
app.use((error, req, res, next) => {
  logger.error('Error:', error);
  res.status(500).json({ error: 'Internal server error' });
});
```

## 📊 Service Comparison

| Service | Port | Purpose | Key Routes |
|---------|------|---------|------------|
| Main Backend | 3000-3002 | Core API | `/api/analyze`, `/api/auth/*`, `/api/payment/*` |
| Growth Service | 3003 | Marketing Site | `/`, `/blog`, `/growth/*` |

## 🚨 Common Express Issues

### Port Already in Use
```bash
Error: listen EADDRINUSE: address already in use :::3000
```
**Solution**: Kill the process or use a different port

### Module Not Found
```bash
Error: Cannot find module 'express'
```
**Solution**: Run `npm install` in the correct directory

### Route Not Found
```javascript
Cannot GET /api/endpoint
```
**Solution**: Check route definition and order

## 🛠️ Maintenance

### Adding New Routes
1. Create route file in `/backend/routes/`
2. Define Express router
3. Mount in `server.js`

### Debugging
- Use `app.use((req, res, next) => { console.log(req.path); next(); })` for logging
- Check route order (specific before generic)
- Verify middleware order

## 💡 Best Practices

1. **Route Organization** - Group related routes in separate files
2. **Error Handling** - Always use try/catch in async routes
3. **Middleware Order** - Body parsers before routes
4. **Security** - Use helmet, rate limiting, CORS properly
5. **Testing** - Test each endpoint independently

## 🔗 Related Documentation

- [[Architecture]] - Overall system design
- [[API-Documentation]] - Complete API reference
- [[Backend-Development]] - Backend coding guidelines
- [[Deployment-Guide]] - How services are deployed

[[Home]] | [[Tech Stack]] | [[Development-Workflow]]