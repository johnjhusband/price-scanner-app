-- Migration: Add comprehensive growth analytics tracking tables
-- Date: 2025-08-15
-- Purpose: Track clicks, shares, and engagement for growth content

-- 1. Create growth_analytics_events table for tracking all interactions
CREATE TABLE IF NOT EXISTS growth_analytics_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content_id INTEGER,
    event_type TEXT NOT NULL, -- 'view', 'click', 'share', 'conversion'
    event_source TEXT, -- 'direct', 'reddit', 'whatnot', 'instagram', 'twitter', etc.
    event_data TEXT, -- JSON data for additional context
    user_agent TEXT,
    ip_address TEXT,
    referrer TEXT,
    session_id TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (content_id) REFERENCES content_generated(id)
);

-- 2. Create growth_content_metrics table for aggregated metrics
CREATE TABLE IF NOT EXISTS growth_content_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content_id INTEGER UNIQUE,
    total_views INTEGER DEFAULT 0,
    unique_views INTEGER DEFAULT 0,
    total_clicks INTEGER DEFAULT 0,
    total_shares INTEGER DEFAULT 0,
    total_conversions INTEGER DEFAULT 0,
    platform_breakdown TEXT, -- JSON: {"reddit": 10, "whatnot": 5, ...}
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (content_id) REFERENCES content_generated(id)
);

-- 3. Create growth_daily_metrics table for time-series data
CREATE TABLE IF NOT EXISTS growth_daily_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date DATE NOT NULL,
    content_id INTEGER,
    platform TEXT,
    views INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    shares INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(date, content_id, platform)
);

-- 4. Add tracking fields to content_generated if they don't exist
-- Check if columns exist before adding (SQLite doesn't support IF NOT EXISTS for ALTER TABLE)
-- These will need to be handled in the migration script

-- 5. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_analytics_events_content ON growth_analytics_events(content_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON growth_analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created ON growth_analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_daily_metrics_date ON growth_daily_metrics(date);
CREATE INDEX IF NOT EXISTS idx_daily_metrics_content ON growth_daily_metrics(content_id);

-- 6. Create trigger to update metrics on new events
CREATE TRIGGER IF NOT EXISTS update_content_metrics_on_event
AFTER INSERT ON growth_analytics_events
BEGIN
    -- Insert or update the metrics row
    INSERT INTO growth_content_metrics (content_id, total_views, total_clicks, total_shares, total_conversions)
    VALUES (
        NEW.content_id,
        CASE WHEN NEW.event_type = 'view' THEN 1 ELSE 0 END,
        CASE WHEN NEW.event_type = 'click' THEN 1 ELSE 0 END,
        CASE WHEN NEW.event_type = 'share' THEN 1 ELSE 0 END,
        CASE WHEN NEW.event_type = 'conversion' THEN 1 ELSE 0 END
    )
    ON CONFLICT(content_id) DO UPDATE SET
        total_views = total_views + CASE WHEN NEW.event_type = 'view' THEN 1 ELSE 0 END,
        total_clicks = total_clicks + CASE WHEN NEW.event_type = 'click' THEN 1 ELSE 0 END,
        total_shares = total_shares + CASE WHEN NEW.event_type = 'share' THEN 1 ELSE 0 END,
        total_conversions = total_conversions + CASE WHEN NEW.event_type = 'conversion' THEN 1 ELSE 0 END,
        last_updated = CURRENT_TIMESTAMP;
END;