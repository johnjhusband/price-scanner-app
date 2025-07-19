# Product Requirements Document: User Feedback Feature v1.0

## Executive Summary

This document outlines the requirements for implementing a user feedback collection system in Flippi.ai. The feature will capture the complete interaction cycle: what the user showed/said (image + description), what the AI analyzed (OpenAI results), and what the user thought about the analysis (feedback). This comprehensive data collection will enable product improvement while maintaining the application's primarily stateless architecture and implementing robust security measures.

## Feature Overview

After receiving item analysis results, users will be prompted to provide feedback on whether the results helped them make a decision. This feedback will be stored securely for product improvement purposes.

## User Story

"As a reseller, collector, or deal-hunter, I want to snap a photo of an item and instantly understand its resale value, authenticity, and selling potential, so that I can make smarter decisions about what to buy, how much to pay, or where to list it."

## Functional Requirements

### User Flow

1. User completes item scan and views results
2. Feedback prompt appears below results:
   - Text: "Did this result help you make a decision?"
   - Options: [✅ Yes] [❌ No]
3. Text input field appears:
   - Placeholder: "Be honest — we're listening."
   - Optional if "Yes" selected
   - Required if "No" selected
4. User submits feedback
5. Confirmation message: "✅ Thanks for your feedback — we use every note to make the app better."
6. Feedback form is disabled to prevent duplicate submissions

### Data Collection

Each feedback submission will store:
- `helped_decision`: Boolean (Yes/No response)
- `feedback_text`: String (user's text input, max 500 characters)
- `user_description`: String (the text description user provided for analysis, if any)
- `image_data`: BLOB (the actual image uploaded by user)
- `scan_data`: JSON object containing the OpenAI analysis results
- `timestamp`: ISO 8601 timestamp

### Constraints

- One feedback submission per scan
- Anonymous feedback (no user identification)
- No analytics dashboard in MVP
- Mobile-responsive design required

## Technical Requirements

### Architecture

The application maintains its stateless architecture for the primary scanning functionality. Only when users choose to provide feedback does the system interact with persistent storage.

- **Stateless Path**: Image upload → Analysis → Results (no database interaction)
- **Stateful Path**: User provides feedback → Database write (single interaction)

### Database Choice (MVP)

**SQLite** - Selected for MVP simplicity
- File-based, no separate database server needed
- Sufficient for feedback collection volume
- Easy backup and migration
- Can upgrade to PostgreSQL later if needed
- Note: Storing images as BLOBs will increase database size significantly (~100KB-5MB per feedback entry)

### Database Schema

```sql
CREATE TABLE feedback (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    helped_decision BOOLEAN NOT NULL,
    feedback_text TEXT,
    user_description TEXT,
    image_data BLOB NOT NULL,
    scan_data JSON NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CHECK (length(feedback_text) <= 500)
);
```

## Security Requirements

### 1. Input Validation

- **Strict field validation**: Only accept exact fields specified above
- **Text length limit**: Maximum 500 characters for feedback_text
- **HTML/Script stripping**: Sanitize all text input
- **JSON structure validation**: Verify scan_data matches expected schema

### 2. Database Security

#### Database User Permissions
```sql
-- Create limited user (for future PostgreSQL migration)
-- SQLite doesn't support users, but document intended permissions
-- User: feedback_writer
-- Permissions: INSERT only on feedback table
-- No SELECT, UPDATE, DELETE permissions
```

#### Connection Security
- Database file stored outside web root
- File permissions: 600 (read/write by app user only)
- Database file path in .env, never in code

### 3. API Security

#### Request Validation
- Validate Content-Type is application/json
- Maximum request body size: 15MB (to accommodate image data)

### 4. Access Control

- Feedback endpoint is write-only from client perspective
- No API endpoints to read feedback data
- Admin access to feedback data requires direct server access

## Implementation Details

### Backend Changes

1. **New Dependencies**
   ```json
   {
     "better-sqlite3": "^12.2.0",
     "express-validator": "^7.2.1"
   }
   ```

2. **New Endpoint**
   ```
   POST /api/feedback
   
   Request Body:
   {
     "helped_decision": true/false,
     "feedback_text": "optional text",
     "user_description": "text user provided for analysis",
     "image_data": "base64-encoded-image",
     "scan_data": { ...OpenAI analysis results... }
   }
   
   Response:
   Success: { "success": true, "message": "Feedback received" }
   Error: { "success": false, "error": "Invalid request" }
   ```

3. **Environment Variables**
   ```bash
   # Add to .env files for each environment
   
   # Production (.env in /var/www/app.flippi.ai/backend/)
   FEEDBACK_DB_PATH=/var/lib/flippi/feedback.db
   
   # Staging (.env in /var/www/green.flippi.ai/backend/)
   FEEDBACK_DB_PATH=/var/lib/flippi-staging/feedback.db
   
   # Development (.env in /var/www/blue.flippi.ai/backend/)
   FEEDBACK_DB_PATH=/var/lib/flippi-dev/feedback.db
   ```

### Frontend Changes

1. **New Component**: `<FeedbackPrompt />`
   - Renders with analysis results
   - Handles form state and submission
   - Shows confirmation and disables on success

2. **Data Management**
   - Store scan context in component state:
     - user_description (if provided)
     - image_data (base64 encoded)
     - scan_data (OpenAI analysis results)
   - Pass all context with feedback submission

### Deployment Considerations

1. **Database File Location**
   - Production: `/var/lib/flippi/feedback.db`
   - Staging: `/var/lib/flippi-staging/feedback.db`
   - Development: `/var/lib/flippi-dev/feedback.db`


## MVP Simplifications

1. **Database**: SQLite instead of PostgreSQL
2. **Authentication**: None
3. **Analytics**: No dashboard, direct database queries only
4. **Monitoring**: Basic logging, no advanced metrics
5. **Data Processing**: No real-time analysis of feedback


## Acceptance Criteria

- [ ] Feedback prompt appears after every scan result
- [ ] Text field is optional for "Yes", required for "No"
- [ ] Submission limited to once per scan
- [ ] All security measures implemented
- [ ] Mobile responsive design
- [ ] 500 character limit enforced
- [ ] Input validation prevents malformed data
- [ ] Database writes are isolated from scan functionality
- [ ] No performance impact on primary scan feature

## Risk Mitigation

1. **Database Corruption**: Regular backups, write-ahead logging
2. **Spam/Abuse**: Input validation
3. **Performance Impact**: Async writes
4. **Security Breach**: Minimal permissions

---

*Document Version: 1.2*  
*Last Updated: July 2025*  
*Author: Product Team*