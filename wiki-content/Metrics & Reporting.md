# Metrics & Reporting

## 📊 Analytics and Performance Tracking

### Overview

Track key metrics for the Flippi platform including user activity, scan usage, feedback trends, and system performance.

## 🎯 Key Metrics

### User Metrics
- **Total Users**: Active user count
- **New Users**: Daily/weekly/monthly signups
- **Retention Rate**: Users returning after first scan
- **High-Value Users**: 20+ scans
- **Churn Rate**: Users who stop using

### Activity Metrics
- **Total Scans**: All-time item scans
- **Daily Active Users (DAU)**: Unique daily users
- **Scans per User**: Average usage
- **Popular Items**: Most scanned categories
- **Peak Hours**: Usage patterns

### Business Metrics
- **Conversion Rate**: Free to paid (when active)
- **Scan Limit Usage**: % reaching free limit
- **Feature Adoption**: Which features get used
- **Platform Distribution**: iOS vs Android vs Web

## 📈 Reporting Tools

### Admin Dashboard
- Real-time metrics display
- User activity tracking
- Feedback analytics
- Visual charts and graphs

### Database Queries
Key tables for metrics:
- `users` - User data and activity
- `flip_tracking` - Scan history
- `flip_history` - Item details
- `feedback` - User feedback

### Growth Dashboard
- Reddit monitoring metrics
- Content generation stats
- SEO performance
- Traffic sources

## 📊 Report Types

### Daily Reports
- New users
- Total scans
- Error rate
- Feedback count

### Weekly Reports
- User growth trend
- Feature usage
- Top scanned items
- System health

### Monthly Reports
- Revenue metrics (future)
- Retention cohorts
- Platform comparison
- Strategic KPIs

## 🔍 How to Access

### Quick Stats
1. Admin Dashboard → Metrics Tab
2. View real-time numbers
3. Export data as needed

### Deep Analysis
1. Direct database queries
2. Custom SQL reports
3. Export to spreadsheet
4. Create visualizations

## 📝 SQL Examples

### High-Value Users
```sql
SELECT email, scan_count, last_login
FROM users
WHERE scan_count >= 20
ORDER BY scan_count DESC;
```

### Daily Active Users
```sql
SELECT DATE(created_at) as date, 
       COUNT(DISTINCT user_id) as dau
FROM flip_tracking
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY DATE(created_at);
```

### Popular Categories
```sql
SELECT category, COUNT(*) as count
FROM flip_history
GROUP BY category
ORDER BY count DESC
LIMIT 10;
```

## 🚨 Metrics to Monitor

### Red Flags
- DAU dropping >10%
- Error rate >5%
- Scan failures increasing
- Negative feedback spike

### Success Indicators
- Steady user growth
- High retention (>40%)
- Positive feedback trend
- Low error rate (<2%)

## 📧 Reporting Schedule

### Automated Reports
- **Daily**: System health check
- **Weekly**: User activity summary
- **Monthly**: Business metrics review

### Recipients
- teamflippi@gmail.com
- tara@edgy.co

## 🔗 Related Tools

- [[Admin Dashboard]] - Real-time metrics
- [[Feedback Viewer]] - User sentiment
- [[Growth-Platform]] - Content metrics

[[Home]] | [[Admin Dashboard]] | [[Feedback Viewer]]