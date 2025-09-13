# Tech Stack

## 🛠️ Technology Overview

### Backend Stack

#### Core Technologies
- **Node.js 18.x** - JavaScript runtime
- **Express.js 4.18** - Web framework
- **SQLite** - Lightweight database
- **JavaScript** - Primary language

#### Key Libraries
- **OpenAI SDK** - GPT-4o-mini for image analysis
- **Passport.js** - Google OAuth authentication
- **Multer** - Image upload handling
- **Sharp** - Image processing
- **PM2** - Process management

### Frontend Stack

#### Core Framework
- **React Native** - Cross-platform mobile
- **Expo SDK 50** - Development platform
- **React 18.2** - UI library
- **React Native Web** - Web support

#### Key Libraries
- **Expo Camera** - Photo capture
- **Expo Image Picker** - Gallery access
- **Async Storage** - Local data persistence
- **Vector Icons** - UI icons

### Infrastructure

#### Hosting
- **DigitalOcean** - VPS hosting
- **Ubuntu 24.10** - Server OS
- **Single Server** - All environments
- **Estimated Cost**: $20-40/month

#### Web Server
- **Nginx** - Reverse proxy
- **Let's Encrypt** - SSL certificates
- **Certbot** - SSL auto-renewal

#### Process Management
- **PM2** - Node.js process manager
- **6 Processes** - 3 backends, 3 frontends
- **Auto-restart** - On failure
- **Log rotation** - Automatic

### Third-Party Services

#### AI/ML
- **OpenAI API**
  - Model: GPT-4o-mini
  - Use: Image analysis
  - Cost: ~$0.20/1000 scans

#### Authentication
- **Google OAuth 2.0**
  - Passwordless login
  - Secure by default
  - No user management

### Development Tools

#### Version Control
- **Git** - Source control
- **GitHub** - Repository hosting
- **GitHub Actions** - CI/CD

#### Build Tools
- **Webpack** - Module bundler
- **Babel** - JS transpilation
- **Expo CLI** - React Native tooling

#### Development
- **Nodemon** - Auto-restart
- **ESLint** - Code linting
- **Prettier** - Code formatting

### Architecture Patterns

#### API Design
- **RESTful** - Standard HTTP
- **Stateless** - No server sessions
- **JWT** - API authentication
- **Multipart** - File uploads

#### Frontend Architecture
- **SPA** - Single page app
- **Component-based** - React
- **Cross-platform** - iOS/Android/Web
- **Responsive** - All screen sizes

### Port Configuration

#### Production
- Backend: 3000
- Frontend: 8080

#### Staging
- Backend: 3001
- Frontend: 8081

#### Development
- Backend: 3002
- Frontend: 8082

### Database Schema

#### Tables
- **users** - OAuth accounts
- **feedback** - User feedback
- **flip_tracking** - Usage tracking
- **flip_history** - Scan history

#### Location
- Path: `/tmp/flippi-feedback.db`
- Type: Non-persistent (resets on restart)

### Security Stack

#### Authentication
- Google OAuth 2.0 only
- No passwords stored
- JWT for API access
- HTTPOnly cookies

#### Network Security
- HTTPS enforced
- CORS configured
- Rate limiting
- Input validation

### Monitoring & Logging

#### Application Logs
- PM2 log management
- Structured logging
- Error tracking
- Performance metrics

#### Server Monitoring
- Basic health checks
- Nginx access logs
- System resource tracking

### Cost Breakdown

#### Monthly Costs
- **Server**: $20-40 (DigitalOcean)
- **Domain**: $3/month
- **OpenAI**: Usage-based
- **Total**: ~$25-45/month

### Technical Decisions

#### Why These Choices?

1. **PM2 over Docker**
   - Simpler management
   - Lower resource usage
   - Easier debugging

2. **SQLite over PostgreSQL**
   - Lightweight
   - No setup required
   - Sufficient for current scale

3. **Expo over bare React Native**
   - Faster development
   - Web support included
   - Better DX

4. **Single server architecture**
   - Cost-effective
   - Simple to manage
   - Adequate for current load

### Future Considerations

#### Potential Upgrades
- PostgreSQL for persistence
- Redis for caching
- CDN for static assets
- Separate database server
- Container orchestration

#### Scaling Strategy
- Vertical scaling first
- Database optimization
- Caching layer
- Load balancing (if needed)

## 🔗 Related Pages

- [[Architecture]] - System design
- [[Development-Workflow]] - Dev process
- [[Deployment-Guide]] - Deploy procedures

[[Home]] | [[Architecture]] | [[Development-Workflow]]