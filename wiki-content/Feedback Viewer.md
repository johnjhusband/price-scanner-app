# Feedback Viewer

## 📝 User Feedback Management System

### Overview

The Feedback Viewer allows admins to view, analyze, and manage user feedback. All feedback is processed with AI for automatic categorization and sentiment analysis.

## 🔐 Access

### Who Can Access
- Admin access only (see [[Admin Dashboard]])
- Authorized emails:
  - teamflippi@gmail.com
  - tara@edgy.co

### Where to Find It
- **Admin Dashboard** → Feedback Tab
- **Mobile App**: Visible to admin users only

## 📊 Features

### Feedback List View
- User email and feedback text
- AI-detected category and sentiment
- Submission date
- Review status

### AI Analysis
- **Automatic categorization**: Bug reports, feature requests, pricing feedback, etc.
- **Sentiment detection**: Positive, neutral, or negative
- **Powered by**: GPT-4 analysis
- **Trigger**: Click "Analyze with AI" button

### Categories
- 🐛 Bug Reports
- ✨ Feature Requests
- 💰 Pricing Feedback
- 🎨 UI/UX Issues
- ⚡ Performance Problems
- 💬 General Comments

### Filtering & Search
- Filter by category or sentiment
- Search by user email
- Date range filtering
- Export functionality

## 🛠️ API Endpoints

```
GET /api/feedback - List all feedback
POST /api/feedback/:id/analyze - Trigger AI analysis
```

## 💡 Best Practices

1. **Review daily** - Check new feedback each morning
2. **Prioritize negative** - Address complaints first
3. **Track patterns** - Similar feedback indicates real issues
4. **Respond promptly** - Acknowledge user concerns

## 📧 Contact

For all feedback-related questions: teamflippi@gmail.com

[[Home]] | [[Admin Dashboard]] | [[Metrics & Reporting]]