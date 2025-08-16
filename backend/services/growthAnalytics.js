/**
 * Growth Analytics Service
 * Handles tracking of content views, clicks, shares, and conversions
 */

const db = require('../database');
const crypto = require('crypto');

class GrowthAnalyticsService {
    /**
     * Track an analytics event
     * @param {Object} eventData - Event details
     * @returns {Promise<number>} Event ID
     */
    static async trackEvent(eventData) {
        const {
            contentId,
            eventType, // 'view', 'click', 'share', 'conversion'
            eventSource = 'direct',
            eventData: data = {},
            userAgent = '',
            ipAddress = '',
            referrer = '',
            sessionId = null
        } = eventData;

        // Validate event type
        const validTypes = ['view', 'click', 'share', 'conversion'];
        if (!validTypes.includes(eventType)) {
            throw new Error(`Invalid event type: ${eventType}`);
        }

        // Generate session ID if not provided
        const session = sessionId || this.generateSessionId();

        return new Promise((resolve, reject) => {
            const query = `
                INSERT INTO growth_analytics_events 
                (content_id, event_type, event_source, event_data, user_agent, ip_address, referrer, session_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `;

            db.run(query, [
                contentId,
                eventType,
                eventSource,
                JSON.stringify(data),
                userAgent,
                ipAddress,
                referrer,
                session
            ], function(err) {
                if (err) {
                    console.error('Error tracking event:', err);
                    reject(err);
                } else {
                    // Also update daily metrics
                    GrowthAnalyticsService.updateDailyMetrics(contentId, eventType, eventSource)
                        .catch(err => console.error('Error updating daily metrics:', err));
                    
                    resolve(this.lastID);
                }
            });
        });
    }

    /**
     * Track a page view
     * @param {number} contentId - Content ID
     * @param {Object} metadata - Additional metadata
     */
    static async trackView(contentId, metadata = {}) {
        return this.trackEvent({
            contentId,
            eventType: 'view',
            ...metadata
        });
    }

    /**
     * Track a click event
     * @param {number} contentId - Content ID
     * @param {string} clickTarget - What was clicked
     * @param {Object} metadata - Additional metadata
     */
    static async trackClick(contentId, clickTarget, metadata = {}) {
        return this.trackEvent({
            contentId,
            eventType: 'click',
            eventData: { target: clickTarget },
            ...metadata
        });
    }

    /**
     * Track a share event
     * @param {number} contentId - Content ID
     * @param {string} platform - Share platform
     * @param {Object} metadata - Additional metadata
     */
    static async trackShare(contentId, platform, metadata = {}) {
        return this.trackEvent({
            contentId,
            eventType: 'share',
            eventSource: platform,
            eventData: { platform },
            ...metadata
        });
    }

    /**
     * Track a conversion
     * @param {number} contentId - Content ID
     * @param {string} conversionType - Type of conversion
     * @param {Object} metadata - Additional metadata
     */
    static async trackConversion(contentId, conversionType = 'signup', metadata = {}) {
        return this.trackEvent({
            contentId,
            eventType: 'conversion',
            eventData: { type: conversionType },
            ...metadata
        });
    }

    /**
     * Update daily metrics
     * @private
     */
    static async updateDailyMetrics(contentId, eventType, platform) {
        const today = new Date().toISOString().split('T')[0];
        
        return new Promise((resolve, reject) => {
            const query = `
                INSERT INTO growth_daily_metrics (date, content_id, platform, views, clicks, shares, conversions)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(date, content_id, platform) DO UPDATE SET
                    views = views + ?,
                    clicks = clicks + ?,
                    shares = shares + ?,
                    conversions = conversions + ?
            `;

            const isView = eventType === 'view' ? 1 : 0;
            const isClick = eventType === 'click' ? 1 : 0;
            const isShare = eventType === 'share' ? 1 : 0;
            const isConversion = eventType === 'conversion' ? 1 : 0;

            db.run(query, [
                today, contentId, platform,
                isView, isClick, isShare, isConversion,
                isView, isClick, isShare, isConversion
            ], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    /**
     * Get content metrics
     * @param {number} contentId - Content ID
     * @returns {Promise<Object>} Metrics object
     */
    static async getContentMetrics(contentId) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT 
                    m.*,
                    c.title,
                    c.published,
                    c.created_at as content_created
                FROM growth_content_metrics m
                LEFT JOIN content_generated c ON m.content_id = c.id
                WHERE m.content_id = ?
            `;

            db.get(query, [contentId], (err, row) => {
                if (err) reject(err);
                else if (!row) {
                    // Return default metrics if none exist
                    resolve({
                        content_id: contentId,
                        total_views: 0,
                        unique_views: 0,
                        total_clicks: 0,
                        total_shares: 0,
                        total_conversions: 0,
                        platform_breakdown: {}
                    });
                } else {
                    // Parse JSON fields
                    if (row.platform_breakdown) {
                        try {
                            row.platform_breakdown = JSON.parse(row.platform_breakdown);
                        } catch (e) {
                            row.platform_breakdown = {};
                        }
                    }
                    resolve(row);
                }
            });
        });
    }

    /**
     * Get analytics for date range
     * @param {Date} startDate - Start date
     * @param {Date} endDate - End date
     * @param {number} contentId - Optional content ID filter
     * @returns {Promise<Array>} Daily metrics
     */
    static async getAnalyticsForDateRange(startDate, endDate, contentId = null) {
        return new Promise((resolve, reject) => {
            let query = `
                SELECT 
                    date,
                    content_id,
                    platform,
                    SUM(views) as views,
                    SUM(clicks) as clicks,
                    SUM(shares) as shares,
                    SUM(conversions) as conversions
                FROM growth_daily_metrics
                WHERE date >= ? AND date <= ?
            `;
            
            const params = [
                startDate.toISOString().split('T')[0],
                endDate.toISOString().split('T')[0]
            ];

            if (contentId) {
                query += ' AND content_id = ?';
                params.push(contentId);
            }

            query += ' GROUP BY date, content_id, platform ORDER BY date DESC';

            db.all(query, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    /**
     * Get platform breakdown
     * @param {Date} startDate - Start date
     * @param {Date} endDate - End date
     * @returns {Promise<Object>} Platform metrics
     */
    static async getPlatformBreakdown(startDate, endDate) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT 
                    platform,
                    SUM(views) as total_views,
                    SUM(clicks) as total_clicks,
                    SUM(shares) as total_shares,
                    SUM(conversions) as total_conversions,
                    COUNT(DISTINCT content_id) as content_count
                FROM growth_daily_metrics
                WHERE date >= ? AND date <= ?
                GROUP BY platform
                ORDER BY total_views DESC
            `;

            db.all(query, [
                startDate.toISOString().split('T')[0],
                endDate.toISOString().split('T')[0]
            ], (err, rows) => {
                if (err) reject(err);
                else {
                    // Convert to object for easier access
                    const breakdown = {};
                    rows.forEach(row => {
                        breakdown[row.platform] = {
                            views: row.total_views,
                            clicks: row.total_clicks,
                            shares: row.total_shares,
                            conversions: row.total_conversions,
                            contentCount: row.content_count
                        };
                    });
                    resolve(breakdown);
                }
            });
        });
    }

    /**
     * Generate a session ID
     * @private
     */
    static generateSessionId() {
        return crypto.randomBytes(16).toString('hex');
    }

    /**
     * Generate tracking code for content
     * @param {number} contentId - Content ID
     * @returns {string} Tracking code
     */
    static generateTrackingCode(contentId) {
        const hash = crypto.createHash('sha256')
            .update(`${contentId}-${Date.now()}-${Math.random()}`)
            .digest('hex');
        return hash.substring(0, 8);
    }

    /**
     * Get top performing content
     * @param {number} limit - Number of results
     * @param {string} metric - Metric to sort by
     * @returns {Promise<Array>} Top content
     */
    static async getTopContent(limit = 10, metric = 'total_views') {
        const validMetrics = ['total_views', 'total_clicks', 'total_shares', 'total_conversions'];
        if (!validMetrics.includes(metric)) {
            metric = 'total_views';
        }

        return new Promise((resolve, reject) => {
            const query = `
                SELECT 
                    m.*,
                    c.title,
                    c.published,
                    c.created_at
                FROM growth_content_metrics m
                JOIN content_generated c ON m.content_id = c.id
                ORDER BY m.${metric} DESC
                LIMIT ?
            `;

            db.all(query, [limit], (err, rows) => {
                if (err) reject(err);
                else {
                    // Parse JSON fields
                    rows.forEach(row => {
                        if (row.platform_breakdown) {
                            try {
                                row.platform_breakdown = JSON.parse(row.platform_breakdown);
                            } catch (e) {
                                row.platform_breakdown = {};
                            }
                        }
                    });
                    resolve(rows);
                }
            });
        });
    }
}

module.exports = GrowthAnalyticsService;