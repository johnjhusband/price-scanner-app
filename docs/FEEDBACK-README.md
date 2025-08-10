# Flippi.ai Feedback Learning System

## Quick Start

The Feedback Learning System helps Flippi.ai learn from user feedback to improve pricing accuracy, authenticity detection, and platform recommendations.

### For Users
After each scan, you'll see:
- "Was this analysis helpful?" 
- Yes/No buttons
- Optional text field: "Have an idea for Flippi? We're listening."

Your feedback directly improves the app!

### For Admins

1. **Access Dashboard**: Click "Admin" button (top-right)
2. **View Feedback**: Search, filter, and analyze user responses
3. **Monitor Patterns**: Check for auto-flagged issues
4. **Create Overrides**: Adjust prices/scores based on feedback
5. **Generate Reports**: Weekly summaries of all feedback

## Key Features

### 🔍 Pattern Detection
Automatically detects when 10+ users report the same issue:
- "Gucci prices too high" 
- "Nike trending scores too low"
- "Wrong platform recommendations"

### 🔧 Manual Overrides
Fix issues immediately:
```
"Reduce all Gucci prices by 15%"
"Increase Nike trending scores by 10 points"
```

### 📊 Weekly Reports
Every Sunday, get a summary:
- Total feedback count
- Positive vs negative ratio
- Most common complaints
- Most affected brands

## Admin Guide

### Dashboard Access
Limited to authorized emails:
- john@flippi.ai
- tarahusband@gmail.com
- teamflippi@gmail.com
- tara@edgy.co

### Common Tasks

#### View Flagged Patterns
1. Open Admin Dashboard
2. Look for "⚠️ Pattern Detected" alerts
3. Review the pattern details
4. Create override or mark as resolved

#### Create Price Override
1. Click "Overrides" tab
2. Click "New Override"
3. Select:
   - Type: Price Adjustment
   - Brand: Gucci
   - Adjustment: -15%
   - Reason: "Consistent feedback prices too high"
4. Save and it applies immediately

#### Generate Weekly Report
1. Click "Reports" tab
2. Click "Generate Report"
3. View summary and export data

### API Examples

#### Trigger Feedback Analysis
```bash
curl -X POST https://app.flippi.ai/api/feedback/analyze
```

#### Create Override
```bash
curl -X POST https://app.flippi.ai/api/feedback/overrides \
  -H "Content-Type: application/json" \
  -d '{
    "override_type": "price_adjustment",
    "target_key": "gucci",
    "adjustment_type": "percentage",
    "adjustment_value": -15,
    "reason": "User feedback indicates prices 15% too high"
  }'
```

#### Export Feedback Data
```bash
curl https://app.flippi.ai/api/feedback/export?format=csv > feedback.csv
```

## How It Works

1. **Collection**: Every scan generates unique analysis_id
2. **Storage**: Feedback stored with full context
3. **Analysis**: GPT categorizes into actionable insights
4. **Detection**: Patterns emerge from similar complaints
5. **Action**: Admins create overrides
6. **Application**: Next scan automatically adjusts
7. **Reporting**: Weekly summaries track progress

## Categories

Feedback is automatically categorized:

- **value_accuracy**: Pricing too high/low
- **authenticity_concern**: Real Score issues  
- **platform_suggestion**: Wrong marketplace
- **ui_feedback**: Interface problems
- **technical_issue**: Bugs/errors
- **feature_request**: New ideas
- **general_praise**: Positive feedback

## Best Practices

1. **Review Weekly**: Check patterns every Monday
2. **Start Small**: Test overrides at 5-10% first
3. **Document Reasons**: Always explain why creating override
4. **Monitor Impact**: Track if positive feedback increases
5. **Export Monthly**: Download data for deeper analysis

## Troubleshooting

### Patterns Not Detecting
- Need 10+ similar complaints
- Must be negative sentiment
- Check category matches

### Overrides Not Working
- Verify brand name spelling
- Check override is active
- Ensure no expiration date

### No Weekly Report
- Need feedback from past 7 days
- Run manual generation
- Check database connection

## Future Roadmap

- [ ] Email notifications for patterns
- [ ] A/B testing overrides
- [ ] ML model training
- [ ] Slack integration
- [ ] Predictive warnings

## Support

For issues or questions:
1. Check existing patterns first
2. Review weekly reports
3. Contact dev team if needed

Remember: Every piece of feedback makes Flippi smarter! 🧠