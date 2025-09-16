/**
 * Growth Analytics Service
 * Handles tracking of content views, clicks, shares, and conversions
 */

const { getDatabase } = require('../database');
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

        try {
            const db = getDatabase();
            const stmt = db.prepare(`
                INSERT INTO growth_analytics_events 
                (content_id, event_type, event_source, event_data, user_agent, ip_address, referrer, session_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `);

            const result = stmt.run(
                contentId,
                eventType,
                eventSource,
                JSON.stringify(data),
                userAgent,
                ipAddress,
                referrer,
                session
            );

            // Also update daily metrics
            this.updateDailyMetrics(contentId, eventType, eventSource)
                .catch(err => console.error('Error updating daily metrics:', err));
            
            return result.lastInsertRowid;
        } catch (error) {
            console.error('Error tracking event:', error);
            throw error;
        }
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
        
        try {
            const db = getDatabase();
            const stmt = db.prepare(`
                INSERT INTO growth_daily_metrics (date, content_id, platform, views, clicks, shares, conversions)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(date, content_id, platform) DO UPDATE SET
                    views = views + ?,
                    clicks = clicks + ?,
                    shares = shares + ?,
                    conversions = conversions + ?
            `);

            const isView = eventType === 'view' ? 1 : 0;
            const isClick = eventType === 'click' ? 1 : 0;
            const isShare = eventType === 'share' ? 1 : 0;
            const isConversion = eventType === 'conversion' ? 1 : 0;

            stmt.run(
                today, contentId, platform,
                isView, isClick, isShare, isConversion,
                isView, isClick, isShare, isConversion
            );
        } catch (error) {
            console.error('Error updating daily metrics:', error);
            throw error;
        }
    }

    /**
     * Get content metrics
     * @param {number} contentId - Content ID
     * @returns {Promise<Object>} Metrics object
     */
    static async getContentMetrics(contentId) {
        try {
            const db = getDatabase();
            const stmt = db.prepare(`
                SELECT 
                    m.*,
                    c.title,
                    c.published,
                    c.created_at as content_created
                FROM growth_content_metrics m
                LEFT JOIN content_generated c ON m.content_id = c.id
                WHERE m.content_id = ?
            `);

            const row = stmt.get(contentId);
            
            if (!row) {
                // Return default metrics if none exist
                return {
                    content_id: contentId,
                    total_views: 0,
                    unique_views: 0,
                    total_clicks: 0,
                    total_shares: 0,
                    total_conversions: 0,
                    platform_breakdown: {}
                };
            }

            // Parse JSON fields
            if (row.platform_breakdown) {
                try {
                    row.platform_breakdown = JSON.parse(row.platform_breakdown);
                } catch (e) {
                    row.platform_breakdown = {};
                }
            }
            
            return row;
        } catch (error) {
            console.error('Error getting content metrics:', error);
            throw error;
        }
    }

    /**
     * Get analytics for date range
     * @param {Date} startDate - Start date
     * @param {Date} endDate - End date
     * @param {number} contentId - Optional content ID filter
     * @returns {Promise<Array>} Daily metrics
     */
    static async getAnalyticsForDateRange(startDate, endDate, contentId = null) {
        try {
            const db = getDatabase();
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

            const stmt = db.prepare(query);
            return stmt.all(...params);
        } catch (error) {
            console.error('Error getting analytics range:', error);
            throw error;
        }
    }

    /**
     * Get platform breakdown
     * @param {Date} startDate - Start date
     * @param {Date} endDate - End date
     * @returns {Promise<Object>} Platform metrics
     */
    static async getPlatformBreakdown(startDate, endDate) {
        try {
            const db = getDatabase();
            const stmt = db.prepare(`
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
            `);

            const rows = stmt.all(
                startDate.toISOString().split('T')[0],
                endDate.toISOString().split('T')[0]
            );

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
            
            return breakdown;
        } catch (error) {
            console.error('Error getting platform breakdown:', error);
            throw error;
        }
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

        try {
            const db = getDatabase();
            const stmt = db.prepare(`
                SELECT 
                    m.*,
                    c.title,
                    c.published,
                    c.created_at
                FROM growth_content_metrics m
                JOIN content_generated c ON m.content_id = c.id
                ORDER BY m.${metric} DESC
                LIMIT ?
            `);

            const rows = stmt.all(limit);
            
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
            
            return rows;
        } catch (error) {
            console.error('Error getting top content:', error);
            throw error;
        }
    }

    /**
     * Track a conversion event
     * @param {number} contentId - Content ID that led to conversion
     * @param {string} conversionType - Type of conversion (signup, purchase, etc.)
     * @param {Object} metadata - Additional metadata
     */
    static async trackConversion(contentId, conversionType, metadata = {}) {
        return this.trackEvent({
            contentId,
            eventType: 'conversion',
            eventData: { 
                type: conversionType,
                value: metadata.value || null,
                ...metadata.eventData
            },
            ...metadata
        });
    }

    /**
     * Get analytics summary for date range
     * @param {Date} startDate - Start date
     * @param {Date} endDate - End date
     * @returns {Promise<Array>} Summary data by date
     */
    static async getAnalyticsSummary(startDate, endDate) {
        try {
            const db = getDatabase();
            const stmt = db.prepare(`
                SELECT 
                    date,
                    SUM(views) as total_views,
                    SUM(clicks) as total_clicks,
                    SUM(shares) as total_shares,
                    SUM(conversions) as conversions,
                    ROUND(CAST(SUM(clicks) AS FLOAT) / NULLIF(SUM(views), 0) * 100, 2) as click_through_rate
                FROM growth_daily_metrics
                WHERE date >= ? AND date <= ?
                GROUP BY date
                ORDER BY date ASC
            `);

            return stmt.all(
                startDate.toISOString().split('T')[0],
                endDate.toISOString().split('T')[0]
            );
        } catch (error) {
            console.error('Error getting analytics summary:', error);
            throw error;
        }
    }

    /**
     * Get content performance data
     * @param {Date} startDate - Start date
     * @param {Date} endDate - End date
     * @returns {Promise<Array>} Content performance metrics
     */
    static async getContentPerformance(startDate, endDate) {
        try {
            const db = getDatabase();
            const stmt = db.prepare(`
                SELECT 
                    gc.id as content_id,
                    gc.title,
                    gc.type,
                    gc.platform,
                    SUM(gdm.views) as views,
                    SUM(gdm.clicks) as clicks,
                    SUM(gdm.shares) as shares,
                    ROUND(CAST(SUM(gdm.clicks) AS FLOAT) / NULLIF(SUM(gdm.views), 0) * 100, 2) as ctr,
                    gc.created_at
                FROM growth_content gc
                LEFT JOIN growth_daily_metrics gdm ON gc.id = gdm.content_id
                WHERE gdm.date >= ? AND gdm.date <= ?
                GROUP BY gc.id
                ORDER BY views DESC
            `);

            return stmt.all(
                startDate.toISOString().split('T')[0],
                endDate.toISOString().split('T')[0]
            );
        } catch (error) {
            console.error('Error getting content performance:', error);
            throw error;
        }
    }

    /**
     * Get conversion funnel data
     * @param {Date} startDate - Start date
     * @param {Date} endDate - End date
     * @returns {Promise<Array>} Conversion funnel stages
     */
    static async getConversionFunnel(startDate, endDate) {
        try {
            const db = getDatabase();
            
            // Get unique sessions that had views
            const viewSessions = db.prepare(`
                SELECT COUNT(DISTINCT session_id) as count
                FROM growth_analytics_events
                WHERE event_type = 'view' 
                AND created_at >= ? AND created_at <= ?
                AND session_id IS NOT NULL
            `).get(startDate.toISOString(), endDate.toISOString());

            // Get sessions that clicked
            const clickSessions = db.prepare(`
                SELECT COUNT(DISTINCT session_id) as count
                FROM growth_analytics_events
                WHERE event_type = 'click'
                AND created_at >= ? AND created_at <= ?
                AND session_id IS NOT NULL
            `).get(startDate.toISOString(), endDate.toISOString());

            // Get sessions that converted
            const conversionSessions = db.prepare(`
                SELECT COUNT(DISTINCT session_id) as count
                FROM growth_analytics_events
                WHERE event_type = 'conversion'
                AND created_at >= ? AND created_at <= ?
                AND session_id IS NOT NULL
            `).get(startDate.toISOString(), endDate.toISOString());

            const views = viewSessions.count || 0;
            const clicks = clickSessions.count || 0;
            const conversions = conversionSessions.count || 0;

            return [
                {
                    stage: 'Page View',
                    users: views,
                    conversion_rate: 100,
                    drop_off_rate: 0
                },
                {
                    stage: 'Content Click',
                    users: clicks,
                    conversion_rate: views > 0 ? Math.round((clicks / views) * 100) : 0,
                    drop_off_rate: views > 0 ? Math.round(((views - clicks) / views) * 100) : 0
                },
                {
                    stage: 'Sign Up / Conversion',
                    users: conversions,
                    conversion_rate: views > 0 ? Math.round((conversions / views) * 100) : 0,
                    drop_off_rate: clicks > 0 ? Math.round(((clicks - conversions) / clicks) * 100) : 0
                }
            ];
        } catch (error) {
            console.error('Error getting conversion funnel:', error);
            throw error;
        }
    }
}

module.exports = GrowthAnalyticsService;