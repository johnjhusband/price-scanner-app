# Product Requirements Document (PRD) - v2.0

## Product Overview

**My Thrifting Buddy v2.0** is a production-ready AI-powered application that helps users estimate resale values of secondhand items through advanced image analysis. Built with React Native and Node.js, it provides instant valuations to assist thrift shoppers and resellers in making informed purchasing decisions.

## Product Vision

To democratize thrift shopping and reselling by providing instant, AI-powered market insights that help users identify profitable items and fair pricing in the secondhand marketplace.

## Target Users

### Primary Users
- **Thrift Store Shoppers**: Individuals looking for good deals on quality secondhand items
- **Resellers**: People who buy items to resell on platforms like eBay, Poshmark, Mercari
- **Casual Sellers**: Users wanting to price their own items for sale

### Secondary Users
- **Thrift Store Owners**: Business owners wanting to price items competitively
- **Estate Sale Organizers**: People managing estate sales and need quick valuations

## Key Features (v2.0)

### Core Functionality

#### 1. AI-Powered Image Analysis
- **OpenAI Vision Integration**: Advanced image recognition and analysis
- **Detailed Item Assessment**: Brand recognition, condition evaluation, style categorization
- **Market Value Estimation**: Real-time pricing based on current market trends
- **Profit Potential Calculation**: Estimated profit margins for resellers

#### 2. Enhanced User Interface
- **Multi-Input Support**: Camera capture, photo library selection, paste (Ctrl/Cmd+V), drag & drop
- **Cross-Platform Compatibility**: iOS, Android, and Web browsers
- **Mac Compatibility**: Optimized clipboard and keyboard shortcuts
- **Responsive Design**: Works seamlessly across all device sizes
- **Loading States**: Clear visual feedback during processing

#### 3. Advanced Features
- **Instant Results**: Sub-3-second analysis response times
- **Detailed Reports**: Comprehensive breakdown including:
  - Item identification and description
  - Estimated resale value range
  - Condition assessment
  - Market demand analysis
  - Suggested listing price
  - Profit potential calculation

## Technical Architecture

### Frontend (Mobile & Web)
- **Framework**: React Native with Expo SDK 50
- **Web Support**: React Native Web for browser compatibility
- **Key Libraries**: 
  - expo-image-picker (camera/gallery access)
  - expo-clipboard (paste functionality)
  - React hooks for state management

### Backend API
- **Framework**: Node.js with Express.js
- **AI Service**: OpenAI Vision API
- **Key Features**:
  - Enhanced error handling and validation
  - Request timing middleware
  - Comprehensive health endpoints
  - CORS configuration for multi-domain support

### Infrastructure
- **Hosting**: DigitalOcean Droplet (Ubuntu 24.10)
- **Process Management**: PM2 (not Docker)
- **Web Server**: Nginx reverse proxy
- **SSL**: Let's Encrypt certificates
- **Environments**: Three-tier deployment (Production/Staging/Development)

### Deployment Strategy
- **Production**: app.flippi.ai (master branch)
- **Staging**: green.flippi.ai (staging branch)
- **Development**: blue.flippi.ai (develop branch)

## User Experience Flow

### Primary Use Case: Item Analysis

1. **Image Capture**
   - User opens application
   - Multiple input options presented:
     - Take photo with camera
     - Select from photo library
     - Paste image (Ctrl/Cmd+V)
     - Drag and drop image file

2. **Processing**
   - Loading indicator shows analysis in progress
   - Typically completes in 2-3 seconds
   - Error handling for network issues or invalid images

3. **Results Display**
   - Comprehensive analysis presented:
     - Item identification
     - Estimated value range
     - Condition assessment
     - Market insights
     - Pricing recommendations

4. **Action Options**
   - Share results
   - Analyze another item
   - Access app settings

## Success Metrics

### Performance Metrics
- **Response Time**: < 3 seconds for image analysis
- **Uptime**: 99.5% availability across all environments
- **Error Rate**: < 1% failed requests
- **Image Processing**: Support files up to 10MB

### User Experience Metrics
- **Task Completion Rate**: > 95% successful image analyses
- **User Satisfaction**: Accurate valuations within 20% of market price
- **Platform Coverage**: iOS, Android, and Web browser support

### Business Metrics
- **Cost Efficiency**: Optimized OpenAI API usage
- **Scalability**: Handle concurrent users without performance degradation
- **Reliability**: Zero-downtime deployments with PM2

## API Specification

### Health Check Endpoint
```
GET /health
Response: {
  "status": "OK",
  "timestamp": "2025-07-14T00:00:00.000Z",
  "version": "2.0",
  "features": {
    "imageAnalysis": true,
    "cameraSupport": true,
    "pasteSupport": true,
    "dragDropSupport": true,
    "enhancedAI": true
  }
}
```

### Image Analysis Endpoint
```
POST /api/scan
Content-Type: multipart/form-data
Field: image (required, max 10MB)

Success Response: {
  "success": true,
  "data": {
    "item": "Vintage Leather Jacket",
    "estimatedValue": "$45-65",
    "condition": "Good - minor wear on sleeves",
    "marketability": "High - vintage leather is in demand",
    "suggestedPrice": "$55",
    "profitPotential": "$30-40"
  }
}
```

## Security & Privacy

### Data Handling
- **No Data Storage**: Images processed in memory only, not stored
- **Privacy First**: No user tracking or personal data collection
- **Secure Transmission**: All communications over HTTPS
- **API Key Security**: OpenAI credentials stored in environment variables

### Input Validation
- **File Type Restrictions**: Images only (JPEG, PNG, GIF, WebP)
- **Size Limits**: Maximum 10MB per upload
- **Malware Protection**: File type validation and sanitization

## Deployment & Operations

### Infrastructure Requirements
- **Server**: Single DigitalOcean droplet (2GB RAM minimum)
- **Node.js**: Version 18.x or higher
- **PM2**: Global installation for process management
- **Nginx**: For reverse proxy and SSL termination
- **SSL Certificates**: Automated Let's Encrypt renewal

### Monitoring & Alerting
- **Health Checks**: Automated monitoring every 5 minutes
- **PM2 Monitoring**: Process status and resource usage
- **Log Management**: Structured logging with rotation
- **Error Tracking**: Automated issue creation for failures

### Backup & Recovery
- **Code Backups**: Git-based version control
- **Configuration Backups**: PM2 and Nginx configs
- **SSL Certificate Backups**: Automated Let's Encrypt management
- **Rollback Capability**: Quick revert to previous versions

## Quality Assurance

### Testing Strategy
- **Unit Tests**: Backend logic and API endpoints
- **Integration Tests**: API contract validation
- **E2E Tests**: Playwright automation for user journeys
- **Performance Tests**: Load testing with Artillery
- **Security Tests**: Vulnerability scanning and validation

### CI/CD Pipeline
- **GitHub Actions**: Automated testing on all commits
- **Multi-Environment**: Dev → Staging → Production pipeline
- **Automated Deployment**: Git-based deployments (future)
- **Issue Tracking**: Automatic GitHub issue creation for failures

## Future Roadmap (Post v2.0)

### Short Term (3-6 months)
- **User Authentication**: Account creation and login
- **Scan History**: Save and review previous analyses
- **Batch Processing**: Multiple image analysis
- **Enhanced AI**: Improved accuracy and speed

### Medium Term (6-12 months)
- **Mobile Apps**: Native iOS and Android applications
- **API Rate Limiting**: Usage controls and quotas
- **Advanced Analytics**: Market trend insights
- **Social Features**: Community recommendations

### Long Term (12+ months)
- **Database Integration**: Persistent data storage
- **Machine Learning**: Custom model training
- **Marketplace Integration**: Direct platform connections
- **Enterprise Features**: Business-focused tools

## Success Criteria

### Launch Criteria (v2.0)
- ✅ All three environments operational (prod/staging/dev)
- ✅ API response times under 3 seconds
- ✅ Cross-platform compatibility (iOS/Android/Web)
- ✅ Enhanced features working (paste, drag-drop, Mac support)
- ✅ SSL certificates configured and auto-renewing
- ✅ PM2 process management operational
- ✅ GitHub Actions CI/CD pipeline functional

### Post-Launch Success
- 99% uptime over first 30 days
- User satisfaction with accuracy of valuations
- Successful handling of concurrent users
- Zero security incidents
- Positive user feedback on new features

## Risk Mitigation

### Technical Risks
- **OpenAI API Limits**: Monitor usage and implement caching
- **Performance Issues**: PM2 monitoring and auto-restart
- **Security Vulnerabilities**: Regular security audits and updates
- **Deployment Failures**: Automated rollback procedures

### Business Risks
- **Cost Management**: Optimize API usage and monitor expenses
- **User Adoption**: Focus on accuracy and user experience
- **Competition**: Continuous feature development and improvement
- **Scaling Challenges**: Monitor performance and plan infrastructure growth

---

**Document Version**: 2.0  
**Last Updated**: July 14, 2025  
**Status**: Production Ready  
**Next Review**: August 14, 2025