# Product Requirements Document (PRD)
## My Thrifting Buddy v0.1.0

### Executive Summary
My Thrifting Buddy is a mobile-first web application that instantly estimates resale values of secondhand items using AI-powered image analysis. Users simply photograph an item to receive price estimates, recommended selling platforms, and condition assessments.

### Product Vision
"Shazam for thrift store finds" - Making resale value discovery as simple as taking a photo.

### Problem Statement
Thrift store shoppers and resellers struggle to quickly assess whether items are worth purchasing for resale. Researching prices across multiple platforms is time-consuming and often done on-the-fly in stores with poor connectivity.

### Solution
A streamlined app that provides instant resale valuations through photo analysis, eliminating the need for manual research.

### Target Users
- **Primary**: Casual thrift store shoppers wondering "Can I flip this?"
- **Secondary**: Part-time resellers looking for quick price checks
- **Not targeted**: Professional resellers (need more advanced features)

### Core Functionality (v0.1.0)

#### Primary Feature: Instant Price Analysis
1. **Photo Capture/Upload**
   - Take photo with device camera (mobile)
   - Upload existing photo (web/mobile)
   - 10MB file size limit

2. **AI Analysis** 
   - Item identification
   - Price range estimation (e.g., "$50-$150")
   - Style tier classification (Entry/Designer/Luxury)
   - Recommended selling platform based on tier:
     - Entry tier → eBay, Mercari, Facebook Marketplace
     - Designer tier → Poshmark, Vestiaire Collective
     - Luxury tier → The RealReal, Rebag, Fashionphile
   - Condition assessment (Poor/Fair/Good/Excellent)
   - Buy price calculation (resale price ÷ 5)

3. **Results Display**
   - Item name with style tier badge (color-coded)
   - Resale value range
   - Maximum buy price prominently displayed
   - Platform recommendation
   - Condition assessment
   - No save/share functionality
   - Results disappear on next scan

### Technical Specifications

#### Frontend
- **Platform**: React Native with Expo (mobile + web)
- **Code Size**: ~175 lines (single file)
- **Dependencies**: Minimal (expo, camera, image-picker)

#### Backend  
- **Platform**: Node.js with Express
- **Code Size**: ~109 lines (single file)
- **API**: 2 endpoints (health check + scan)
- **Dependencies**: 5 packages (cors, express, multer, openai, dotenv)

#### Infrastructure
- **Deployment**: Docker containers
- **Ports**: Backend (3000), Frontend (8080)
- **Database**: None
- **Storage**: None (in-memory processing only)
- **Authentication**: None

### User Journey
1. User opens app in browser or mobile
2. Taps "Choose Image" or "Take Photo"
3. Captures/selects item photo
4. Waits 2-3 seconds for analysis
5. Views results with:
   - Style tier badge (Entry/Designer/Luxury)
   - Resale price range
   - **Buy price in green** (1/5 of resale value)
   - Platform recommendation
6. Makes sourcing decision based on buy price
7. Repeats for next item

### What v0.1.0 Does NOT Include
- User accounts or login
- Scan history
- Saved results
- Sharing functionality  
- Batch scanning
- Offline mode
- Price alerts
- Barcode scanning
- Market trend data
- Multiple photos per item

### Success Metrics (Hypothetical)
- Time to price estimate: <5 seconds
- Analysis accuracy: User-perceived helpfulness
- App stability: <1% crash rate

### API Integration
- **Single Integration**: OpenAI Vision API (GPT-4o-mini)
- **API Usage**: 1 call per photo scan
- **Cost**: ~$0.002 per scan

### Deployment
- Local development via npm/expo
- Docker containers for consistent deployment  
- No cloud services required (except OpenAI API)

### Future Roadmap (Not Committed)
- v0.2: User accounts and scan history
- v0.3: Batch scanning and offline support
- v0.4: Price tracking and alerts
- v1.0: Full marketplace integration

### Constraints & Limitations
- Requires internet connection
- Limited by OpenAI API rate limits
- No data persistence
- English-only
- No regional price variations

### Security & Privacy
- No user data collected or stored
- Images processed in-memory only
- No cookies or tracking
- API key server-side only

### Development Philosophy
- Minimum Viable Product (MVP) approach
- "Simplest thing that works"
- Single-purpose tool
- No feature creep
- Clear boundaries

### Release Notes (v0.1.0)
- Initial proof of concept
- Basic photo-to-price functionality
- **NEW: Style tier classification (Entry/Designer/Luxury)**
- **NEW: Buy price calculation (÷5 rule for profitable sourcing)**
- Platform recommendations based on tier
- Web and mobile support
- Docker deployment ready

### User Stories Implemented

#### ✅ USER STORY 1: View Style Tier to Guide Listings
As a seller managing product listings, I can see a style tier label (Entry, Designer, or Luxury) so that I can price items accordingly and choose the right platform.

#### ✅ USER STORY 2: See Buy Price Based on Resale Value
As a reseller sourcing inventory, I can see a calculated Buy Price so that I know the maximum I should pay to stay profitable.

---
*Last Updated: January 2025*