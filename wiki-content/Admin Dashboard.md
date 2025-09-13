# Admin Dashboard

## 🔐 Admin Access & Features

### Who Has Admin Access

Admin access is restricted to authorized emails:
- teamflippi@gmail.com
- tara@edgy.co

### How to Access

1. **Mobile App**: Admin tab appears automatically for authorized emails
2. **Web**: Navigate to `/admin` after signing in

## 📊 Dashboard Features

### 1. Feedback Tab

View and analyze all user feedback:

**Features:**
- **Real-time feedback list** - See latest user comments
- **AI-powered analysis** - Automatic sentiment & category detection
- **Search & filter** - Find specific feedback quickly
- **Category breakdown** - Visual charts of feedback types
- **Detailed view** - Click any feedback for full details

**Categories Tracked:**
- Bug Reports
- Feature Requests
- Pricing Feedback
- UI/UX Issues
- Performance Problems
- General Comments

**Actions Available:**
- Trigger AI analysis of new feedback
- Export feedback data
- Mark as reviewed
- View user details

### 2. User Activity Tab

Monitor user engagement and behavior:

**Metrics Shown:**
- **Total users** - Complete user count
- **High-value users** - Users with 20+ scans
- **Login frequency** - Track user retention
- **Scan activity** - Items analyzed per user
- **Feedback participation** - Who's giving feedback

**User List Features:**
- Sort by: Last login, scan count, feedback count
- Search by email or name
- View detailed user profile
- Export user data

### 3. Growth Dashboard

Access content automation metrics:

**Reddit Monitoring:**
- Current monitoring status
- Posts discovered today
- Content generation stats
- Error tracking

**Performance Metrics:**
- Questions per platform
- Conversion rates
- Traffic from content
- Top performing posts

**Manual Controls:**
- Trigger Reddit check
- Select posts for blogs
- View generated content

## 🛠️ Admin Backend Routes

### User Management
```
GET /api/auth/users/all - List all users with stats
```

### Feedback API
```
GET /api/feedback - Get all feedback
POST /api/feedback/:id/analyze - Trigger AI analysis
```

### Growth Admin
```
GET /growth/questions - Manual post selection UI
POST /api/growth/admin/trigger-monitoring - Force Reddit check
```

### System Admin
```
GET /admin/nginx-status - Check server config
POST /admin/fix-nginx - Run nginx fix script
```

### Automation Control
```
GET /admin/automation - Control panel
GET /admin/automation/performance - Performance charts
```

## 🔧 Admin Tools

### Feedback Analysis System

**How It Works:**
1. User submits feedback
2. Admin triggers AI analysis
3. GPT-4 categorizes and extracts sentiment
4. Results stored in database
5. Charts update automatically

**AI Categories:**
- bug_report
- feature_request
- pricing_feedback
- ui_ux_issue
- performance_problem
- general_comment

### User Activity Tracking

**Data Collected:**
- First & last login timestamps
- Total login count
- Items scanned count
- Feedback submitted count
- Account creation date

**High-Value User Definition:**
- 20+ items scanned
- Shown separately in dashboard
- Target for retention efforts

### Automation Dashboard

**Features:**
- Start/stop Reddit monitoring
- View automation logs
- Performance metrics
- Error tracking
- Manual intervention tools

## 📈 Using Admin Features

### Daily Checks

1. **Review new feedback** - Check Feedback tab
2. **Monitor user growth** - Check User Activity
3. **Check automation** - Verify Reddit monitoring
4. **Review errors** - Check automation logs

### Weekly Tasks

1. **Analyze feedback trends** - Look for patterns
2. **Export user data** - Track growth metrics
3. **Content performance** - Review top posts
4. **System health** - Check error rates

### Responding to Issues

**High Error Rate:**
1. Check automation dashboard
2. View recent errors
3. Manually trigger if needed
4. Monitor for resolution

**User Complaints:**
1. Search feedback for user
2. View their activity
3. Check scan history
4. Respond via email

## 🚨 Security Notes

### Current Limitations

⚠️ **Important Security Gaps:**
- `/api/auth/users/all` needs authentication
- Admin emails are hardcoded
- No role-based access control
- Admin key in source code

### Best Practices

1. **Never share admin URLs publicly**
2. **Use strong Google account security**
3. **Monitor access logs**
4. **Report suspicious activity**

## 🔄 Future Improvements

Planned enhancements:
- Proper RBAC system
- Admin action audit logs
- Two-factor authentication
- API key management
- User impersonation (for support)

## 💡 Tips & Tricks

1. **Bookmark key pages** - Quick access to tools
2. **Set up alerts** - For high-priority feedback
3. **Export regularly** - Keep local backups
4. **Document decisions** - Track why changes made

[[Home]] | [[Feedback Viewer]] | [[Metrics & Reporting]]