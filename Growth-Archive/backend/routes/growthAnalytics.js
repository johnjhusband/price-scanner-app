/**
 * Growth Analytics API Routes
 * Handles analytics tracking and reporting endpoints
 */

const express = require('express');
const router = express.Router();
const GrowthAnalyticsService = require('../services/growthAnalytics');

/**
 * Track an event
 * POST /api/growth/analytics/track
 */
router.post('/track', async (req, res) => {
    try {
        const {
            contentId,
            eventType,
            eventSource,
            eventData,
            sessionId
        } = req.body;

        // Get client info
        const userAgent = req.headers['user-agent'] || '';
        const ipAddress = req.ip || req.connection.remoteAddress || '';
        const referrer = req.headers['referer'] || req.headers['referrer'] || '';

        const eventId = await GrowthAnalyticsService.trackEvent({
            contentId,
            eventType,
            eventSource,
            eventData,
            userAgent,
            ipAddress,
            referrer,
            sessionId
        });

        res.json({ 
            success: true, 
            eventId,
            sessionId: sessionId || null 
        });
    } catch (error) {
        console.error('Analytics tracking error:', error);
        res.status(400).json({ 
            success: false, 
            error: error.message 
        });
    }
});

/**
 * Track page view (simplified endpoint)
 * POST /api/growth/analytics/view/:contentId
 */
router.post('/view/:contentId', async (req, res) => {
    try {
        const contentId = parseInt(req.params.contentId);
        const { source = 'direct', sessionId } = req.body;

        const userAgent = req.headers['user-agent'] || '';
        const ipAddress = req.ip || req.connection.remoteAddress || '';
        const referrer = req.headers['referer'] || '';

        await GrowthAnalyticsService.trackView(contentId, {
            eventSource: source,
            userAgent,
            ipAddress,
            referrer,
            sessionId
        });

        res.json({ success: true });
    } catch (error) {
        console.error('View tracking error:', error);
        res.status(400).json({ 
            success: false, 
            error: error.message 
        });
    }
});

/**
 * Track click event
 * POST /api/growth/analytics/click/:contentId
 */
router.post('/click/:contentId', async (req, res) => {
    try {
        const contentId = parseInt(req.params.contentId);
        const { target, source = 'direct', sessionId } = req.body;

        const userAgent = req.headers['user-agent'] || '';
        const ipAddress = req.ip || req.connection.remoteAddress || '';
        const referrer = req.headers['referer'] || '';

        await GrowthAnalyticsService.trackClick(contentId, target, {
            eventSource: source,
            userAgent,
            ipAddress,
            referrer,
            sessionId
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Click tracking error:', error);
        res.status(400).json({ 
            success: false, 
            error: error.message 
        });
    }
});

/**
 * Track share event
 * POST /api/growth/analytics/share/:contentId
 */
router.post('/share/:contentId', async (req, res) => {
    try {
        const contentId = parseInt(req.params.contentId);
        const { platform, sessionId } = req.body;

        const userAgent = req.headers['user-agent'] || '';
        const ipAddress = req.ip || req.connection.remoteAddress || '';

        await GrowthAnalyticsService.trackShare(contentId, platform, {
            userAgent,
            ipAddress,
            sessionId
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Share tracking error:', error);
        res.status(400).json({ 
            success: false, 
            error: error.message 
        });
    }
});

/**
 * Get content metrics
 * GET /api/growth/analytics/metrics/:contentId
 */
router.get('/metrics/:contentId', async (req, res) => {
    try {
        const contentId = parseInt(req.params.contentId);
        const metrics = await GrowthAnalyticsService.getContentMetrics(contentId);
        res.json(metrics);
    } catch (error) {
        console.error('Metrics retrieval error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

/**
 * Get analytics for date range
 * GET /api/growth/analytics/range?start=YYYY-MM-DD&end=YYYY-MM-DD&contentId=123
 */
router.get('/range', async (req, res) => {
    try {
        const { start, end, contentId } = req.query;
        
        if (!start || !end) {
            return res.status(400).json({ 
                success: false, 
                error: 'Start and end dates required' 
            });
        }

        const startDate = new Date(start);
        const endDate = new Date(end);
        
        const analytics = await GrowthAnalyticsService.getAnalyticsForDateRange(
            startDate, 
            endDate, 
            contentId ? parseInt(contentId) : null
        );

        res.json({
            success: true,
            dateRange: { start, end },
            data: analytics
        });
    } catch (error) {
        console.error('Analytics range error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

/**
 * Get platform breakdown
 * GET /api/growth/analytics/platforms?start=YYYY-MM-DD&end=YYYY-MM-DD
 */
router.get('/platforms', async (req, res) => {
    try {
        const { start, end } = req.query;
        
        // Default to last 30 days if not specified
        const endDate = end ? new Date(end) : new Date();
        const startDate = start ? new Date(start) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        
        const breakdown = await GrowthAnalyticsService.getPlatformBreakdown(startDate, endDate);

        res.json({
            success: true,
            dateRange: { 
                start: startDate.toISOString().split('T')[0], 
                end: endDate.toISOString().split('T')[0] 
            },
            platforms: breakdown
        });
    } catch (error) {
        console.error('Platform breakdown error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

/**
 * Get top performing content
 * GET /api/growth/analytics/top?limit=10&metric=total_views
 */
router.get('/top', async (req, res) => {
    try {
        const { limit = 10, metric = 'total_views' } = req.query;
        
        const topContent = await GrowthAnalyticsService.getTopContent(
            parseInt(limit),
            metric
        );

        res.json({
            success: true,
            metric,
            content: topContent
        });
    } catch (error) {
        console.error('Top content error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

/**
 * Generate tracking pixel
 * GET /api/growth/analytics/pixel/:contentId.gif
 */
router.get('/pixel/:contentId.gif', async (req, res) => {
    try {
        const contentId = parseInt(req.params.contentId);
        const { s: source = 'email' } = req.query;

        // Track the view
        const userAgent = req.headers['user-agent'] || '';
        const ipAddress = req.ip || req.connection.remoteAddress || '';
        const referrer = req.headers['referer'] || '';

        await GrowthAnalyticsService.trackView(contentId, {
            eventSource: source,
            userAgent,
            ipAddress,
            referrer,
            eventData: { pixel: true }
        });

        // Return 1x1 transparent GIF
        const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
        res.writeHead(200, {
            'Content-Type': 'image/gif',
            'Content-Length': pixel.length,
            'Cache-Control': 'no-store, no-cache, must-revalidate, private'
        });
        res.end(pixel);
    } catch (error) {
        console.error('Tracking pixel error:', error);
        // Still return pixel even on error
        const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
        res.writeHead(200, { 'Content-Type': 'image/gif' });
        res.end(pixel);
    }
});

module.exports = router;