# Flippi.ai - Never Over Pay

A resale value estimation app that helps users make informed decisions when shopping for secondhand items.

## Overview

Flippi.ai uses AI-powered image analysis to provide:
- Item identification and price ranges
- Style tier classification (Entry/Designer/Luxury)
- Best platform recommendations (standard and live selling)
- Authenticity scores
- Trending scores (sellability ratings)
- Market insights and selling tips

## Features

- **Google Sign-In Required**: Secure access with OAuth 2.0
- **Image Analysis**: Upload, capture, paste, or drag-and-drop images
- **Real-time Valuation**: Get instant resale estimates
- **Platform Recommendations**: Find the best place to sell
- **Mobile & Web Support**: Works on all devices
- **Feedback Learning System**: AI learns from user feedback to improve accuracy
- **Admin Dashboard**: Monitor feedback patterns and create adjustments

## Quick Start

### Development

```bash
# Clone the repository
git clone https://github.com/johnjhusband/price-scanner-app-coding.git
cd price-scanner-app-coding

# Install dependencies
cd backend && npm install
cd ../mobile-app && npm install

# Configure environment (see documentation for OAuth setup)
# Create backend/.env with required variables

# Run locally
# Backend: npm start (in backend/)
# Frontend: npx expo start --web (in mobile-app/)
```

### Deployment

The app uses automated deployment via GitHub Actions:
- `develop` branch → blue.flippi.ai
- `staging` branch → green.flippi.ai
- `master` branch → app.flippi.ai

#### Deployment Rules (Personal Guardrails)

1. **NEVER merge to staging outside planned promotion sequence**
   - Blue → Green only when Blue is verified stable
   - Green → Prod only after QA passes in Green

2. **NO adding features to staging mid-cycle**
   - Only approved bug fixes from release notes
   - All new features go to develop first

3. **If process is broken, IMMEDIATELY rollback**
   ```bash
   git checkout staging
   git reset --hard <last-stable-commit>
   git push origin staging --force
   ```

4. **Release discipline checklist**:
   - [ ] Is this commit part of the current release?
   - [ ] Has it been tested in blue environment?
   - [ ] Are all known issues documented?
   - [ ] Is the release taxonomy updated?

5. **Rollback triggers**:
   - Environment becomes non-functional
   - Untested code appears in staging
   - Release contains unapproved features
   - Critical bugs not in release notes

## Documentation

For detailed documentation, see the `/documentation` folder:
- [Technical Guide](documentation/TECHNICAL-GUIDE.md) - Architecture and API reference
- [Development Guide](documentation/DEVELOPMENT-GUIDE.md) - Setup and workflow
- [Operations Manual](documentation/OPERATIONS-MANUAL.md) - Day-to-day operations
- [Brand Guide](documentation/BRAND-GUIDE.md) - UI/UX standards

## Feedback Learning System

Flippi.ai continuously improves through user feedback:

### For Users
- After each scan, tell us if the analysis was helpful
- Provide suggestions or report issues
- Your feedback directly improves future results

### For Admins
- Access dashboard with Admin button (authorized users only)
- View feedback patterns and statistics
- Create manual adjustments for pricing/scoring
- Generate weekly reports

See [Feedback Documentation](./docs/FEEDBACK-LEARNING-SYSTEM.md) for complete details.

## Tech Stack

- **Backend**: Node.js, Express, OpenAI API
- **Frontend**: React Native, Expo
- **Database**: SQLite (users and feedback)
- **Auth**: Google OAuth 2.0
- **Infrastructure**: DigitalOcean, Nginx, PM2
- **AI**: GPT-4 for analysis and feedback categorization

## Documentation

- [Development Guide](./docs/DEVELOPMENT-GUIDE.md)
- [Feedback Learning System](./docs/FEEDBACK-LEARNING-SYSTEM.md)
- [Feedback Quick Start](./docs/FEEDBACK-README.md)
- [Release Taxonomy](./docs/RELEASE-TAXONOMY.md)
- [Known Issues](./docs/ISSUE-122-127-128-COMPLETE.md)

## License

MIT License - see [LICENSE](LICENSE) file for details.# Test push
