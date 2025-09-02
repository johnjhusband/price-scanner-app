# Flippi.ai Screen Naming Conventions

Since Flippi.ai is a single-page application (SPA), all screens share the same URL. Here's how we refer to different screens/states:

## Main Screens

### 1. **Login Screen** (EnterScreen.js)
- **URL**: `https://[domain]/` (when not authenticated)
- **Description**: Welcome screen with Google Sign-In button
- **Key Elements**: Logo, tagline, OAuth button, Terms/Privacy/Mission links

### 2. **Home Screen** (Main Upload Interface)
- **URL**: `https://[domain]/` (after authentication)
- **Description**: Main interface where users choose input method
- **Key Elements**: 
  - Text input field (always visible)
  - "Choose from Gallery" button
  - "Take Photo" button  
  - Drag & drop zone
  - "Never Over Pay" header

### 3. **Camera Capture Screen** (WebCameraView)
- **URL**: `https://[domain]/` (when camera active)
- **Description**: Live camera view with capture button
- **Key Elements**: Video preview, Capture button, Close button

### 4. **Image Preview Screen**
- **URL**: `https://[domain]/` (after image selected)
- **Description**: Shows selected image before analysis
- **Key Elements**: Image preview, "Analyze" button, "Choose Another" button

### 5. **Results Screen** 
- **URL**: `https://[domain]/` (after analysis)
- **Description**: Shows AI analysis results
- **Key Elements**:
  - Item name and description
  - Authenticity score
  - Price range
  - Platform recommendations
  - Environmental impact tag
  - "Scan Another Item" button

## Modal Overlays

### 6. **Mission Modal** (MissionModal.js)
- **Trigger**: Click "Mission" link on Login Screen
- **Description**: Full-screen modal with company mission

### 7. **Feedback Modal** (FeedbackPrompt.js)
- **Trigger**: After certain number of scans
- **Description**: Rating and feedback collection

## Legal Pages (Separate Routes)

### 8. **Terms Page**
- **URL**: `https://[domain]/terms`
- **File**: `mobile-app/terms.html`

### 9. **Privacy Page**  
- **URL**: `https://[domain]/privacy`
- **File**: `mobile-app/privacy.html`

### 10. **Mission Page**
- **URL**: `https://[domain]/mission`
- **File**: `mobile-app/mission.html`

### 11. **Contact Page**
- **URL**: `https://[domain]/contact`
- **File**: `mobile-app/contact.html`

## How UX Tickets Map to Screens

- **Issue #88-89**: Affect **Results Screen** (progressive disclosure, text reduction)
- **Issue #90**: Affects **Home Screen** and **Results Screen** (mobile layout)
- **Issue #91**: Affects all authenticated screens (bottom nav)
- **Issue #92**: Affects **Home Screen** and **Results Screen** (gestures)

## State-Based Naming

When referring to screens in documentation/tickets, use:
- "Login Screen" not "Enter page"
- "Home Screen" not "Upload interface" 
- "Results Screen" not "Analysis view"
- "Camera Screen" not "Capture mode"

This consistency helps everyone understand which part of the app we're discussing.