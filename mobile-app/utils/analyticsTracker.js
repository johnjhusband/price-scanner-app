/**
 * Analytics Tracker for Growth Dashboard
 * Handles client-side analytics tracking
 */

import { Platform } from 'react-native';

class AnalyticsTracker {
    constructor() {
        this.sessionId = this.generateSessionId();
        this.apiUrl = Platform.OS === 'web' ? '' : 'http://localhost:3000';
    }

    /**
     * Generate a unique session ID
     */
    generateSessionId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    /**
     * Get platform source
     */
    getPlatformSource() {
        if (Platform.OS === 'web') {
            // Try to detect referrer
            if (typeof window !== 'undefined' && window.document.referrer) {
                const referrer = window.document.referrer.toLowerCase();
                if (referrer.includes('reddit')) return 'reddit';
                if (referrer.includes('whatnot')) return 'whatnot';
                if (referrer.includes('instagram')) return 'instagram';
                if (referrer.includes('twitter') || referrer.includes('x.com')) return 'twitter';
                if (referrer.includes('facebook')) return 'facebook';
                if (referrer.includes('google')) return 'search';
                return 'referral';
            }
        }
        return 'direct';
    }

    /**
     * Track a page view
     */
    async trackView(contentId) {
        try {
            const response = await fetch(`${this.apiUrl}/api/growth/analytics/view/${contentId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    source: this.getPlatformSource(),
                    sessionId: this.sessionId
                })
            });
            
            if (!response.ok) {
                console.error('Analytics view tracking failed:', response.status);
            }
        } catch (error) {
            console.error('Analytics view tracking error:', error);
        }
    }

    /**
     * Track a click event
     */
    async trackClick(contentId, target) {
        try {
            const response = await fetch(`${this.apiUrl}/api/growth/analytics/click/${contentId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    target,
                    source: this.getPlatformSource(),
                    sessionId: this.sessionId
                })
            });
            
            if (!response.ok) {
                console.error('Analytics click tracking failed:', response.status);
            }
        } catch (error) {
            console.error('Analytics click tracking error:', error);
        }
    }

    /**
     * Track a share event
     */
    async trackShare(contentId, platform) {
        try {
            const response = await fetch(`${this.apiUrl}/api/growth/analytics/share/${contentId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    platform,
                    sessionId: this.sessionId
                })
            });
            
            if (!response.ok) {
                console.error('Analytics share tracking failed:', response.status);
            }
        } catch (error) {
            console.error('Analytics share tracking error:', error);
        }
    }

    /**
     * Track a conversion (e.g., signup from content)
     */
    async trackConversion(contentId, conversionType = 'signup') {
        try {
            const response = await fetch(`${this.apiUrl}/api/growth/analytics/track`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contentId,
                    eventType: 'conversion',
                    eventSource: this.getPlatformSource(),
                    eventData: { type: conversionType },
                    sessionId: this.sessionId
                })
            });
            
            if (!response.ok) {
                console.error('Analytics conversion tracking failed:', response.status);
            }
        } catch (error) {
            console.error('Analytics conversion tracking error:', error);
        }
    }

    /**
     * Get analytics metrics for a content item
     */
    async getContentMetrics(contentId) {
        try {
            const response = await fetch(`${this.apiUrl}/api/growth/analytics/metrics/${contentId}`);
            
            if (response.ok) {
                return await response.json();
            } else {
                console.error('Failed to fetch content metrics:', response.status);
                return null;
            }
        } catch (error) {
            console.error('Error fetching content metrics:', error);
            return null;
        }
    }

    /**
     * Get analytics for date range
     */
    async getAnalyticsRange(startDate, endDate, contentId = null) {
        try {
            let url = `${this.apiUrl}/api/growth/analytics/range?start=${startDate}&end=${endDate}`;
            if (contentId) {
                url += `&contentId=${contentId}`;
            }
            
            const response = await fetch(url);
            
            if (response.ok) {
                return await response.json();
            } else {
                console.error('Failed to fetch analytics range:', response.status);
                return null;
            }
        } catch (error) {
            console.error('Error fetching analytics range:', error);
            return null;
        }
    }

    /**
     * Get platform breakdown
     */
    async getPlatformBreakdown(startDate = null, endDate = null) {
        try {
            let url = `${this.apiUrl}/api/growth/analytics/platforms`;
            const params = new URLSearchParams();
            
            if (startDate) params.append('start', startDate);
            if (endDate) params.append('end', endDate);
            
            if (params.toString()) {
                url += `?${params.toString()}`;
            }
            
            const response = await fetch(url);
            
            if (response.ok) {
                return await response.json();
            } else {
                console.error('Failed to fetch platform breakdown:', response.status);
                return null;
            }
        } catch (error) {
            console.error('Error fetching platform breakdown:', error);
            return null;
        }
    }

    /**
     * Get top performing content
     */
    async getTopContent(limit = 10, metric = 'total_views') {
        try {
            const response = await fetch(
                `${this.apiUrl}/api/growth/analytics/top?limit=${limit}&metric=${metric}`
            );
            
            if (response.ok) {
                return await response.json();
            } else {
                console.error('Failed to fetch top content:', response.status);
                return null;
            }
        } catch (error) {
            console.error('Error fetching top content:', error);
            return null;
        }
    }
}

// Export singleton instance
export default new AnalyticsTracker();