# 🧠 Feedback Learning System Documentation

## Overview

The Feedback Learning System transforms user feedback into actionable improvements through automated pattern detection, manual overrides, and comprehensive reporting. This creates a continuous improvement loop that makes Flippi.ai smarter over time.

## Architecture

### Components

1. **Feedback Collection** - UI component that captures user responses
2. **GPT Analysis** - Categorizes feedback into actionable insights
3. **Pattern Detection** - Monitors for recurring issues
4. **Manual Overrides** - Admin-controlled adjustments
5. **Weekly Reports** - Automated summaries and trends
6. **Admin Dashboard** - Visual interface for monitoring

### Data Flow

```
User Feedback → GPT Analysis → Pattern Detection → Admin Review → Manual Override → Improved Results
                                        ↓
                                 Weekly Reports
```

## Features

### 1. Feedback Collection

Every analysis includes a feedback prompt:
- **Question**: "Was this analysis helpful?"
- **Options**: Yes/No + optional text feedback
- **Data Captured**:
  - Unique analysis_id
  - User response (helpful/not helpful)
  - Feedback text
  - Complete scan data
  - Item image
  - User description

### 2. GPT Categorization

OpenAI analyzes each feedback entry to determine:
- **Sentiment**: positive, negative, neutral
- **Category**: 
  - value_accuracy - pricing issues
  - authenticity_concern - Real Score problems
  - platform_suggestion - wrong marketplace recommended
  - ui_feedback - interface issues
  - technical_issue - bugs/errors
  - feature_request - new ideas
  - general_praise - positive feedback
- **Suggestion Type**: complaint, suggestion, praise, question, bug_report
- **Summary**: AI-generated 1-2 sentence summary

### 3. Pattern Detection

Automatically tracks negative feedback patterns:
- **Threshold**: 10+ similar complaints trigger a flag
- **Pattern Types**:
  - Brand-specific issues (e.g., "Gucci prices too high")
  - Category problems (e.g., "Bags always overpriced")
  - Platform suggestions (e.g., "Never recommend Poshmark")
- **Notifications**: Console alerts when patterns detected
- **Status**: Flagged → Resolved workflow

### 4. Manual Override System

Admins can create adjustments that automatically apply:

#### Override Types
- **Price Adjustment**: Modify estimated values
  - Percentage: "Reduce by 15%"
  - Fixed: "Subtract $50"
- **Score Adjustment**: Modify Real Score or Trending Score
  - Percentage: "Increase by 20%"
  - Fixed: "Add 10 points"

#### Override Examples
```javascript
{
  "override_type": "price_adjustment",
  "target_key": "gucci",
  "adjustment_type": "percentage",
  "adjustment_value": -15,
  "reason": "Consistent feedback that Gucci prices are 15% too high"
}
```

### 5. Weekly Reports

Automated summaries generated every Sunday:
- Total feedback count
- Sentiment breakdown (positive/negative/neutral)
- Most common issues by category
- Most affected brands
- Flagged patterns count
- Active overrides count
- Top 5 negative feedback examples

### 6. Admin Dashboard

React-based interface featuring:
- Real-time statistics
- Search and filter capabilities
- Category/sentiment filters
- Sortable feedback list
- Detailed view for each feedback
- Pattern management
- Override controls

## API Reference

### Feedback Endpoints

#### Submit Feedback
```
POST /api/feedback
{
  "analysis_id": "analysis_1234567890_abc123",
  "helped_decision": true,
  "feedback_text": "Price was perfect!",
  "user_description": "Gucci bag from Nordstrom",
  "image_data": "base64...",
  "scan_data": { ...analysis results... }
}
```

#### Trigger GPT Analysis
```
POST /api/feedback/analyze
```
Processes up to 50 unanalyzed feedback entries

#### Admin Dashboard Data
```
GET /api/feedback/admin?category=value_accuracy&sentiment=negative
```

#### Export Data
```
GET /api/feedback/export?format=csv
```

### Pattern Detection Endpoints

#### Get Flagged Patterns
```
GET /api/feedback/patterns
```

#### Resolve Pattern
```
POST /api/feedback/patterns/:id/resolve
```

### Override Endpoints

#### List All Overrides
```
GET /api/feedback/overrides
```

#### Create Override
```
POST /api/feedback/overrides
{
  "override_type": "price_adjustment",
  "target_key": "nike",
  "adjustment_type": "percentage",
  "adjustment_value": 10,
  "reason": "Nike items consistently undervalued"
}
```

#### Toggle Override Active Status
```
PUT /api/feedback/overrides/:id/toggle
```

### Report Endpoints

#### Generate Weekly Report
```
POST /api/feedback/reports/generate
```

#### Get Latest Report
```
GET /api/feedback/reports/latest
```

## Database Schema

### feedback
- id (PRIMARY KEY)
- analysis_id (UNIQUE)
- helped_decision (BOOLEAN)
- feedback_text (TEXT)
- user_description (TEXT)
- image_data (BLOB)
- scan_data (JSON)
- created_at (TIMESTAMP)

### feedback_analysis
- id (PRIMARY KEY)
- feedback_id (FOREIGN KEY)
- sentiment (TEXT)
- category (TEXT)
- suggestion_type (TEXT)
- summary (TEXT)
- gpt_response (JSON)
- analyzed_at (TIMESTAMP)

### pattern_detection
- id (PRIMARY KEY)
- pattern_type (TEXT)
- pattern_key (TEXT)
- occurrence_count (INTEGER)
- flagged (BOOLEAN)
- resolved (BOOLEAN)
- details (JSON)

### manual_overrides
- id (PRIMARY KEY)
- override_type (TEXT)
- target_key (TEXT)
- adjustment_type (TEXT)
- adjustment_value (REAL)
- active (BOOLEAN)
- applied_count (INTEGER)

### weekly_reports
- id (PRIMARY KEY)
- report_date (DATE)
- total_feedback (INTEGER)
- report_data (JSON)

## Implementation Guide

### Adding New Pattern Types

1. Add to `PATTERN_TYPES` in patternDetector.js
2. Create detection logic in `detectPatterns()`
3. Update notification system

### Creating Custom Overrides

1. Define override type in `OVERRIDE_TYPES`
2. Implement application logic in `applyOverrides()`
3. Add UI controls in admin dashboard

### Extending Reports

1. Add data collection in `generateWeeklyReport()`
2. Update summary generation
3. Enhance dashboard visualization

## Best Practices

1. **Review Patterns Weekly**: Check flagged patterns every Monday
2. **Test Overrides**: Start with small adjustments (5-10%)
3. **Document Changes**: Always add reason when creating overrides
4. **Monitor Impact**: Track positive feedback rate after changes
5. **Export Regularly**: Download data monthly for ML training

## Troubleshooting

### Common Issues

1. **Patterns Not Detecting**
   - Check threshold (default: 10)
   - Verify negative sentiment
   - Confirm category matching

2. **Overrides Not Applying**
   - Check active status
   - Verify target_key matches
   - Review expiration date

3. **Reports Not Generating**
   - Ensure feedback exists for date range
   - Check database connections
   - Verify cron job running

## Future Enhancements

1. **Automated Override Suggestions** - AI recommends adjustments
2. **A/B Testing** - Test override effectiveness
3. **Custom ML Model** - Train on exported data
4. **Real-time Notifications** - Slack/email alerts
5. **Predictive Analytics** - Forecast issues before they occur

## Security Considerations

1. **Admin Access**: Limited to authorized emails
2. **Data Privacy**: Image data stored securely
3. **Rate Limiting**: GPT analysis throttled
4. **Input Validation**: All feedback sanitized
5. **Audit Trail**: All changes logged

## Maintenance

### Daily
- Monitor console for pattern notifications
- Check for failed GPT analyses

### Weekly
- Review flagged patterns
- Generate and review weekly report
- Adjust overrides based on feedback

### Monthly
- Export data for ML training
- Review override effectiveness
- Clean resolved patterns