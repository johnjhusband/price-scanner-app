# Flippi.ai Technical Stack Summary

## Overview
This document provides a comprehensive technical stack overview for Flippi.ai, including all technologies, dependencies, costs, and licensing information for potential ownership transfer.

## Table of Contents
1. [Technology Stack](#technology-stack)
2. [Infrastructure & Hosting](#infrastructure--hosting)
3. [Dependencies & Licenses](#dependencies--licenses)
4. [Cost Breakdown](#cost-breakdown)
5. [Ownership & Authorship](#ownership--authorship)
6. [Compliance & Legal](#compliance--legal)
7. [Handoff Checklist](#handoff-checklist)

## Technology Stack

### Frontend
- **Framework**: React Native with Expo SDK 50
- **Platform**: Web, iOS, Android (via Expo)
- **Language**: JavaScript
- **UI Components**: Custom branded components
- **State Management**: React Hooks (useState, useEffect)
- **Build Tool**: Expo CLI
- **Entry Point**: `mobile-app/App.js`

### Backend
- **Framework**: Express.js 4.18.2
- **Runtime**: Node.js 18.x
- **Language**: JavaScript
- **API Type**: RESTful JSON API
- **File Processing**: Multer for image uploads
- **AI Integration**: OpenAI API (GPT-4o-mini)
- **Entry Point**: `backend/server.js`

### Database
- **Primary**: None (stateless design)
- **Feedback Storage**: SQLite (better-sqlite3) - temporary in /tmp
- **Session Storage**: None (no authentication)

### Infrastructure
- **Hosting Provider**: DigitalOcean
- **Server Type**: Single Droplet (VPS)
- **Operating System**: Ubuntu 24.10
- **Web Server**: Nginx 1.26.0
- **Process Manager**: PM2 5.x
- **SSL Certificates**: Let's Encrypt (free, auto-renewing)
- **Deployment**: GitHub Actions (automated)

## Infrastructure & Hosting

### Server Architecture
- **Provider**: DigitalOcean Droplet
- **IP Address**: 157.245.142.145
- **Specifications**: [Need to verify droplet size]
- **Monthly Cost**: ~$20-40 (estimated based on typical droplet pricing)

### Domain Configuration
- **Domains**: 
  - app.flippi.ai (production)
  - green.flippi.ai (staging)
  - blue.flippi.ai (development)
- **DNS Provider**: [Need to verify]
- **Annual Cost**: ~$36/year per domain

### Environment Setup
Three environments on single server:
- Production: Ports 3000/8080
- Staging: Ports 3001/8081  
- Development: Ports 3002/8082

## Dependencies & Licenses

### Backend Dependencies
All backend dependencies use permissive licenses:

| Package | Version | License | Usage |
|---------|---------|---------|--------|
| express | 4.18.2 | MIT | Web framework |
| cors | 2.8.5 | MIT | CORS handling |
| dotenv | 16.3.1 | BSD-2 | Environment variables |
| multer | 1.4.5 | MIT | File uploads |
| openai | 4.20.1 | MIT | AI integration |
| better-sqlite3 | 12.2.0 | MIT | Database |
| express-validator | 7.2.1 | MIT | Input validation |
| body-parser | 1.20.3 | MIT | Request parsing |

### Frontend Dependencies
All frontend dependencies use permissive licenses:

| Package | Version | License | Usage |
|---------|---------|---------|--------|
| react | 18.2.0 | MIT | UI framework |
| react-native | 0.73.6 | MIT | Mobile framework |
| expo | ~50.0.17 | MIT | Development platform |
| expo-camera | ~14.1.3 | MIT | Camera access |
| expo-image-picker | ~14.7.1 | MIT | Image selection |
| react-native-web | ~0.19.11 | MIT | Web support |

### License Summary
- **All dependencies**: MIT or BSD licensed (permissive)
- **No GPL/LGPL**: No copyleft obligations
- **No commercial licenses**: No paid dependencies
- **Attribution required**: Only in distributed source code

## Cost Breakdown

### Fixed Monthly Costs
1. **DigitalOcean Droplet**: ~$20-40/month
   - Depends on droplet size
   - Includes bandwidth
   
2. **Domain Registration**: ~$3/month ($36/year × 3 domains)

### Variable Costs
1. **OpenAI API Usage**:
   - Model: GPT-4o-mini
   - Cost: ~$0.15 per 1M input tokens
   - Estimated: $10-100/month depending on usage
   - No minimum commitment

### Free Services
1. **SSL Certificates**: Let's Encrypt (free)
2. **GitHub**: Free for public repository
3. **GitHub Actions**: Free tier sufficient
4. **PM2**: Open source (free)
5. **Nginx**: Open source (free)

### Total Estimated Costs
- **Minimum**: ~$33/month (low usage)
- **Typical**: ~$60-80/month (moderate usage)
- **Maximum**: ~$140/month (high API usage)

## Ownership & Authorship

### Code Ownership
- **Repository**: github.com/johnjhusband/price-scanner-app
- **Primary Development**: Custom developed for Flippi.ai
- **License**: Not specified (recommend adding MIT license)

### Third-Party Code
- All dependencies are open-source packages from npm
- No proprietary code or paid templates used
- No marketplace purchases or commercial components

### Intellectual Property
- **Brand**: "Flippi.ai" name and logo
- **Domain names**: app.flippi.ai, green.flippi.ai, blue.flippi.ai
- **Custom code**: All application code is original

### Attribution Requirements
- None required for end users
- MIT license attribution only needed if distributing source code

## Compliance & Legal

### License Compliance
✅ **All Clear**: No license violations or concerns
- All dependencies use permissive licenses (MIT/BSD)
- No copyleft obligations (GPL/LGPL)
- No commercial license requirements
- No attribution needed for deployed application

### Data Privacy
- No user accounts or persistent data storage
- Images processed in-memory only
- No cookies or tracking
- No personal data collection (except voluntary feedback)

### API Terms
- **OpenAI**: Standard API terms apply
- Must not violate OpenAI usage policies
- API key must be kept secure

## Handoff Checklist

### Required Accounts & Access

#### 1. GitHub Repository
- **URL**: github.com/johnjhusband/price-scanner-app
- **Transfer**: Repository ownership
- **Secrets**: GitHub Actions deployment keys

#### 2. DigitalOcean Account
- **Resource**: Droplet hosting all environments
- **Transfer**: Account ownership or droplet transfer
- **Backup**: Create snapshot before transfer

#### 3. Domain Names
- **Domains**: *.flippi.ai (3 subdomains)
- **Transfer**: Domain registrar account
- **DNS**: Update nameservers if needed

#### 4. Server Access
- **SSH Keys**: Root access to 157.245.142.145
- **Passwords**: Root password for console access
- **Security**: Regenerate after transfer

#### 5. API Keys
- **OpenAI API Key**: Must be transferred or regenerated
- **Location**: `/var/www/shared/.env`
- **Cost**: Transfers to new account

### Technical Handoff Steps

1. **Pre-Transfer**:
   - Create full server backup/snapshot
   - Document current traffic/usage levels
   - Export any feedback data if needed

2. **Account Transfers**:
   - GitHub repository ownership
   - DigitalOcean account/droplet
   - Domain registrar account
   - OpenAI API account

3. **Post-Transfer**:
   - Update SSH keys
   - Regenerate any passwords
   - Update API keys
   - Test all environments

4. **Knowledge Transfer**:
   - Review ARCHITECTURE.md
   - Review DEPLOYMENT.md
   - Walk through deployment process
   - Explain monitoring approach

### Operational Knowledge

#### Daily Operations
- Monitor PM2 status: `pm2 list`
- Check logs: `pm2 logs`
- Restart services: `pm2 restart all`

#### Deployment Process
- Push to develop → Deploys to blue.flippi.ai
- Push to staging → Deploys to green.flippi.ai
- Push to master → Deploys to app.flippi.ai

#### Common Issues
- 502 errors: Backend crashed, check PM2
- High CPU: Usually OpenAI processing
- Disk space: Check /tmp for old files

### Future Considerations

1. **Scaling Options**:
   - Increase droplet size for more traffic
   - Add CDN for static assets
   - Implement caching for API responses

2. **Cost Optimization**:
   - Monitor OpenAI usage
   - Implement rate limiting if needed
   - Consider caching frequent queries

3. **Security Hardening**:
   - Implement rate limiting
   - Add authentication if needed
   - Regular security updates

## Contact Information

For technical questions about this stack:
- GitHub Issues: github.com/johnjhusband/price-scanner-app/issues
- Documentation: See /docs folder in repository

---

*Last Updated: July 2025*
*Document Version: 1.0*